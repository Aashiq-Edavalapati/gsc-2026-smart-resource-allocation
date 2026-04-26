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

    const auth = firebaseAuth();
    if (!auth) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    // Firebase verifies the token signature, expiry, etc.
    const decoded = await auth.verifyIdToken(token);

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
