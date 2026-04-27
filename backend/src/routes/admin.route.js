import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import { addContactDetails, getPendingOrgs, getStats } from '../controllers/admin.controller.js';

// Note: You need a middleware here to ensure req.user.role === 'PLATFORM_ADMIN'
const requirePlatformAdmin = (req, res, next) => {
  if (req.user.role !== 'PLATFORM_ADMIN') return res.status(403).json({ error: 'Unauthorized' });
  next();
};

const router = Router();
router.use(verifyFirebaseToken, requirePlatformAdmin);

router.get('/organizations/pending', getPendingOrgs);
router.post('/organizations/:id/add-contact', addContactDetails);
router.get('/stats', getStats);

export default router;