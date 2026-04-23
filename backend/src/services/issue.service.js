import prisma from '../config/db.js';
import { classifyIssue } from './ai.service.js';
import { notifyNearestNGO } from './notification.service.js';

// ---------- CREATE ----------
export const createIssue = async (userId, data, isPublic) => {
  const ai = await classifyIssue(`${data.title} ${data.description}`);

  const issue = await prisma.$transaction(async (tx) => {

    if (data.ownerOrgId) {
      const membership = await tx.organizationMember.findFirst({
        where: {
          organizationId: data.ownerOrgId,
          userId
        }
      });

      if (!membership) {
        throw new Error("Not part of organization");
      }
    }

    const issue = await tx.issue.create({
      data: {
        title: data.title,
        description: data.description,
        aiSummary: ai.summary,
        category: ai.category,
        urgency: ai.urgency,
        priorityScore: ai.priorityScore,
        city: data.city,
        reporterUserId: userId,
        ownerOrgId: data.ownerOrgId || null,
        source: isPublic ? 'USER' : 'ORG_MEMBER',
        fieldReportId: data.fieldReportId || null
      }
    });

    if (data.lat && data.lng) {
      await tx.$executeRaw`
        UPDATE "Issue"
        SET location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
        WHERE id = ${issue.id}
      `;
    }

    return issue;
  });

  if (isPublic && data.lat && data.lng) {
    await notifyNearestNGO(data.lat, data.lng, issue.id);
  }

  return issue;
};

// ---------- READ ----------
export const getIssues = (filters) => {
  return prisma.issue.findMany({
    where: {
      deletedAt: null,
      ...(filters.city && { city: filters.city }),
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status })
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getNearbyIssues = (lat, lng, radius) => {
  return prisma.$queryRaw`
    SELECT id, title, urgency,
      ST_X(location::geometry) as lng,
      ST_Y(location::geometry) as lat
    FROM "Issue"
    WHERE location IS NOT NULL
    AND ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radius}
    )
  `;
};

export const getIssueById = async (id) => {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      ownerOrg: true,
      collaboratingOrgs: true,
      media: true
    }
  });
};

export const getHeatmap = () => {
  return prisma.$queryRaw`
    SELECT urgency,
      ST_X(location::geometry) as lng,
      ST_Y(location::geometry) as lat
    FROM "Issue"
    WHERE status != 'RESOLVED'
    AND location IS NOT NULL
  `;
};

// ---------- UPDATE ----------
export const updateIssue = async (userId, issueId, data) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });

  if (!issue) throw new Error("Issue not found");
  if (issue.reporterUserId !== userId) throw new Error("Unauthorized");

  return prisma.issue.update({
    where: { id: issueId },
    data
  });
};

// ---------- VERIFY ----------
export const verifyIssue = async (userId, issueId, orgId) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });

  if (!issue) throw new Error("Issue not found");
  if (issue.ownerOrgId !== orgId) throw new Error("Unauthorized");

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      verification: 'HUMAN_VERIFIED',
      status: 'IN_PROGRESS'
    }
  });
};

// ---------- COMMENTS ----------
export const addComment = (issueId, userId, content) => {
  return prisma.comment.create({
    data: { issueId, userId, content }
  });
};

export const getComments = (issueId) => {
  return prisma.comment.findMany({
    where: { issueId },
    include: { user: true }
  });
};

export const updateComment = async (id, userId, content) => {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment || comment.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.comment.update({
    where: { id },
    data: { content }
  });
};

export const deleteComment = async (id, userId) => {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment || comment.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.comment.delete({ where: { id } });
};

// ---------- MEDIA ----------
export const addMedia = (issueId, data) => {
  return prisma.issueMedia.create({
    data: { issueId, ...data }
  });
};

export const deleteMedia = (id) => {
  return prisma.issueMedia.delete({ where: { id } });
};