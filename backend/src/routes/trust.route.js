import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as trustController from '../controllers/trust.controller.js';

const router = Router();

router.post('/feedback', authenticate, trustController.giveFeedback);
router.get('/trust-scores/leaderboard', trustController.getLeaderboard);

export default router;