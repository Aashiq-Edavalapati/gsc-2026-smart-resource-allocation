import crypto from "crypto";
import { sendOtpMail } from "../utils/sendMail.js";
import { sendInviteMail } from "../utils/sendMail.js";
import prisma from "../config/db.js";

export const createOrganization = async (userId, data) => {
  // Using a transaction to ensure both the org and the owner are created together
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        city: data.city,
        lat: data.lat,
        lng: data.lng,
        verificationStatus: 'UNVERIFIED', 
      }
    });

    await tx.organizationMember.create({
      data: {
        userId,
        organizationId: org.id,
        baseRole: 'OWNER',
        status: 'ACTIVE'
      }
    });

    return org;
  });
};

export const getOrganizations = async (filters) => {
  const { type, city, verificationStatus, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(type && { type }),
    ...(city && { city }),
    ...(verificationStatus && { verificationStatus })
  };

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({ where, skip, take: Number(limit) }),
    prisma.organization.count({ where })
  ]);

  return { orgs, total, page, totalPages: Math.ceil(total / limit) };
};

export const getOrganizationDetails = async (orgId) => {
  return prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { members: true, ownedIssues: true }
      }
    }
  });
};

export const updateOrganization = async (orgId, updateData) => {
  return prisma.organization.update({
    where: { id: orgId },
    data: updateData
  });
};

export const deleteOrganization = async (orgId) => {
  // Cascades will handle members, but double check schema onDelete constraints later
  return prisma.organization.delete({
    where: { id: orgId }
  });
};

// --- INVITES & MEMBERS ---
export const inviteUserToOrg = async (orgId, email, role) => {
  // 1. Get org details (needed for email)
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true }
  });

  if (!org) throw new Error("Organization not found");

  const existing = await prisma.organizationInvite.findFirst({
    where: {
      email,
      organizationId: orgId,
      status: 'PENDING'
    }
  });

  if (existing) {
    throw new Error("Invite already sent");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId
        }
      }
    });

    if (member) {
      throw new Error("User already in organization");
    }
  }

  // 2. Create invite
  const invite = await prisma.organizationInvite.create({
    data: {
      email,
      organizationId: orgId,
      role,
      status: 'PENDING'
    }
  });

  // 3. Send email (non-blocking ideally, but ok for now)
  await sendInviteMail({
    to: email,
    orgName: org.name,
    role,
    inviteId: invite.id
  });

  return invite;
};

export const acceptInvite = async (userId, userEmail, inviteId) => {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.organizationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.email !== userEmail || invite.status !== 'PENDING') {
      throw new Error('Invalid or expired invite');
    }

    await tx.organizationMember.create({
      data: {
        userId,
        organizationId: invite.organizationId,
        baseRole: invite.role,
        status: 'ACTIVE'
      }
    });

    return tx.organizationInvite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' }
    });
  });
};

export const initiateVerification = async (orgId, darpanId) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  if (!org) throw new Error("Org not found");

  if (org.type !== 'NGO') {
    throw new Error("Only NGOs can request verification");
  }

  if (org.verificationStatus === 'VERIFIED') {
    throw new Error("Already verified");
  }

  if (['PENDING', 'CONTACT_ADDED'].includes(org.verificationStatus)) {
    throw new Error("Verification already initiated");
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      darpanId,
      verificationStatus: 'PENDING',
      verificationOtp: null,
      otpExpiresAt: null,
      otpAttempts: 0
    }
  });
};

export const sendOtp = async (orgId) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  if (!org) throw new Error("Org not found");

  // 🔒 validations
  if (org.type !== 'NGO') {
    throw new Error("Only NGOs can be verified");
  }

  if (org.verificationStatus === 'PENDING') {
    throw new Error("Admin has not added contact details yet");
  }

  if (org.verificationStatus !== 'CONTACT_ADDED') {
    throw new Error("Verification not initiated");
  }

  if (!org.verifiedEmail) {
    throw new Error("Admin has not added contact details yet");
  }

  if (org.otpExpiresAt && new Date() < org.otpExpiresAt) {
    throw new Error("OTP already sent. Please wait.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await sendOtpMail(org.verifiedEmail, otp);

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      verificationOtp: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
};

export const verifyOtp = async (orgId, otp) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  if (!org) throw new Error("Org not found");

  if (org.verificationStatus !== 'CONTACT_ADDED') {
    throw new Error('OTP verification not available at this stage');
  }

  if (!org.verificationOtp || !org.otpExpiresAt) {
    throw new Error('OTP not sent yet');
  }

  if (org.otpAttempts >= 5) {
    throw new Error("Too many attempts");
  }

  if (new Date() > org.otpExpiresAt) {
    throw new Error("OTP expired");
  }

  if (org.verificationOtp !== otp) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { otpAttempts: { increment: 1 } }
    });

    throw new Error("Invalid OTP");
  }

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      verificationStatus: 'VERIFIED',
      verificationOtp: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      trustScore: { increment: 50 }
    }
  });
};

export const getMembers = async (orgId) => {
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId, status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
};

export const updateMemberRole = async (orgId, userId, data) => {
  if (data.baseRole === 'OWNER') {
    throw new Error('Cannot assign OWNER role');
  }

  return prisma.organizationMember.update({
    where: {
      userId_organizationId: { userId, organizationId: orgId }
    },
    data
  });
};

export const removeMember = async (orgId, userId) => {
  return prisma.organizationMember.delete({
    where: {
      userId_organizationId: { userId, organizationId: orgId }
    }
  });
};

export const leaveOrganization = async (userId, orgId) => {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } }
  });

  if (member.baseRole === 'OWNER') {
    throw new Error('Owner cannot leave organization');
  }

  return prisma.organizationMember.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } }
  });
};

export const getUserInvites = async (email) => {
  return prisma.organizationInvite.findMany({
    where: { email, status: 'PENDING' },
    include: {
      organization: { select: { id: true, name: true } }
    }
  });
};

export const getOrgDashboard = async (orgId) => {
  const [issues, tasks, members] = await Promise.all([
    prisma.issue.count({ where: { ownerOrgId: orgId } }),
    prisma.task.count({
      where: { issue: { ownerOrgId: orgId } }
    }),
    prisma.organizationMember.count({ where: { organizationId: orgId } })
  ]);

  return { issues, tasks, members };
};