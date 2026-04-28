import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

// router.use(verifyFirebaseToken);

router.post('/ocr', aiController.ocr);
router.post('/transcribe', aiController.transcribe);
router.post('/translate', aiController.translate);
router.post('/analyze-survey', aiController.analyzeSurvey);
router.post('/classify-issue', aiController.classifyIssue);
router.post('/generate-report', aiController.generateReport);
router.post('/regenerate-report', aiController.regenerateReport);
router.post(
	'/process-field-report-and-create-issues',
	verifyFirebaseToken,
	upload.fields([
		{ name: 'files', maxCount: 10 },
		{ name: 'docs', maxCount: 10 }
	]),
	aiController.processFieldReportAndCreateIssues
);

export default router;