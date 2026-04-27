import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import { requireOrgRole } from '../middlewares/orgAuth.js';
import * as orgController from '../controllers/org.controller.js';

const router = Router();

// ---------- PUBLIC ----------
router.get('/', orgController.listOrgs);

// STATIC ROUTES FIRST (avoid shadowing)
router.get('/invites', verifyFirebaseToken, orgController.getUserInvites);
router.post('/invites/:inviteId/accept', verifyFirebaseToken, orgController.acceptOrgInvite);

// ---------- DYNAMIC PUBLIC ----------
router.get('/:id', orgController.getOrg);

// ---------- AUTH REQUIRED ----------
router.use(verifyFirebaseToken);

// ---------- ORG CRUD ----------
router.post('/', orgController.createOrg);
router.patch('/:id', requireOrgRole(['OWNER', 'ADMIN']), orgController.updateOrg);
router.delete('/:id', requireOrgRole(['OWNER']), orgController.deleteOrg);

// ---------- MEMBERS ----------
router.get('/:id/members', requireOrgRole(['ADMIN', 'OWNER']), orgController.getMembers);

router.patch(
  '/:id/members/:userId',
  requireOrgRole(['OWNER', 'ADMIN']),
  orgController.updateMemberRole
);

router.delete(
  '/:id/members/:userId',
  requireOrgRole(['OWNER', 'ADMIN']),
  orgController.removeMember
);

// ---------- LEAVE ----------
router.post('/:id/leave', orgController.leaveOrganization);

// ---------- INVITES (ORG-SCOPED) ----------
router.post('/:id/invite', requireOrgRole(['OWNER', 'ADMIN']), orgController.inviteMember);

// ---------- VERIFICATION ----------
router.post("/:id/initiate-verification", requireOrgRole(['OWNER']), orgController.initiateVerification);
router.post("/:id/send-otp", requireOrgRole(['OWNER']), orgController.sendOtp);
router.post('/:id/verify-otp', requireOrgRole(['OWNER']), orgController.verifyOtp);

// ---------- DASHBOARD ----------
router.get('/:id/dashboard', requireOrgRole(['ADMIN', 'OWNER']), orgController.getOrgDashboard);

export default router;