import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireOrgRole } from '../middleware/orgAuth.js';
import * as issueController from '../controllers/issue.controller.js';

const router = Router();

// ---------- PUBLIC ----------
// (Assuming public means anyone can read, but you may still require a token for the app)
router.get('/', issueController.listIssues);
router.get('/nearby', issueController.getNearbyIssues);
router.get('/map/heatmap', issueController.getHeatmap);
router.get('/:id', issueController.getIssueDetails);
router.get('/:id/collaborators', issueController.getCollaborators);
router.get('/:id/comments', issueController.getComments);

// ---------- AUTH REQUIRED ----------
router.use(verifyFirebaseToken);

// Creation
router.post('/', issueController.createIssue);
router.post('/public-report', issueController.createPublicReport);
router.post('/:id/participate', issueController.addCollaborator); // Adjusted depending on how you handle public participation vs org

// Org actions
// Note: We need a mechanism to ensure the user making the patch request is actually from the ownerOrg.
// A simpler middleware or checking inside the controller is needed since req.params.id here is the ISSUE id, not the ORG id.
router.patch('/:id', issueController.updateIssue); 
router.post('/:id/verify', issueController.triggerVerification); 
router.post('/:id/collaborate', issueController.addCollaborator);

// Comments
router.post('/:id/comments', issueController.addComment);
router.patch('/comments/:commentId', issueController.updateComment); // Note: Route param is commentId
router.delete('/comments/:commentId', issueController.deleteComment);

// Media
router.post('/:id/media', issueController.addMedia);
router.delete('/media/:mediaId', issueController.deleteMedia);

export default router;