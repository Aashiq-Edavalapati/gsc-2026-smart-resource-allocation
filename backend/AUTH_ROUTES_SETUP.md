# Firebase + Postgres/PostGIS Architecture for GSC

**Key Insight**: Firebase handles 100% of authentication. Your backend only verifies tokens and manages application data (issues, volunteers, organizations). Postgres+PostGIS is purely for storing location-based data.

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Start Postgres + PostGIS
cd backend
docker compose up -d

# 2. Wait ~10s for healthcheck, then init database
npx prisma migrate dev --name init

# 3. Install firebase-admin
npm install firebase-admin

# 4. Create .env file (see Step 1)
# 5. Start backend
npm run dev

# 6. In new terminal, start frontend
cd ../frontend
npm start
```

Then open `http://localhost:4200` and test login!

---

## 🏗️ Architecture Overview

```
[Frontend - Angular]
  ↓ (user enters email/password or clicks Google)
[Firebase SDK]
  ↓ (generates ID token)
[Backend - Express]
  ↓ (verifies token with firebase-admin)
[PostgreSQL + PostGIS]
  ↓ (stores User, Issues, Organizations, Tasks, Assignments)
```

**Firebase Never Sees Your Backend.**  
**Your Backend Never Sees a Password.**  
Only ID tokens flow between frontend and backend.

---

## ✅ Why This Approach?

- ✅ **No passwords in backend** — Firebase owns all auth, you verify tokens only
- ✅ **No session management** — Firebase SDK handles it on client
- ✅ **Scales for hackathon** — Docker Postgres starts in seconds
- ✅ **PostGIS included** — Location-based queries work immediately
- ✅ **Email + Google auth** — Both built-in, no configuration needed
- ✅ **Future-proof** — Add Phone OTP, 2FA later without changing backend
- ✅ **Backend focused on data** — Only issue, volunteer, organization CRUD

---

## 🐳 Step 0: Docker Setup for Postgres + PostGIS

Create `backend/docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3
    container_name: gsc_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: gsc_user
      POSTGRES_PASSWORD: gsc_pass
      POSTGRES_DB: gsc_db
      POSTGRES_INITDB_ARGS: "-c shared_preload_libraries=postgis"
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gsc_user -d gsc_db"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
```

Start it:
```bash
cd backend
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
# Output: gsc_db   postgis/postgis:15-3.3   Up (healthy)
```

---

## 🔑 Step 1: Environment Setup

Create `backend/.env`:

```env
DATABASE_URL="postgresql://gsc_user:gsc_pass@localhost:5432/gsc_db"
FIREBASE_PROJECT_ID=gsc-2026-fea7c
PORT=5000
NODE_ENV=development
```

---

## 🚀 Step 2: Initialize Prisma & Enable PostGIS

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create initial migration (this creates your schema)
npx prisma migrate dev --name init

# This will:
# 1. Wait for Postgres to be healthy (docker healthcheck)
# 2. Create all tables
# 3. Create migration file at prisma/migrations/<timestamp>_init/
```

Open the generated migration file: `prisma/migrations/<timestamp>_init/migration.sql`

**Add this line at the very top** (before any CREATE TABLE statements):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- rest of migration below...
```

Then apply it:
```bash
npx prisma migrate deploy
```

Verify PostGIS is enabled:
```bash
psql postgresql://gsc_user:gsc_pass@localhost:5432/gsc_db -c "SELECT PostGIS_version();"
```

---

## 📦 Step 3: Firebase Admin Configuration

Create `src/config/firebase-admin.js`:

```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../gsc-2026-fea7c-firebase-adminsdk-fbsvc-fb71fee9ba.json'),
    'utf8'
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gsc-2026-fea7c',
  });
}

export const firebaseAuth = admin.auth();
```

export const firebaseAuth = admin.auth();
```

---

## 🔐 Step 4: Auth Middleware

Create `src/middlewares/auth.js`:

**This is the ONLY backend auth logic needed.** It verifies Firebase tokens — that's it.

```javascript
import { firebaseAuth } from '../config/firebase-admin.js';
import prisma from '../config/db.js';

