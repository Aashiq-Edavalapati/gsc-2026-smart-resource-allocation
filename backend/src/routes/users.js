import express from 'express';
import prisma from '../config/db.js';
import { firebaseAuth } from '../config/firebase-admin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

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
