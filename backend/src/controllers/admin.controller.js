import * as adminService from '../services/admin.service.js';

export const getPendingOrgs = async (req, res) => {
  try {
    const orgs = await adminService.getPendingOrgs();
    res.json({ success: true, data: orgs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

export const addContactDetails = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const org = await adminService.addContact(req.params.id, email);

    res.json({ success: true, data: org });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};