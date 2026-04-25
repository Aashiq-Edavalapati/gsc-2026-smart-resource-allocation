import prisma from "../config/db.js";

export const requireOrgRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orgId = req.params.id || req.body.orgId;

      if (!orgId) return res.status(400).json({ error: 'Organization ID required' });

      const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } }
      });

      if (!membership || membership.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, error: 'Not an active member of this organization' });
      }

      if (!allowedRoles.includes(membership.baseRole)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions within the organization' });
      }

      // Attach membership to request for downstream use
      req.orgMembership = membership;
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Authorization error' });
    }
  };
};