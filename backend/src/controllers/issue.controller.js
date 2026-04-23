import * as issueService from '../services/issue.service.js';

// ---------- CREATE ----------
export const createIssue = async (req, res) => {
  try {
    const issue = await issueService.createIssue(req.user.id, req.body, false);
    res.status(201).json({ success: true, data: issue });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const createPublicReport = async (req, res) => {
  try {
    const issue = await issueService.createIssue(req.user.id, req.body, true);
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
    const issues = await issueService.getIssues(req.query);
    res.json({ success: true, data: issues });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getNearbyIssues = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat/lng required' });
    }

    const data = await issueService.getNearbyIssues(lat, lng, radius);
    res.json({ success: true, data });
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
    const data = await issueService.getHeatmap();
    res.json({ success: true, data });
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
    const issue = await issueService.verifyIssue(
      req.user.id,
      req.params.id,
      req.orgMembership.organizationId
    );
    res.json({ success: true, data: issue });
  } catch (e) {
    res.status(403).json({ success: false, error: e.message });
  }
};

// ---------- COLLAB ----------
export const addCollaborator = async (req, res) => {
  try {
    const result = await issueService.addCollaborator(
      req.params.id,
      req.body.orgId
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