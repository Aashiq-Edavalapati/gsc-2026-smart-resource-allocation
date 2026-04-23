import prisma from '../config/db.js';
import { sendToDevice } from './notification.service.js';

// ---------- CREATE ----------
export const createTask = async (issueId, membershipId, data) => {
  const task = await prisma.task.create({
    data: {
      issueId,
      title: data.title,
      description: data.description,
      requiredSkills: data.requiredSkills || [],
      volunteersNeeded: data.volunteersNeeded,
      createdByMembershipId: membershipId
    }
  });

  // TODO: Notify nearby volunteers (smart matching)
  return task;
};

// ---------- GET ----------
export const getTasksByIssue = (issueId) => {
  return prisma.task.findMany({
    where: { issueId }
  });
};

export const getOrgTasks = (orgId) => {
  return prisma.task.findMany({
    where: {
      issue: { ownerOrgId: orgId }
    },
    include: { issue: true }
  });
};

// ---------- APPLICANTS ----------
export const getApplicants = (taskId) => {
  return prisma.assignment.findMany({
    where: { taskId },
    include: {
      volunteer: {
        include: { user: true }
      }
    }
  });
};

// ---------- MATCHING ----------
export const getRecommendedVolunteers = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { issue: true }
  });

  if (!task) throw new Error('Task not found');

  const volunteers = await prisma.volunteerProfile.findMany({
    include: { user: true }
  });

  // TODO: Replace with PostGIS-based distance calculation + availability filtering

  return volunteers
    .map(v => {
      const skillMatch = task.requiredSkills.filter(s =>
        v.skills.includes(s)
      ).length;

      const distanceScore = calculateDistanceScore(task.issue, v.user);
      const trustScore = v.trustScore;

      const score =
        skillMatch * 5 +
        distanceScore * 3 +
        trustScore * 0.2;

      return { volunteer: v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
};

// ---------- APPLY ----------
export const applyToTask = async (userId, taskId) => {
  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { userId }
  });

  if (!volunteer) throw new Error('Not a volunteer');

  const existing = await prisma.assignment.findUnique({
    where: {
      volunteerProfileId_taskId: {
        volunteerProfileId: volunteer.id,
        taskId
      }
    }
  });

  if (existing) throw new Error("Already applied");

  const assignment = await prisma.assignment.create({
    data: {
      volunteerProfileId: volunteer.id,
      taskId,
      status: 'PENDING'
    }
  });

  // TODO: Notify org admins about new applicant

  return assignment;
};

// ---------- ASSIGNMENT ----------
export const getAssignment = async (userId, assignmentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: true,
      volunteer: { include: { user: true } }
    }
  });

  if (!assignment) throw new Error("Not found");

  return assignment;
};

export const updateAssignment = async (userId, assignmentId, data) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { volunteer: true }
  });

  if (!assignment) throw new Error('Not found');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assignment.update({
      where: { id: assignmentId },
      data
    });

    if (data.status === 'COMPLETED') {
      await tx.volunteerProfile.update({
        where: { id: assignment.volunteerProfileId },
        data: { trustScore: { increment: 10 } }
      });

      await tx.trustScoreLog.create({
        data: {
          userId: assignment.volunteer.userId,
          change: 10,
          reason: 'TASK_COMPLETED'
        }
      });
    }

    // TODO: Notify volunteer on approval/rejection/completion

    return updated;
  });
};

// ---------- VOLUNTEER ----------
export const getMyAssignments = async (userId) => {
  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { userId }
  });

  if (!volunteer) throw new Error("Not a volunteer");

  return prisma.assignment.findMany({
    where: { volunteerProfileId: volunteer.id },
    include: { task: true }
  });
};

// ---------- UTILS ----------
const calculateDistanceScore = (issue, user) => {
  // TODO: Replace with PostGIS distance calculation
  if (!issue || !user.lat || !user.lng) return 0;

  // fallback mock logic
  return 5;
};