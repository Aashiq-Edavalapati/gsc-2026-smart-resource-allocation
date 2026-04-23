import * as aiService from '../services/ai.service.js';

export const ocr = async (req, res) => {
  const result = await aiService.ocr(req.body.fileUrl);
  res.json({ success: true, data: result });
};

export const transcribe = async (req, res) => {
  const result = await aiService.transcribe(req.body.fileUrl);
  res.json({ success: true, data: result });
};

export const analyzeSurvey = async (req, res) => {
  const result = await aiService.analyzeSurvey(req.body);
  res.json({ success: true, data: result });
};

export const classifyIssue = async (req, res) => {
  const result = await aiService.classifyIssue(req.body.text);
  res.json({ success: true, data: result });
};