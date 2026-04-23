import prisma from "../config/db.js";
import { classifyIssue } from "./ai.service.js";
import { notifyNearestNGO, sendToDevice } from "./notification.service.js";

export const createIssue = async (userId, data, isPublicReport = false) => {
  // 1. Classify with Gemini
  const aiData = await classifyIssue(data.title, data.description);

  // 2. Insert Issue. Note: Prisma can't directly insert PostGIS Point objects nicely, 
  // so we create the record, then execute a raw update for the geometry.
  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: aiData.summary || data.description,
      category: aiData.category,
      urgency: aiData.urgency,
      priorityScore: aiData.priorityScore,
      source: isPublicReport ? 'USER' : (data.source || 'USER'),
      city: data.city,
      reporterUserId: userId,
      ownerOrgId: data.ownerOrgId || null,
      tags: data.tags || [],
    }
  });

  // 3. Set Geometry using Raw SQL
  if (data.lat && data.lng) {
    await prisma.$executeRaw`
      UPDATE "Issue" 
      SET location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326) 
      WHERE id = ${issue.id}
    `;
  }

  // 4. Trigger workflow for public reports
  if (isPublicReport && data.lat && data.lng) {
    await notifyNearestNGO(data.lat, data.lng, issue.id);
  }

  return issue;
};

export const getIssues = async (filters) => {
  const { city, category, status, verification, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  // We exclude the 'location' field from the standard Prisma select because it throws on Unsupported types
  return prisma.issue.findMany({
    where: {
      ...(city && { city }),
      ...(category && { category }),
      ...(status && { status }),
      ...(verification && { verification })
    },
    skip,
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });
};

export const getNearbyIssues = async (lat, lng, radiusMeters) => {
  // Direct PostGIS ST_DWithin query returning coordinates
  return prisma.$queryRaw`
    SELECT id, title, category, urgency, status, "priorityScore", city,
           ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
    FROM "Issue"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326), ${parseFloat(radiusMeters)})
    ORDER BY urgency DESC
  `;
};

export const getIssueById = async (id) => {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporterUser: { select: { id: true, name: true } },
      ownerOrg: { select: { id: true, name: true, verificationStatus: true } },
      collaboratingOrgs: { select: { id: true, name: true } },
      media: true
    }
  });

  // Fetch coordinates separately if needed
  const coords = await prisma.$queryRaw`SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM "Issue" WHERE id = ${id}`;
  if (coords.length) {
    issue.lat = coords[0].lat;
    issue.lng = coords[0].lng;
  }

  return issue;
};

export const updateIssue = async (id, data) => {
  return prisma.issue.update({ where: { id }, data });
};

export const verifyIssue = async (id, orgId) => {
  const issue = await prisma.issue.update({
    where: { id },
    data: { verification: 'HUMAN_VERIFIED', status: 'IN_PROGRESS' }
  });

  // TODO: Trigger Notification to volunteers in the area that verification happened
  return issue;
};

export const getHeatmap = async () => {
  return prisma.$queryRaw`
    SELECT id, urgency, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
    FROM "Issue"
    WHERE status != 'RESOLVED' AND location IS NOT NULL
  `;
};

// --- Collaborations ---
export const addCollaborator = async (issueId, orgId) => {
  return prisma.issue.update({
    where: { id: issueId },
    data: { collaboratingOrgs: { connect: { id: orgId } } }
  });
};

// --- Comments ---
export const addComment = async (issueId, userId, content) => {
  return prisma.comment.create({ data: { issueId, userId, content } });
};

export const getComments = async (issueId) => {
  return prisma.comment.findMany({
    where: { issueId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  });
};

export const updateComment = async (commentId, userId, content) => {
  return prisma.comment.update({
    where: { id: commentId, userId }, // Ensures user owns comment
    data: { content }
  });
};

export const deleteComment = async (commentId, userId) => {
  return prisma.comment.delete({ where: { id: commentId, userId } });
};

// --- Media ---
export const addMedia = async (issueId, data) => {
  return prisma.issueMedia.create({
    data: { issueId, url: data.url, type: data.type, startTime: data.startTime, endTime: data.endTime }
  });
};

export const deleteMedia = async (mediaId) => {
  return prisma.issueMedia.delete({ where: { id: mediaId } });
};