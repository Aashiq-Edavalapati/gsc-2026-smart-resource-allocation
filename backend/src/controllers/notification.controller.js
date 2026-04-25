import * as notificationService from '../services/notification.service.js';

export const subscribe = async (req, res) => {
  const data = await notificationService.saveToken(req.user.id, req.body.token);
  res.json({ success: true, data });
};

export const removeToken = async (req, res) => {
  await notificationService.removeToken(req.user.id, req.body.token);
  res.json({ success: true });
};

export const getHistory = async (req, res) => {
  const data = await notificationService.getHistory(req.user.id);
  res.json({ success: true, data });
};

export const markRead = async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id);
  res.json({ success: true });
};

export const markAllRead = async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ success: true });
};