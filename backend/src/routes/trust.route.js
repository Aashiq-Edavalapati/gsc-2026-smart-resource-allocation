import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import * as trustController from '../controllers/trust.controller.js';

const router = Router();

router.post('/feedback', verifyFirebaseToken, trustController.giveFeedback);
router.get('/trust-scores/leaderboard', trustController.getLeaderboard);

export default router;