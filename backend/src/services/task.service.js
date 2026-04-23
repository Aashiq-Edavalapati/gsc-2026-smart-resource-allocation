import prisma from '../config/db.js';
import { sendNotification } from './notification.service.js';

// ---------- CREATE TASK ----------
export const createTask = async (issueId, membershipId, data) => {
  return prisma.task.create({
    data: {
      issueId,
      title: data.title,
      description: data.description,
      requiredSkills: data.requiredSkills || [],
      volunteersNeeded: data.volunteersNeeded,
      createdByMembershipId: membershipId
    }
  });
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
    include: {
      issue: true
    }
  });

  if (!task) throw new Error('Task not found');

  const volunteers = await prisma.volunteerProfile.findMany({
    include: { user: true }
  });

  return volunteers
    .map(v => {
      const skillMatch = task.requiredSkills.filter(s =>
        v.skills.includes(s)
      ).length;

      const distanceScore = calculateDistanceScore(
        task.issue,
        v.user
      );

      const trustScore = v.trustScore;

      const score =
        skillMatch * 5 +
        distanceScore * 3 +
        trustScore * 0.2;

      return {
        volunteer: v,
        score
      };
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

  return prisma.assignment.create({
    data: {
      volunteerProfileId: volunteer.id,
      taskId,
      status: 'PENDING'
    }
  });
};

// ---------- ASSIGNMENT ----------
export const getAssignment = async (userId, assignmentId) => {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: true,
      volunteer: { include: { user: true } }
    }
  });
};

export const updateAssignment = async (userId, assignmentId, data) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { volunteer: true }
  });

  if (!assignment) throw new Error('Not found');

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data
  });

  // ---------- TRUST SCORE ----------
  if (data.status === 'COMPLETED') {
    await prisma.volunteerProfile.update({
      where: { id: assignment.volunteerProfileId },
      data: { trustScore: { increment: 10 } }
    });

    await prisma.trustScoreLog.create({
      data: {
        userId: assignment.volunteer.userId,
        change: 10,
        reason: 'TASK_COMPLETED'
      }
    });
  }

  return updated;
};

// ---------- VOLUNTEER ----------
export const getMyAssignments = async (userId) => {
  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { userId }
  });

  return prisma.assignment.findMany({
    where: { volunteerProfileId: volunteer.id },
    include: { task: true }
  });
};

// ---------- UTILS ----------
const calculateDistanceScore = (issue, user) => {
  if (!issue || !user.lat) return 0;

  const dx = issue.lat - user.lat;
  const dy = issue.lng - user.lng;

  const dist = Math.sqrt(dx * dx + dy * dy);

  return Math.max(0, 10 - dist);
};