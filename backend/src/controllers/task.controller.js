import * as taskService from '../services/task.service.js';

// ---------- TASK ----------
export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(
      req.params.issueId,
      req.orgMembership.id,
      req.body
    );
    res.status(201).json({ success: true, data: task });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getTasksByIssue = async (req, res) => {
  const data = await taskService.getTasksByIssue(req.params.issueId);
  res.json({ success: true, data });
};

export const getOrgTasks = async (req, res) => {
  const data = await taskService.getOrgTasks(req.params.id);
  res.json({ success: true, data });
};

// ---------- APPLICANTS ----------
export const getApplicants = async (req, res) => {
  const data = await taskService.getApplicants(req.params.id);
  res.json({ success: true, data });
};

// ---------- MATCHING ----------
export const getRecommendedVolunteers = async (req, res) => {
  const data = await taskService.getRecommendedVolunteers(req.params.id);
  res.json({ success: true, data });
};

// ---------- APPLY ----------
export const applyToTask = async (req, res) => {
  try {
    const result = await taskService.applyToTask(req.user.id, req.params.taskId);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

// ---------- ASSIGNMENT ----------
export const getAssignment = async (req, res) => {
  const data = await taskService.getAssignment(req.user.id, req.params.id);
  res.json({ success: true, data });
};

export const updateAssignment = async (req, res) => {
  const data = await taskService.updateAssignment(
    req.user.id,
    req.params.id,
    req.body
  );
  res.json({ success: true, data });
};

// ---------- VOLUNTEER ----------
export const getMyAssignments = async (req, res) => {
  const data = await taskService.getMyAssignments(req.user.id);
  res.json({ success: true, data });
};