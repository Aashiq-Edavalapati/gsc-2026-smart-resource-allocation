import prisma from '../config/db.js';
import * as issueService from '../services/issue.service.js';

// ---------- CREATE ----------
export const createIssue = async (req, res) => {
  try {
    // Validate required fields
    const { title, description, category, urgency, lat, lng, city } = req.body;

    if (!title || !description || !category || urgency === undefined || lat === undefined || lng === undefined || !city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, category, urgency, lat, lng, city'
      });
    }

    // Validate category enum
    const validCategories = [
      'HEALTH', 'EDUCATION', 'SANITATION', 'ENVIRONMENT',
      'WOMEN_AND_CHILD', 'DISASTER', 'FOOD', 'OTHER'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate urgency is 1-5
    const urgencyNum = parseInt(urgency);
    if (isNaN(urgencyNum) || urgencyNum < 1 || urgencyNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'urgency must be a number between 1 and 5'
      });
    }

    // Validate lat/lng are valid numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng must be valid numbers'
      });
    }

    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({
        success: false,
        error: 'lat must be between -90 and 90'
      });
    }

    if (lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        error: 'lng must be between -180 and 180'
      });
    }

    // Verify org membership role if ownerOrgId provided
    if (req.body.ownerOrgId) {
      const membership = await issueService.verifyOrgRole(req.user.id, req.body.ownerOrgId);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'You must be an ADMIN or OWNER of this organization'
        });
      }
    }

    const issue = await issueService.createIssue(req.user.id, req.body);
    res.status(201).json({ success: true, data: issue });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const createPublicReport = async (req, res) => {
  try {
    // Validate required fields (same as createIssue)
    const { title, description, category, urgency, lat, lng, city } = req.body;

    if (!title || !description || !category || urgency === undefined || lat === undefined || lng === undefined || !city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, category, urgency, lat, lng, city'
      });
    }

    // Validate category enum
    const validCategories = [
      'HEALTH', 'EDUCATION', 'SANITATION', 'ENVIRONMENT',
      'WOMEN_AND_CHILD', 'DISASTER', 'FOOD', 'OTHER'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate urgency is 1-5
    const urgencyNum = parseInt(urgency);
    if (isNaN(urgencyNum) || urgencyNum < 1 || urgencyNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'urgency must be a number between 1 and 5'
      });
    }

    // Validate lat/lng are valid numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng must be valid numbers'
      });
    }

    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({
        success: false,
        error: 'lat must be between -90 and 90'
      });
    }

    if (lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        error: 'lng must be between -180 and 180'
      });
    }

    const issue = await issueService.createIssue(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Report submitted. Nearby NGOs notified.',
      data: issue
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------- READ ----------
export const listIssues = async (req, res) => {
  try {
    // Validate enum values
    const validCategories = [
      'HEALTH', 'EDUCATION', 'SANITATION', 'ENVIRONMENT',
      'WOMEN_AND_CHILD', 'DISASTER', 'FOOD', 'OTHER'
    ];
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

    if (req.query.category && !validCategories.includes(req.query.category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    if (req.query.status && !validStatuses.includes(req.query.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await issueService.getIssues(req.query);
    res.json({ success: true, data: result.issues, meta: result.meta });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getNearbyIssues = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    // Validate lat/lng are present
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng are required'
      });
    }

    // Validate lat/lng are valid numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng must be valid numbers'
      });
    }

    // Validate lat/lng ranges
    if (latNum < -90 || latNum > 90) {
      return res.status(400).json({
        success: false,
        error: 'lat must be between -90 and 90'
      });
    }

    if (lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        error: 'lng must be between -180 and 180'
      });
    }

    const result = await issueService.getNearbyIssues(latNum, lngNum, parseInt(radius) || 5000);
    res.json({ success: true, data: result.issues, meta: result.meta });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getIssueDetails = async (req, res) => {
  try {
    const issue = await issueService.getIssueById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, error: 'Not found' });

    res.json({ success: true, data: issue });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getHeatmap = async (req, res) => {
  try {
    const { city } = req.query;
    const geojson = await issueService.getHeatmap(city);
    res.json({ success: true, data: geojson });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------- UPDATE ----------
export const updateIssue = async (req, res) => {
  try {
    const issue = await issueService.updateIssue(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: issue });
  } catch (e) {
    res.status(403).json({ success: false, error: e.message });
  }
};

// ---------- VERIFY ----------
export const verifyIssue = async (req, res) => {
  try {
    const issueRecord = await prisma.issue.findUnique({
      where: { id: req.params.id },
      select: { ownerOrgId: true }
    });

    if (!issueRecord) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: issueRecord.ownerOrgId,
        baseRole: { in: ['ADMIN', 'OWNER'] }
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const issue = await issueService.verifyIssue(
      req.user.id,
      req.params.id,
      issueRecord.ownerOrgId
    );
    res.json({ success: true, data: issue });
  } catch (e) {
    res.status(403).json({ success: false, error: e.message });
  }
};

// ---------- COLLAB ----------
export const addCollaborator = async (req, res) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      select: { ownerOrgId: true }
    });

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: issue.ownerOrgId,
        baseRole: { in: ['ADMIN', 'OWNER'] }
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const result = await issueService.addCollaborator(
      req.params.id,
      req.body.orgId,
      req.user.id
    );
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getCollaborators = async (req, res) => {
  try {
    const data = await issueService.getCollaborators(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------- COMMENTS ----------
export const addComment = async (req, res) => {
  const comment = await issueService.addComment(req.params.id, req.user.id, req.body.content);
  res.json({ success: true, data: comment });
};

export const getComments = async (req, res) => {
  const comments = await issueService.getComments(req.params.id);
  res.json({ success: true, data: comments });
};

export const updateComment = async (req, res) => {
  const updated = await issueService.updateComment(
    req.params.commentId,
    req.user.id,
    req.body.content
  );
  res.json({ success: true, data: updated });
};

export const deleteComment = async (req, res) => {
  await issueService.deleteComment(req.params.commentId, req.user.id);
  res.json({ success: true });
};

// ---------- MEDIA ----------
export const addMedia = async (req, res) => {
  const media = await issueService.addMedia(req.params.id, req.body);
  res.json({ success: true, data: media });
};

export const deleteMedia = async (req, res) => {
  await issueService.deleteMedia(req.params.mediaId);
  res.json({ success: true });
};

// ---------- APPROVAL ----------
export const getSuggestedIssues = async (req, res) => {
  try {
    const { orgId } = req.params;

    // Verify user is an admin/owner of this organization
    const membership = await issueService.verifyOrgRole(req.user.id, orgId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You must be an ADMIN or OWNER of this organization'
      });
    }

    const issues = await issueService.getSuggestedIssues(orgId);
    res.json({ success: true, data: issues });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const approveIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { orgId } = req.body;

    // Get the issue
    const issue = await issueService.getIssueById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Verify user is an admin/owner of the issue's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: orgId || issue.ownerOrgId,
        baseRole: { in: ['ADMIN', 'OWNER'] },
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You must be an ADMIN or OWNER of this organization'
      });
    }

    const approved = await issueService.approveIssue(issueId, membership.id);
    res.json({ success: true, data: approved, message: 'Issue approved successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const rejectIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { orgId } = req.body;

    // Get the issue
    const issue = await issueService.getIssueById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Verify user is an admin/owner of the issue's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: orgId || issue.ownerOrgId,
        baseRole: { in: ['ADMIN', 'OWNER'] },
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'You must be an ADMIN or OWNER of this organization'
      });
    }

    const rejected = await issueService.rejectIssue(issueId, membership.id);
    res.json({ success: true, data: rejected, message: 'Issue rejected successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};