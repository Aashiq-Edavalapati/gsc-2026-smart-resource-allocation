import prisma from "../config/db.js";

export const getPendingOrgs = async () => {
  return prisma.organization.findMany({
    where: { verificationStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      documents: true,
      registrationNumber: true
    }
  });
};

export const verifyOrganization = async (orgId) => {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      verificationStatus: 'VERIFIED',
      trustScore: { increment: 50 }
    }
  });
};

export const getPlatformStats = async () => {
  const [totalUsers, totalOrgs, totalIssues, resolvedIssues] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { status: 'RESOLVED' } })
  ]);

  return { totalUsers, totalOrgs, totalIssues, resolvedIssues };
};