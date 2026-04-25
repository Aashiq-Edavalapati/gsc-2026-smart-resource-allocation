import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/subscribe', notificationController.subscribe);
router.delete('/token', notificationController.removeToken);

router.get('/history', notificationController.getHistory);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;