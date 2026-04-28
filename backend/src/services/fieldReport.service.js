import crypto from 'crypto';
import prisma from '../config/db.js';

const MEDIA_TYPE_EXTENSIONS = {
  AUDIO: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'],
  VIDEO: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'm4v'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt']
};

const inferMediaType = (url = '') => {
  const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();

  if (!extension) {
    return 'DOCUMENT';
  }

  for (const [type, extensions] of Object.entries(MEDIA_TYPE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }

  return 'DOCUMENT';
};

export const buildFieldReportFingerprint = ({
  userId,
  organizationId,
  city,
  lat,
  lng,
  description = '',
  contextText = '',
  mediaUrls = []
}) => {
  const normalizedPayload = {
    userId,
    organizationId: organizationId || null,
    city: (city || '').trim().toLowerCase(),
    lat: Number.parseFloat(lat).toFixed(6),
    lng: Number.parseFloat(lng).toFixed(6),
    description: description.trim(),
    contextText: contextText.trim(),
    mediaUrls: [...new Set(mediaUrls.filter(Boolean))].sort()
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedPayload))
    .digest('hex');
};

const includeFieldReportRelations = {
  media: true,
  issues: {
    include: {
      tasks: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  }
};

export const prepareFieldReportProcessing = async (payload) => {
  const requestFingerprint = buildFieldReportFingerprint(payload);

  const existing = await prisma.fieldReport.findUnique({
    where: { requestFingerprint },
    include: includeFieldReportRelations
  });

  if (existing) {
    if (existing.aiProcessed) {
      return {
        fieldReport: existing,
        requestFingerprint,
        mode: 'cached-complete'
      };
    }

    if (existing.status === 'PROCESSING' && existing.pipelineStage !== 'FAILED') {
      return {
        fieldReport: existing,
        requestFingerprint,
        mode: 'already-processing'
      };
    }

    const resetReport = await prisma.fieldReport.update({
      where: { id: existing.id },
      data: {
        status: 'PROCESSING',
        pipelineStage: 'RECEIVED',
        aiProcessed: false,
        aiProcessedAt: null,
        aiRawOutput: null,
        aiSummary: null,
        title: payload.description?.trim() ? payload.description.trim().slice(0, 120) : existing.title || 'Field assessment'
      },
      include: includeFieldReportRelations
    });

    return {
      fieldReport: resetReport,
      requestFingerprint,
      mode: 'resumed'
    };
  }

  const created = await prisma.$transaction(async (tx) => {
    const report = await tx.fieldReport.create({
      data: {
        createdByUserId: payload.userId,
        organizationId: payload.organizationId || null,
        requestFingerprint,
        title: payload.description?.trim() ? payload.description.trim().slice(0, 120) : 'Field assessment',
        description: payload.description || null,
        status: 'PROCESSING',
        pipelineStage: 'RECEIVED',
        aiProcessed: false
      }
    });

    if (payload.mediaUrls?.length) {
      await tx.fieldReportMedia.createMany({
        data: payload.mediaUrls.map((url) => ({
          reportId: report.id,
          url,
          type: inferMediaType(url)
        }))
      });
    }

    return report;
  });

  const fieldReport = await prisma.fieldReport.findUnique({
    where: { id: created.id },
    include: includeFieldReportRelations
  });

  return {
    fieldReport,
    requestFingerprint,
    mode: 'created'
  };
};

export const updateFieldReportProcessing = async (fieldReportId, data) => {
  return prisma.fieldReport.update({
    where: { id: fieldReportId },
    data
  });
};

export const finalizeFieldReportProcessing = async (fieldReportId, aiRawOutput) => {
  return prisma.fieldReport.update({
    where: { id: fieldReportId },
    data: {
      aiRawOutput,
      aiProcessed: true,
      aiProcessedAt: new Date(),
      status: 'COMPLETED',
      pipelineStage: 'COMPLETED'
    }
  });
};

export const failFieldReportProcessing = async (fieldReportId, errorMessage) => {
  return prisma.fieldReport.update({
    where: { id: fieldReportId },
    data: {
      status: 'FAILED',
      pipelineStage: 'FAILED',
      aiProcessed: false,
      aiProcessedAt: null,
      aiRawOutput: {
        error: errorMessage,
        failedAt: new Date().toISOString()
      }
    }
  });
};