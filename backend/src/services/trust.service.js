import prisma from '../config/db.js';

// ---------- FEEDBACK ----------
export const giveFeedback = async ({ assignmentId, score }) => {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.findUnique({
      where: { id: assignmentId },
      include: { volunteer: true }
    });

    if (!assignment) throw new Error("Assignment not found");

    const change = score >= 4 ? 5 : -5;

    await tx.volunteerProfile.update({
      where: { id: assignment.volunteerProfileId },
      data: { trustScore: { increment: change } }
    });

    await tx.trustScoreLog.create({
      data: {
        userId: assignment.volunteer.userId,
        change,
        reason: 'FEEDBACK'
      }
    });

    return true;
  });
};

// ---------- LEADERBOARD ----------
export const getLeaderboard = async () => {
  const volunteers = await prisma.volunteerProfile.findMany({
    orderBy: { trustScore: 'desc' },
    take: 10,
    include: { user: true }
  });

  const orgs = await prisma.organization.findMany({
    orderBy: { trustScore: 'desc' },
    take: 10
  });

  return { volunteers, orgs };
};