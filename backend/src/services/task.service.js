import prisma from '../config/db.js';
import { sendToDevice } from './notification.service.js';
import { getIssueCoords, haversineKm } from '../lib/geo.js';

// ---------- CREATE ----------
export const createTask = async (issueId, membershipId, data) => {
  const task = await prisma.task.create({
    data: {
      issueId,
      title: data.title,
      description: data.description,
      category: data.category || 'OTHER',
      requiredSkills: data.requiredSkills || [],
      volunteersNeeded: data.volunteersNeeded,
      createdByMembershipId: membershipId
    }
  });

  matchAndNotifyVolunteers(task).catch(err =>
    console.error('Volunteer matching failed:', err.message)
  );

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

  const issueCoords = await getIssueCoords(task.issueId);

  const volunteers = await prisma.volunteerProfile.findMany({
    include: { user: true }
  });

  return volunteers
    .map(v => {
      const skillMatch = task.requiredSkills.filter(s =>
        v.skills.includes(s)
      ).length;

      let distanceScore = 0;
      if (issueCoords && v.user.lat && v.user.lng) {
        const km = haversineKm(
          Number(issueCoords.lat),
          Number(issueCoords.lng),
          v.user.lat,
          v.user.lng
        );
        distanceScore = Math.max(0, 10 - km / 2);
      }

      // Category-based scoring: check if task category matches volunteer expertise
      let categoryScore = 0;
      if (task.category && v.skills.some(skill => 
        skill.toLowerCase().includes(task.category.toLowerCase()) || 
        task.category.toLowerCase().includes(skill.toLowerCase())
      )) {
        categoryScore = 3; // Bonus for category match
      }

      const score = skillMatch * 5 + distanceScore * 3 + v.trustScore * 0.2 + categoryScore;
      return { volunteer: v, score };
    })
    .filter(({ score }) => score > 0)
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

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { issue: { select: { ownerOrgId: true } } }
  });

  if (task?.issue?.ownerOrgId) {
    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId: task.issue.ownerOrgId,
        baseRole: { in: ['OWNER', 'ADMIN'] }
      }
    });

    for (const admin of admins) {
      await sendToDevice(
        admin.userId,
        'New Task Applicant',
        `A volunteer has applied to one of your tasks.`,
        { type: 'TASK_APPLICANT', taskId }
      );
    }
  }

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
    include: {
      volunteer: true,
      task: { include: { issue: { select: { ownerOrgId: true } } } }
    }
  });

  if (!assignment) throw new Error('Not found');

  const ownerOrgId = assignment.task?.issue?.ownerOrgId;
  if (ownerOrgId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId: ownerOrgId,
        baseRole: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE'
      }
    });

    if (!membership) throw new Error('Unauthorized');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assignment.update({
      where: { id: assignmentId },
      data
    });

    if (data.status === 'APPROVED') {
      await sendToDevice(
        assignment.volunteer.userId,
        'Assignment Approved',
        `You have been approved for task: ${assignment.task?.title || ''}`,
        { type: 'ASSIGNMENT_APPROVED', assignmentId }
      );
    }

    if (data.status === 'REJECTED') {
      await sendToDevice(
        assignment.volunteer.userId,
        'Assignment Update',
        `Your application for a task was not selected.`,
        { type: 'ASSIGNMENT_REJECTED', assignmentId }
      );
    }

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

      await sendToDevice(
        assignment.volunteer.userId,
        'Task Completed',
        'Your contribution has been recorded. Trust score updated.',
        { type: 'ASSIGNMENT_APPROVED', assignmentId }
      );
    }

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
const matchAndNotifyVolunteers = async (task) => {
  const matched = await getRecommendedVolunteers(task.id);
  const top = matched.slice(0, 10);

  for (const { volunteer } of top) {
    await sendToDevice(
      volunteer.userId,
      'New Task Matching Your Skills',
      task.title,
      { type: 'TASK_CREATED', taskId: task.id }
    );
  }
};

// ---------- APPROVAL ----------
export const approveTask = async (taskId, membershipId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  return prisma.task.update({
    where: { id: taskId },
    data: {
      approvalStatus: 'APPROVED',
      approvedByMembershipId: membershipId
    }
  });
};

export const rejectTask = async (taskId, membershipId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  return prisma.task.update({
    where: { id: taskId },
    data: {
      approvalStatus: 'REJECTED',
      approvedByMembershipId: membershipId
    }
  });
};

export const getSuggestedTasks = async (orgId) => {
  return prisma.task.findMany({
    where: {
      issue: { ownerOrgId: orgId },
      approvalStatus: 'SUGGESTED'
    },
    include: {
      issue: {
        select: { id: true, title: true, category: true }
      },
      _count: {
        select: { assignments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};
