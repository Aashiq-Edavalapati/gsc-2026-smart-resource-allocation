import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticate);

router.post('/ocr', aiController.ocr);
router.post('/transcribe', aiController.transcribe);
router.post('/analyze-survey', aiController.analyzeSurvey);
router.post('/classify-issue', aiController.classifyIssue);

export default router;