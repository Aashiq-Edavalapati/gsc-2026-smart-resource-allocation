import admin from 'firebase-admin';
import prisma from '../config/db.js';

// ---------- SEND ----------
export const sendToDevice = async (userId, title, body, data = {}) => {
  try {
    const tokens = await prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const messages = tokens.map(t => ({
      token: t.token,
      notification: { title, body },
      data: { ...data, timestamp: Date.now().toString() }
    }));

    await admin.messaging().sendEach(messages);

    await prisma.notification.create({
      data: {
        userId,
        type: data.type || 'ISSUE_UPDATED',
        title,
        body,
        data
      }
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}`, error);
  }
};

// ---------- GEO NOTIFY ----------
export const notifyNearestNGO = async (lat, lng, issue) => {
  const nearestOrgs = await prisma.$queryRaw`
    SELECT id
    FROM "Organization"
    WHERE "verificationStatus" = 'VERIFIED'
    AND lat IS NOT NULL AND lng IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      10000
    )
    LIMIT 5
  `;

  if (!nearestOrgs.length) return;

  for (const org of nearestOrgs) {
    const admins = await prisma.organizationMember.findMany({
      where: {
        organizationId: org.id,
        baseRole: { in: ['OWNER', 'ADMIN'] }
      }
    });

    for (const member of admins) {
      await sendToDevice(
        member.userId,
        'New Issue Reported Nearby',
        issue.title,
        { type: 'ISSUE_NEARBY', issueId: issue.id }
      );
    }
  }
};


// ---------- TOKEN MANAGEMENT ----------
export const saveToken = (userId, token) => {
  return prisma.deviceToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token }
  });
};

export const removeToken = (userId, token) => {
  return prisma.deviceToken.deleteMany({
    where: { userId, token }
  });
};

// ---------- HISTORY ----------
export const getHistory = (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

// ---------- READ ----------
export const markRead = async (id, userId) => {
  const notif = await prisma.notification.findUnique({ where: { id } });

  if (!notif || notif.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() }
  });
};

export const markAllRead = (userId) => {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  });
};