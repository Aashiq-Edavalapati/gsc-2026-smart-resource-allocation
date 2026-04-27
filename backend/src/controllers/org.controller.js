import * as orgService from '../services/org.service.js';

export const createOrg = async (req, res) => {
  try {
    const org = await orgService.createOrganization(req.user.id, req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listOrgs = async (req, res) => {
  try {
    const result = await orgService.getOrganizations(req.query);
    res.status(200).json({ success: true, meta: { total: result.total, pages: result.totalPages }, data: result.orgs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrg = async (req, res) => {
  try {
    const org = await orgService.getOrganizationDetails(req.params.id);
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOrg = async (req, res) => {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const invite = await orgService.inviteUserToOrg(req.params.id, email, role);
    res.status(201).json({
      success: true,
      message: "Invite created and email sent",
      data: invite
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const acceptOrgInvite = async (req, res) => {
  try {
    const result = await orgService.acceptInvite(req.user.id, req.user.email, req.params.inviteId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const initiateVerification = async (req, res) => {
  try {
    const { darpanId } = req.body;

    const org = await orgService.initiateVerification(
      req.params.id,
      darpanId
    );

    res.json({ success: true, data: org });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const org = await orgService.sendOtp(req.params.id);
    res.json({ success: true, message: "OTP sent" });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const org = await orgService.verifyOtp(req.params.id, otp);

    res.json({ success: true, data: org });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const deleteOrg = async (req, res) => {
  try {
    await orgService.deleteOrganization(req.params.id);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getMembers = async (req, res) => {
  try {
    const members = await orgService.getMembers(req.params.id);
    res.json({ success: true, data: members });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const updated = await orgService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.body
    );
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    await orgService.removeMember(req.params.id, req.params.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const leaveOrganization = async (req, res) => {
  try {
    await orgService.leaveOrganization(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const getUserInvites = async (req, res) => {
  try {
    const invites = await orgService.getUserInvites(req.user.email);
    res.json({ success: true, data: invites });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getOrgDashboard = async (req, res) => {
  try {
    const data = await orgService.getOrgDashboard(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};