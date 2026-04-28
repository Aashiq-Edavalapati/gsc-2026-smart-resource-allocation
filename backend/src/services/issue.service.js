import prisma from '../config/db.js';
import { classifyIssue } from './ai.service.js';
import { notifyNearestNGO } from './notification.service.js';
import { randomUUID } from 'crypto';

const createIssueRecord = async (tx, data, userId, latitude, longitude) => {
  const issueId = data.id || randomUUID();

  const insertedRows = await tx.$queryRaw`
    INSERT INTO "Issue" (
      id,
      title,
      description,
      category,
      urgency,
      city,
      "reporterUserId",
      "ownerOrgId",
      "fieldReportId",
      location
    ) VALUES (
      ${issueId},
      ${data.title},
      ${data.description},
      ${data.category},
      ${Math.max(1, parseInt(data.urgency) || 3)},
      ${data.city},
      ${userId},
      ${data.ownerOrgId || null},
      ${data.fieldReportId || null},
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    )
    RETURNING id
  `;

  const returnedIssueId = insertedRows?.[0]?.id || issueId;

  if (!returnedIssueId) {
    throw new Error('Failed to create issue record');
  }

  const issue = await tx.issue.update({
    where: { id: returnedIssueId },
    data: {
      source: data.source || 'USER',
      verification: data.verification || 'UNVERIFIED',
      approvalStatus: data.approvalStatus || 'SUGGESTED'
    }
  });

  return issue;
};

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
    return createIssueRecord(
      tx,
      {
        title: data.title,
        description: data.description,
        category: data.category,
        urgency: parseInt(data.urgency),
        city: data.city,
        ownerOrgId: data.ownerOrgId || null,
        fieldReportId: data.fieldReportId || null,
        source: data.source || 'USER',
        verification: 'UNVERIFIED',
        approvalStatus: data.approvalStatus || 'SUGGESTED'
      },
      userId,
      parseFloat(data.lat),
      parseFloat(data.lng)
    );
  });

  await notifyNearestNGO(parseFloat(data.lat), parseFloat(data.lng), issue);

  return issue;
};

// Create issues and tasks from AI extraction with SUGGESTED status
export const createIssuesAndTasksFromAI = async (userId, aiData, fieldReportData) => {
  const { lat, lng, city, organizationId, fieldReportId } = fieldReportData;
  const issues = aiData.issues || [];

  const createdIssues = [];

  for (const issueData of issues) {
    try {
      const issue = await prisma.$transaction(async (tx) => {
        const newIssue = await createIssueRecord(
          tx,
          {
            title: issueData.title,
            description: issueData.description,
            category: issueData.category,
            urgency: Math.max(1, Math.min(5, parseInt(issueData.urgency) || 3)),
            city,
            ownerOrgId: organizationId || null,
            fieldReportId: fieldReportId || null,
            source: 'FIELD_REPORT',
            verification: 'AI_VERIFIED',
            approvalStatus: 'SUGGESTED'
          },
          userId,
          parseFloat(lat),
          parseFloat(lng)
        );

        // Create tasks for this issue
        if (issueData.tasks && Array.isArray(issueData.tasks)) {
          const createdTasks = [];
          for (const taskData of issueData.tasks) {
            try {
              const createdTask = await tx.task.create({
                data: {
                  issueId: newIssue.id,
                  title: taskData.title,
                  description: taskData.description || '',
                  category: taskData.category || issueData.category || 'OTHER',
                  requiredSkills: taskData.requiredSkills || [],
                  volunteersNeeded: Math.max(1, parseInt(taskData.volunteersNeeded) || 1),
                  status: 'OPEN',
                  approvalStatus: 'SUGGESTED'
                }
              });

              createdTasks.push(createdTask);
            } catch (taskErr) {
              console.error('Error creating task:', taskErr);
            }
          }

          return {
            ...newIssue,
            tasks: createdTasks
          };
        }

        return {
          ...newIssue,
          tasks: []
        };
      });

      // Set location for the issue
      createdIssues.push(issue);
    } catch (issueErr) {
      console.error('Error creating issue from AI data:', issueErr);
    }
  }

  return createdIssues;
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

// ---------- APPROVAL ----------
export const approveIssue = async (issueId, membershipId) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new Error('Issue not found');

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      approvalStatus: 'APPROVED',
      approvedByMembershipId: membershipId
    }
  });
};

export const rejectIssue = async (issueId, membershipId) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new Error('Issue not found');

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      approvalStatus: 'REJECTED',
      approvedByMembershipId: membershipId
    }
  });
};

export const getSuggestedIssues = async (orgId) => {
  return prisma.issue.findMany({
    where: {
      ownerOrgId: orgId,
      approvalStatus: 'SUGGESTED'
    },
    include: {
      tasks: {
        where: {
          approvalStatus: 'SUGGESTED'
        }
      },
      _count: {
        select: { tasks: true, comments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const deleteMedia = (id) => {
  return prisma.issueMedia.delete({ where: { id } });
};