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

export const addContact = async (orgId, email) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, type: true, verificationStatus: true }
  });

  if (!org) throw new Error("Organization not found");

  if (org.type !== 'NGO') {
    throw new Error('Contact details can only be added for NGOs');
  }

  if (org.verificationStatus === 'VERIFIED') {
    throw new Error('Organization is already verified');
  }

  if (!['PENDING', 'CONTACT_ADDED'].includes(org.verificationStatus)) {
    throw new Error('Verification has not been initiated');
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      verifiedEmail: email,
      verificationStatus: 'CONTACT_ADDED',
      verificationOtp: null,
      otpExpiresAt: null,
      otpAttempts: 0
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