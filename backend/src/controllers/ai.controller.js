import * as aiService from '../services/ai.service.js';
import * as issueService from '../services/issue.service.js';
import * as agenticPipeline from '../agents/orchestrator.js';
import { uploadFile } from '../services/upload.service.js';
import {
  prepareFieldReportProcessing,
  updateFieldReportProcessing,
  finalizeFieldReportProcessing,
  failFieldReportProcessing
} from '../services/fieldReport.service.js';

export const ocr = async (req, res) => {
  const result = await aiService.ocr(req.body.fileUrl);
  res.json({ success: true, data: result });
};

export const transcribe = async (req, res) => {
  try {
    if (!req.body.fileUrl) {
      return res.status(400).json({ error: 'fileUrl is required' });
    }
    
    const result = await aiService.transcribe(req.body.fileUrl);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Transcription failed' });
  }
};

export const translate = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await aiService.translateToEnglish(text);
    res.json({ success: true, data: result });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Translation failed' });
  }
};

export const analyzeSurvey = async (req, res) => {
  const result = await aiService.analyzeSurvey(req.body);
  res.json({ success: true, data: result });
};

export const classifyIssue = async (req, res) => {
  const result = await aiService.classifyIssue(req.body.text);
  res.json({ success: true, data: result });
};

export const generateReport = async (req, res) => {
  try {
    const result = await agenticPipeline.runPipeline(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('generateReport error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

export const regenerateReport = async (req, res) => {
  try {
    const result = await agenticPipeline.regenerateReport(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('regenerateReport error:', err);
    res.status(500).json({ success: false, error: 'Failed to regenerate report' });
  }
};

// New endpoint: Process media files and auto-create issues/tasks with AI
export const processFieldReportAndCreateIssues = async (req, res) => {
  let fieldReport = null;

  try {
    const { lat, lng, city, organizationId } = req.body;
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const directText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    const uploadedGroups = req.files && typeof req.files === 'object' ? req.files : {};
    const uploadedFiles = Array.isArray(uploadedGroups.files) ? uploadedGroups.files : [];
    const uploadedDocs = Array.isArray(uploadedGroups.docs) ? uploadedGroups.docs : [];
    const rawMediaUrls = req.body.mediaUrls;

    const mediaUrlsFromBody = Array.isArray(rawMediaUrls)
      ? rawMediaUrls
      : typeof rawMediaUrls === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(rawMediaUrls);
              return Array.isArray(parsed) ? parsed : [rawMediaUrls];
            } catch {
              return [rawMediaUrls];
            }
          })()
        : [];

    const allUploadedFiles = [...uploadedFiles, ...uploadedDocs];

    const uploadedMediaUrls = await Promise.all(
      allUploadedFiles.map(async (file) => {
        const result = await uploadFile(file.path);
        return result.url;
      })
    );

    const uploadedDocUrls = uploadedDocs.length ? uploadedMediaUrls.slice(uploadedFiles.length) : [];

    const docOcrTexts = uploadedDocUrls.length
      ? (await Promise.allSettled(
          uploadedDocUrls.map(async (docUrl) => {
            const result = await aiService.ocr(docUrl);
            return result?.text || '';
          })
        ))
          .map(result => (result.status === 'fulfilled' ? result.value : ''))
          .filter(Boolean)
      : [];

    const allMediaUrls = [...new Set([...mediaUrlsFromBody, ...uploadedMediaUrls].filter(Boolean))];
    const contextText = [description, directText, ...docOcrTexts].filter(Boolean).join('\n\n');

    // Validate required fields
    if (!allMediaUrls.length && !contextText) {
      return res.status(400).json({
        success: false,
        error: 'At least one media file, media URL, document, or text input is required'
      });
    }

    if (lat === undefined || lng === undefined || !city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: lat, lng, city'
      });
    }

    const userId = req.user.id;

    const preparedReport = await prepareFieldReportProcessing({
      userId,
      organizationId,
      city,
      lat,
      lng,
      description,
      contextText,
      mediaUrls: allMediaUrls
    });

    fieldReport = preparedReport.fieldReport;

    if (preparedReport.mode === 'cached-complete') {
      return res.status(200).json({
        success: true,
        message: 'Field report already processed. Returning the stored result.',
        data: {
          fieldReport,
          ...(fieldReport.aiRawOutput || {}),
          cached: true
        }
      });
    }

    if (preparedReport.mode === 'already-processing') {
      return res.status(202).json({
        success: true,
        message: 'Field report is already being processed. Please retry shortly.',
        data: {
          fieldReportId: fieldReport.id,
          pipelineStage: fieldReport.pipelineStage,
          cached: false
        }
      });
    }

    // Run the full pipeline with issue extraction
    const pipelineResult = await agenticPipeline.runFullPipeline({
      mediaUrls: allMediaUrls,
      lat,
      lng,
      city,
      organizationId,
      description,
      textContext: contextText,
      ocrContext: docOcrTexts.join('\n\n')
    }, {
      onStageUpdate: async (pipelineStage) => {
        await updateFieldReportProcessing(fieldReport.id, { pipelineStage });
      }
    });

    // Auto-create issues and tasks from AI extraction
    const createdIssues = await issueService.createIssuesAndTasksFromAI(
      userId,
      pipelineResult,
      { lat, lng, city, organizationId, fieldReportId: fieldReport.id }
    );

    await updateFieldReportProcessing(fieldReport.id, { pipelineStage: 'ISSUES_CREATED' });

    const aiRawOutput = {
      transcript: pipelineResult.transcript,
      audioTranscript: pipelineResult.audioTranscript,
      ocrContext: pipelineResult.ocrContext,
      facts: pipelineResult.facts,
      extraction: pipelineResult.issueExtractionRaw,
      report: pipelineResult.report,
      pdfUrl: pipelineResult.pdfUrl,
      normalizedIssues: pipelineResult.issues,
      createdIssues
    };

    fieldReport = await finalizeFieldReportProcessing(fieldReport.id, aiRawOutput);

    res.status(201).json({
      success: true,
      message: `Created ${createdIssues.length} issue(s) with suggested status. Please review and approve them.`,
      data: {
        issues: createdIssues,
        report: pipelineResult.report,
        reportPdf: pipelineResult.pdfUrl,
        transcript: pipelineResult.transcript,
        fieldReport,
        aiRawOutput
      }
    });
  } catch (err) {
    console.error('processFieldReportAndCreateIssues error:', err);

    if (fieldReport?.id) {
      await failFieldReportProcessing(fieldReport.id, err.message || 'Failed to process field report and create issues');
    }

    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process field report and create issues'
    });
  }
};