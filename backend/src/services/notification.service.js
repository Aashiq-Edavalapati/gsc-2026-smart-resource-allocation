import admin from 'firebase-admin';
import prisma from '../config/db.js';

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
    
    // Log the notification in DB
    await prisma.notification.create({
      data: { userId, type: data.type || 'ISSUE_UPDATED', title, body, data }
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}`, error);
  }
};

export const notifyNearestNGO = async (lat, lng, issueId) => {
  // Find nearest verified org (within 10km) using PostGIS
  const nearestOrgs = await prisma.$queryRaw`
    SELECT id, "name" 
    FROM "Organization"
    WHERE "verificationStatus" = 'VERIFIED'
    AND ST_DWithin(ST_SetSRID(ST_MakePoint(lng, lat), 4326), ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 10000)
    LIMIT 1;
  `;

  if (nearestOrgs.length > 0) {
    const orgId = nearestOrgs[0].id;
    // Find admins of this org and notify them
    const admins = await prisma.organizationMember.findMany({
      where: { organizationId: orgId, baseRole: { in: ['OWNER', 'ADMIN'] } }
    });

    for (const admin of admins) {
      await sendToDevice(admin.userId, "New Nearby Issue", "A citizen reported an issue near your jurisdiction.", { type: 'ISSUE_NEARBY', issueId });
    }
  }
};