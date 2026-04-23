import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireOrgRole } from '../middleware/orgAuth.js';
import * as issueController from '../controllers/issue.controller.js';

const router = Router();

// ---------- PUBLIC ----------
router.get('/', issueController.listIssues);
router.get('/nearby', issueController.getNearbyIssues);
router.get('/map/heatmap', issueController.getHeatmap);
router.get('/:id', issueController.getIssueDetails);
router.get('/:id/comments', issueController.getComments);
router.get('/:id/collaborators', issueController.getCollaborators);

// ---------- AUTH ----------
router.use(authenticate);

// ---------- CREATE ----------
router.post('/', issueController.createIssue);
router.post('/public-report', issueController.createPublicReport);

// ---------- UPDATE / VERIFY ----------
router.patch('/:id', issueController.updateIssue);
router.post('/:id/verify', issueController.verifyIssue);

// ---------- COLLABORATION (ORG ONLY) ----------
router.post('/:id/collaborate', requireOrgRole(['OWNER', 'ADMIN']), issueController.addCollaborator);

// ---------- COMMENTS ----------
router.post('/:id/comments', issueController.addComment);
router.patch('/comments/:commentId', issueController.updateComment);
router.delete('/comments/:commentId', issueController.deleteComment);

// ---------- MEDIA ----------
router.post('/:id/media', issueController.addMedia);
router.delete('/media/:mediaId', issueController.deleteMedia);

export default router;