# Firebase Authentication Setup - Quick Reference

## ✅ What Was Done (Minimal Changes)

### Files Created:
1. **`src/firebase.config.ts`** - Firebase initialization
2. **`src/app/services/auth.service.ts`** - Auth logic (signup, login, logout, state management)
3. **`src/app/guards/auth.guard.ts`** - Route protection
4. **`src/app/components/login.component.ts`** - Login UI

### Files Modified:
1. **`src/app/app.config.ts`** - Added AuthService provider
2. **`src/app/app.ts`** - Added logout method & injected AuthService
3. **`src/app/app.routes.ts`** - Added login route & auth guard
4. **`src/app/app.html`** - Added navbar with user email & logout button

---

## IMPORTANT: Update Firebase Config

Edit `src/firebase.config.ts` with your actual credentials from `gsc-2026-fea7c-firebase-adminsdk-fbsvc-fb71fee9ba.json`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📋 Backend Integration Plan

### 1. Create User Profile in Prisma
Add to `backend/prisma/schema.prisma`:
```prisma
model User {
  id        String   @id @default(cuid())
  uid       String   @unique // Firebase UID
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Sync Firebase User to Backend
When user logs in, call your backend:
```typescript
// In auth.service.ts after login
const user = await this.authService.login(email, password);
await fetch('/api/users/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${await user.getIdToken()}` },
  body: JSON.stringify({ uid: user.uid, email: user.email })
});
```

### 3. Backend Endpoints Needed
Create these in your Express backend:
- `POST /api/users/sync` - Create/update user profile
- `GET /api/users/me` - Get current user profile
- `POST /api/auth/verify` - Verify Firebase token

---

## 🚀 Usage

### Login
Navigate to `/login` and enter credentials

### Protected Routes
Add `canActivate: [authGuard]` to any route to require login:
```typescript
{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
```

### Access Auth State in Components
```typescript
constructor(private authService: AuthService) {}

isLoggedIn$ = this.authService.isLoggedIn;
user$ = this.authService.authUser;
```

---

## 📦 Dependencies Added
- `firebase` - Firebase SDK
- `@angular/fire` - Angular Firebase bindings

---

## ⚡ Next Steps

1. ✅ Update Firebase config with real credentials
2. ✅ Add migration for User table in Prisma
3. ✅ Create backend sync endpoints
4. ✅ Add token verification middleware in backend
5. ✅ Create dashboard component to replace placeholder
6. ✅ Add error handling & validations
