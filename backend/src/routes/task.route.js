import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import { requireOrgRole } from '../middlewares/orgAuth.js';
import * as taskController from '../controllers/task.controller.js';

const router = Router();

// ---------- PUBLIC ----------
router.get('/issues/:issueId/tasks', taskController.getTasksByIssue);

// ---------- AUTH ----------
router.use(verifyFirebaseToken);

router.post(
  '/issues/:issueId/tasks',
  requireOrgRole(['OWNER', 'ADMIN']),
  taskController.createTask
);

// ---------- TASK DASHBOARD ----------
router.get(
  '/organizations/:id/tasks',
  requireOrgRole(['OWNER', 'ADMIN']),
  taskController.getOrgTasks
);

router.get(
  '/tasks/:id/applicants',
  requireOrgRole(['OWNER', 'ADMIN']),
  taskController.getApplicants
);

router.get(
  '/tasks/:id/recommended-volunteers',
  requireOrgRole(['OWNER', 'ADMIN']),
  taskController.getRecommendedVolunteers
);

// ---------- APPLY ----------
router.post('/tasks/:taskId/apply', taskController.applyToTask);

// ---------- ASSIGNMENTS ----------
router.get('/assignments/:id', taskController.getAssignment);

router.patch('/assignments/:id', taskController.updateAssignment);

// ---------- VOLUNTEER DASHBOARD ----------
router.get('/volunteers/assignments', taskController.getMyAssignments);

// ---------- APPROVAL (ORG ADMIN ONLY) ----------
router.get('/organization/:orgId/suggested', requireOrgRole(['OWNER', 'ADMIN']), taskController.getSuggestedTasks);
router.post('/:taskId/approve', requireOrgRole(['OWNER', 'ADMIN']), taskController.approveTask);
router.post('/:taskId/reject', requireOrgRole(['OWNER', 'ADMIN']), taskController.rejectTask);

export default router;