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
  return prisma.organizationInvite.create({
    data: {
      email,
      organizationId: orgId,
      role,
      status: 'PENDING'
    }
  });
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

// Stub for the AI workflow we will build later
export const submitForVerification = async (orgId, documents) => {
  // TODO: Integrate Google Cloud Vision API here for OCR in next phases
  // For now, just update the status to PENDING
  return prisma.organization.update({
    where: { id: orgId },
    data: { 
      documents, 
      verificationStatus: 'PENDING' 
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