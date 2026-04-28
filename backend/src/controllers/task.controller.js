import * as taskService from '../services/task.service.js';
import prisma from '../config/db.js';

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

// ---------- APPROVAL ----------
export const getSuggestedTasks = async (req, res) => {
  try {
    const { orgId } = req.params;

    // Verify user is an admin/owner of this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: orgId,
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

    const tasks = await taskService.getSuggestedTasks(orgId);
    res.json({ success: true, data: tasks });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const approveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { orgId } = req.body;

    // Get the task with its issue
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { issue: true }
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Verify user is an admin/owner of the task's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: orgId || task.issue?.ownerOrgId,
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

    const approved = await taskService.approveTask(taskId, membership.id);
    res.json({ success: true, data: approved, message: 'Task approved successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const rejectTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { orgId } = req.body;

    // Get the task with its issue
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { issue: true }
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Verify user is an admin/owner of the task's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.id,
        organizationId: orgId || task.issue?.ownerOrgId,
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

    const rejected = await taskService.rejectTask(taskId, membership.id);
    res.json({ success: true, data: rejected, message: 'Task rejected successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};