/**
 * Middleware to verify Firebase ID token and attach user to request
 * 
 * Frontend sends: Authorization: Bearer <Firebase ID Token>
 * Backend does:
 *   1. Verify token with firebase-admin (never expires if fresh)
 *   2. Look up user in Postgres by providerId (Firebase UID)
 *   3. Attach to req.user so route handlers can access it
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    // Firebase verifies the token signature, expiry, etc.
    const decoded = await firebaseAuth.verifyIdToken(token);

    // Look up user in Postgres by Firebase UID (stored in providerId)
    const user = await prisma.user.findFirst({
      where: { providerId: decoded.uid }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Call POST /api/users/sync after Firebase login.' 
      });
    }

    // Attach both Firebase decoded token and Postgres user
    req.firebaseUser = decoded;
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

---

## 👤 Step 5: User Routes

Create `src/routes/users.js`:

```javascript
import express from 'express';
import prisma from '../config/db.js';
import { firebaseAuth } from '../config/firebase-admin.js';
import { verifyFirebaseToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/users/sync
 * 
 * Called by frontend **immediately after** Firebase authentication
 * (email signup, email login, or Google login)
 * 
 * Purpose: Upsert user into Postgres for the first time
 * Idempotent — safe to call multiple times
 * 
 * Flow:
 *   Frontend: Firebase auth → get ID token
 *   Frontend: POST /sync with token
 *   Backend: Verify token, check if user exists in DB
 *   Backend: If first login, CREATE user row
 *   Backend: Return user data
 */
router.post('/sync', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await firebaseAuth.verifyIdToken(token);
    const { uid, email, name, firebase } = decoded;

    // Detect auth provider from Firebase token
    // google.com = Google OAuth, password = Email/Password
    const signInProvider = firebase?.sign_in_provider;
    const authProvider = signInProvider === 'google.com' ? 'GOOGLE' : 'EMAIL';

    // Check if user already exists in DB by Firebase UID
    let user = await prisma.user.findFirst({
      where: { providerId: uid }
    });

    if (!user) {
      // First login — create user in PostgreSQL
      // name is REQUIRED in schema, fallback gracefully
      const displayName = name || email?.split('@')[0] || 'User';

      user = await prisma.user.create({
        data: {
          name: displayName,
          email: email,
          authProvider: authProvider,
          providerId: uid,
          // passwordHash stays null for all providers (Firebase owns passwords)
        }
      });
    }

    res.status(200).json({
      message: 'User synced successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        trustScore: user.trustScore,
        city: user.city,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ 
        error: 'Email already registered with a different provider. Try logging in instead.' 
      });
    }

    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

/**
 * GET /api/users/me
 * Get current authenticated user's profile
 * 
 * Requires: Authorization: Bearer <idToken>
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        volunteerProfile: true,
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        trustScore: user.trustScore,
        city: user.city,
        lat: user.lat,
        lng: user.lng,
        volunteerProfile: user.volunteerProfile,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/me
 * Update current user's profile (name, location, etc.)
 * 
 * Requires: Authorization: Bearer <idToken>
 */
router.put('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, city, lat, lng } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(city && { city }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        updatedAt: new Date(),
      }
    });

    res.json({
      message: 'Profile updated',
      user: updated
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * GET /api/users/:id
 * Get any user's public profile (no auth required)
 * Returns public data only — excludes email, location, sensitive fields
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        role: true,
        trustScore: true,
        city: true,
        createdAt: true,
        volunteerProfile: true,
        // Intentionally exclude: email, lat, lng, deletedAt, authProvider
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
```

---

## 🔗 Step 6: Register Routes

Update `src/index.js`:

```javascript
import express from "express";
import prisma from "./config/db.js";
import usersRouter from "./routes/users.js";

const app = express();

app.use(express.json());

// DB connection check
async function checkDBConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("✅ Backend API is running 🚀");
});

