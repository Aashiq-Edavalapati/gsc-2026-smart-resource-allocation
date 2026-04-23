import * as adminService from '../services/admin.service.js';

export const getPendingOrgs = async (req, res) => {
  try {
    const orgs = await adminService.getPendingOrgs();
    res.json({ success: true, data: orgs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

export const verifyOrg = async (req, res) => {
  try {
    const org = await adminService.verifyOrganization(req.params.id);
    res.json({ success: true, data: org });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

export const getStats = async (req, res) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};