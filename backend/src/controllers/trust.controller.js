import * as trustService from '../services/trust.service.js';

export const giveFeedback = async (req, res) => {
  const result = await trustService.giveFeedback(req.body);
  res.json({ success: true, data: result });
};

export const getLeaderboard = async (req, res) => {
  const data = await trustService.getLeaderboard();
  res.json({ success: true, data });
};