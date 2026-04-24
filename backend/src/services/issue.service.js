import prisma from '../config/db.js';
import { setIssueLocation } from '../lib/geo.js';
import { classifyIssue } from './ai.service.js';
import { notifyNearestNGO } from './notification.service.js';

// ---------- CREATE ----------
export const verifyOrgRole = async (userId, orgId) => {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: orgId,
      baseRole: {
        in: ['ADMIN', 'OWNER']
      }
    }
  });

  return !!membership;
};

export const createIssue = async (userId, data) => {
  const issue = await prisma.$transaction(async (tx) => {
    // Create the issue without location (Prisma can't handle PostGIS type)
    const newIssue = await tx.issue.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        urgency: parseInt(data.urgency),
        city: data.city,
        reporterUserId: userId,
        ownerOrgId: data.ownerOrgId || null,
        tags: data.tags || [],
        isPublic: data.isPublic !== false, // default true
        status: 'OPEN',
        verification: 'UNVERIFIED'
      }
    });

    return newIssue;
  });

  // Set location using PostGIS helper after creation
  await setIssueLocation(issue.id, parseFloat(data.lat), parseFloat(data.lng));

  return issue;
};

// ---------- READ ----------
export const getIssues = async (filters) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    ...(filters.city && { city: filters.city }),
    ...(filters.category && { category: filters.category }),
    ...(filters.status && { status: filters.status })
  };

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        ownerOrg: {
          select: { id: true, name: true, trustScore: true }
        },
        _count: {
          select: { comments: true, tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.issue.count({ where })
  ]);

  return {
    issues,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getNearbyIssues = async (lat, lng, radius) => {
  const issues = await prisma.$queryRaw`
    SELECT 
      i.id,
      i.title,
      i.description,
      i.category,
      i.status,
      i.urgency,
      i."priorityScore",
      i."createdAt",
      ST_Y(i.location::geometry) AS lat,
      ST_X(i.location::geometry) AS lng,
      ST_Distance(
        i.location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS distance_meters
    FROM "Issue" i
    WHERE
      ST_DWithin(
        i.location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radius}
      )
    ORDER BY distance_meters ASC
  `;

  return {
    issues,
    meta: {
      count: issues.length,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius)
    }
  };
};

export const getIssueById = async (id) => {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      ownerOrg: {
        select: { 
          id: true, 
          name: true, 
          type: true, 
          trustScore: true, 
          verificationStatus: true 
        }
      },
      collaboratingOrgs: {
        select: { 
          id: true, 
          name: true, 
          type: true, 
          trustScore: true 
        }
      },
      reporterUser: {
        select: { 
          id: true, 
          name: true, 
          trustScore: true 
        }
      },
      media: true,
      comments: {
        include: {
          user: {
            select: { 
              id: true, 
              name: true 
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      tasks: {
        include: {
          _count: {
            select: { assignments: true }
          }
        }
      },
      _count: {
        select: { 
          collaboratingOrgs: true // participants
        }
      }
    }
  });

  if (!issue) return null;

  // Extract lat/lng from PostGIS location
  const geoData = await prisma.$queryRaw`
    SELECT 
      ST_Y(location::geometry) as lat, 
      ST_X(location::geometry) as lng
    FROM "Issue" 
    WHERE id = ${id} AND location IS NOT NULL
  `;

  // Merge lat/lng into response
  if (geoData && geoData.length > 0) {
    issue.lat = geoData[0].lat;
    issue.lng = geoData[0].lng;
  }

  return issue;
};

export const getHeatmap = async (city) => {
  const { getIssuesGeoJSON } = await import('../lib/geo.js');
  return getIssuesGeoJSON(city);
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

export const addCollaborator = async (issueId, orgId, userId) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { collaboratingOrgs: { select: { id: true } } }
  });

  if (!issue) throw new Error('Issue not found');

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: orgId,
      baseRole: { in: ['ADMIN', 'OWNER'] }
    }
  });

  if (!membership) throw new Error('Unauthorized');

  if (issue.collaboratingOrgs.some((org) => org.id === orgId)) {
    return issue;
  }

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      collaboratingOrgs: {
        connect: { id: orgId }
      }
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