// Register user routes
app.use("/api/users", usersRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

checkDBConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
```

---

## 📦 Step 7: Install Dependencies

```bash
cd backend
npm install firebase-admin
```

---

## 🌐 Step 8: Complete Angular Login Component

Create `frontend/src/app/components/login.component.ts`:

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome</h1>
        <p class="text-gray-600 text-center mb-8">Sign in to your account</p>

        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {{ error() }}
          </div>
        }

        <!-- Tabs -->
        <div class="flex gap-2 mb-6 border-b border-gray-200">
          <button
            (click)="setAuthMode('email')"
            [class]="'flex-1 py-2 px-1 border-b-2 font-medium transition-colors ' +
              (authMode() === 'email' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700')"
          >
            Email
          </button>
          <button
            (click)="setAuthMode('google')"
            [class]="'flex-1 py-2 px-1 border-b-2 font-medium transition-colors ' +
              (authMode() === 'google' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700')"
          >
            Google
          </button>
        </div>

        <!-- EMAIL MODE -->
        @if (authMode() === 'email') {
          <form (ngSubmit)="onEmailLogin()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading() ? 'Signing in...' : 'Sign In' }}
            </button>

            <p class="text-center text-sm text-gray-600">
              Don't have an account?
              <button
                type="button"
                (click)="setAuthMode('email'); isSignup.set(true)"
                class="text-blue-600 hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          </form>
        }

        <!-- GOOGLE MODE -->
        @if (authMode() === 'google') {
          <button
            (click)="onGoogleLogin()"
            [disabled]="isLoading()"
            class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ isLoading() ? 'Connecting...' : 'Sign in with Google' }}
          </button>
        }
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // UI State
  authMode = signal<'email' | 'google'>('email');
  isSignup = signal(false);
  isLoading = signal(false);
  error = signal<string>('');

  // Email fields
  email = '';
  password = '';

  setAuthMode(mode: 'email' | 'google') {
    this.authMode.set(mode);
    this.error.set('');
    this.isSignup.set(false);
  }

  // ==================== EMAIL ====================
  async onEmailLogin() {
    try {
      this.isLoading.set(true);
      this.error.set('');

      if (this.isSignup()) {
        await this.authService.signup(this.email, this.password);
      } else {
        await this.authService.login(this.email, this.password);
      }

      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err || 'Authentication failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== GOOGLE ====================
  async onGoogleLogin() {
    try {
      this.isLoading.set(true);
      this.error.set('');
      
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err || 'Google sign-in failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

---

## 🌐 Step 9: Updated Angular Auth Service

Update `frontend/src/app/services/auth.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = firebaseAuth;
  private apiUrl = 'http://localhost:5000/api/users';

  authUser = signal<any>(null);
  isLoggedIn = signal(false);
  isLoading = signal(true);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      this.authUser.set(user);
      this.isLoggedIn.set(!!user);
      this.isLoading.set(false);
    });
  }

  // ==================== EMAIL ====================
  async signup(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  // ==================== GOOGLE ====================
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.syncWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  // ==================== SYNC ====================
  private async syncWithBackend(user: any) {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Backend sync failed');
      }

      return response.json();
    } catch (error: any) {
      console.error('Backend sync error:', error);
      throw error;
    }
  }

  // ==================== GENERAL ====================
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.getErrorMessage(error);
    }
  }

  getCurrentUser() {
    return this.authUser();
  }

  private getErrorMessage(error: any): string {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email',
      'auth/network-request-failed': 'Network error — check your connection',
      'auth/too-many-requests': 'Too many failed attempts — try again later',
    };

    return errorMap[error.code] || error.message || 'Authentication failed';
  }
}
```

---

## 📝 API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/users/sync` | ✅ Token | Sync Firebase user (Email/Google) to PostgreSQL |
| GET | `/api/users/me` | ✅ Token | Get current user profile |
| PUT | `/api/users/me` | ✅ Token | Update current user profile |
| GET | `/api/users/:id` | ❌ No | Get public user profile |

---

## 🧪 Testing with cURL

### Sync after Firebase login (Email or Google)
```bash
# Get Firebase ID token first, then:
curl -X POST http://localhost:5000/api/users/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### Get current user
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

## 🔄 Complete End-to-End Auth Flow

```
USER INTERACTION TIMELINE
══════════════════════════════════════════════════════════════

[CLIENT SIDE — 0ms]
User clicks "Sign in with Email" or "Sign in with Google"

[FIREBASE SDK — 100ms]
→ Email: User enters password, Firebase validates
→ Google: Popup opens, user grants permission
Firebase creates ID token (valid for 1 hour)

[CLIENT SIDE — 200ms]
Angular captures token via: const idToken = await user.getIdToken()

[NETWORK — 250ms]
Frontend POST /api/users/sync with:
  Authorization: Bearer <Firebase ID Token>

[BACKEND — 300ms]
Verify token signature with firebase-admin (never touches Firebase again)
Extract: uid, email, name, authProvider

[DATABASE — 350ms]
Check: Does providerId (Firebase UID) exist in User table?
  → YES: Return existing user data
  → NO: Create new user with:
     id: cuid() generated by Prisma
     providerId: Firebase UID
     email: from token
     authProvider: EMAIL or GOOGLE
     All other fields default or null

[NETWORK RETURN — 400ms]
Backend returns synced user profile

[CLIENT SIDE — 450ms]
Store in authUser signal
Navigate to /dashboard
Render authenticated UI

TOTAL TIME: ~450ms from button click to dashboard
```

---

## 🚀 Production Ready Notes

### During Hackathon (Local Docker)
- Use Docker Postgres as shown
- `.env` points to `localhost:5432`
- `docker compose up -d` starts everything

### After Hackathon (Managed Database)
If you win and want to deploy:

1. **Neon** (easiest Postgres + PostGIS):
   ```
   Sign up → Create Postgres project → Copy connection string to .env
   DATABASE_URL="postgresql://user:password@neon.example.com/mydb"
   npx prisma migrate deploy
   Done!
   ```

2. **Google Cloud Run** (backend):
   ```
   gcloud run deploy gsc-backend \
     --source . \
     --set-env-vars DATABASE_URL=<neon_url>,FIREBASE_PROJECT_ID=gsc-2026-fea7c
   ```

3. **Firebase Hosting** (frontend):
   ```
   npm run build
   firebase deploy --only hosting
   ```

**The beauty**: Your code doesn't change. Just update `.env` and deploy!

---

## ✅ Critical Checklist

### Backend Setup
- [ ] Docker running: `docker compose up -d`
- [ ] Postgres healthcheck passing: `docker compose ps` → `(healthy)`
- [ ] PostGIS extension enabled in first migration: `CREATE EXTENSION IF NOT EXISTS postgis;`
- [ ] Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Firebase service account JSON in backend root
- [ ] `.env` file configured with `DATABASE_URL` and `FIREBASE_PROJECT_ID`
- [ ] `firebase-admin` installed: `npm install firebase-admin`
- [ ] `src/config/firebase-admin.js` created
- [ ] `src/middlewares/auth.js` created (token verification only)
- [ ] `src/routes/users.js` created (with `/sync` endpoint)
- [ ] `src/index.js` registers user routes
- [ ] Backend running: `npm run dev`

### Frontend Setup
- [ ] `firefox.config.ts` has Firebase credentials
- [ ] `auth.service.ts` has `login()`, `signup()`, `loginWithGoogle()`, `syncWithBackend()`
- [ ] `login.component.ts` has Email & Google auth tabs
- [ ] `Dashboard` component created (any authenticated route)
- [ ] Routes configured with `authGuard` for protected pages
- [ ] Frontend running: `npm start`

### Testing
- [ ] Can sign up with email
- [ ] Can log in with email
- [ ] Can sign in with Google
- [ ] User synced to PostgreSQL (check `psql` User table)
- [ ] Can call `/api/users/me` with token
- [ ] Can update profile via PUT `/api/users/me`

---

## 🐛 Troubleshooting

### Docker Issues
| Issue | Fix |
|-------|-----|
| `docker: command not found` | Install [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| `docker compose ps` shows `(unhealthy)` | Wait 30s: `docker compose logs db` to see startup errors |
| Port 5432 already in use | Change `docker-compose.yml` port to `5433:5432` and update `.env` |
| Can't connect to Postgres | Ensure `.env` DATABASE_URL matches docker-compose credentials |

### Prisma/Postgres Issues
| Issue | Cause | Fix |
|-------|-------|-----|
| `Connection timeout` | Postgres not ready yet | `docker compose logs db` — check healthcheck |
| `relation "User" does not exist` | Migrations not applied | `npx prisma migrate deploy` |
| PostGIS `geometry` field fails | Extension not enabled | Add `CREATE EXTENSION IF NOT EXISTS postgis;` to migration SQL file top |
| `23505: duplicate key value` | Unique constraint violation | User exists with different provider — ask them to log in instead |

### Firebase Issues
| Issue | Cause | Fix |
|-------|-------|-----|
| "User not found in database" | Frontend logged in but didn't call `/sync` | Check auth.service.ts calls `syncWithBackend()` |
| "Invalid or expired token" | Token older than 1 hour | `user.getIdToken(true)` forces refresh |
| Google popup blocked | Browser popup blocker | Whitelist your localhost domain |
| Firebase service account error | JSON file missing or corrupt | Download fresh from Firebase Console → Project Settings |

---

## 🎯 For Hackathon Judges

When demoing:

1. **Show auth working**: Sign up with email → Create account → See name in navbar
2. **Show Google OAuth**: Click "Sign in with Google" → Pop up → Logged in
3. **Show async/location data waiting**: "Issues can store locations with PostGIS" → TODO for next phase
4. **Explain architecture**: "Firebase handles all passwords. Backend only verifies tokens. Postgres purely stores app data."

Your auth is now production-ready. Focus your hackathon time on the **issues, volunteers, matching algorithms**!

---

## 📚 Next Steps

1. ✅ Set up Docker + Postgres + PostGIS
2. ✅ Implement Email + Google auth (this guide)
3. ✅ Test all flows work locally
4. 🚀 Build `/issues` routes with PostGIS location queries
5. 🚀 Build `/tasks` and `/assignments` for volunteer matching
6. 🚀 Create `/organizations` routes with role-based access
7. 🚀 Build the volunteer matching algorithm
8. 🚀 Deploy to Neon + Cloud Run (if winning)
