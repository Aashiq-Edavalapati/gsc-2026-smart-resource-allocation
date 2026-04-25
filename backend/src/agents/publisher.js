import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary.js';

export const publish = (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const tmpPath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
    const stream = fs.createWriteStream(tmpPath);

    doc.pipe(stream);

    const ctrl = reportData.documentControl || {};
    const incident = reportData.incidentOverview || {};
    const situation = reportData.situationAnalysis || {};
    const resources = reportData.resourceRequisitionMatrix || {};
    const needs = (resources.immediateNeeds || []).join(', ') || 'None';
    const agencies = (resources.suggestedAgencies || []).join(', ') || 'None';

    doc
      .fontSize(20)
      .text('Emergency Field Assessment Report', { align: 'center' })
      .moveDown(1.5);

    doc.fontSize(13).text('1. Document Control').moveDown(0.5);
    doc.fontSize(10)
      .text(`Report ID:    ${ctrl.reportId || 'N/A'}`)
      .text(`Date:         ${ctrl.assessmentDate || new Date().toISOString()}`)
      .text(`Field Assessor: ${ctrl.fieldAssessor || 'Unknown'}`)
      .moveDown();

    doc.fontSize(13).text('2. Incident Overview').moveDown(0.5);
    doc.fontSize(10)
      .text(`Coordinates:       ${incident.lat || 0}, ${incident.lng || 0}`)
      .text(`Classification:    ${incident.incidentClassification || 'N/A'}`)
      .text(`Criticality Level: ${incident.criticalityLevel || 'N/A'} / 5`)
      .moveDown();

    doc.fontSize(13).text('3. Situation Analysis').moveDown(0.5);
    doc.fontSize(10)
      .text(`Observations:       ${situation.verifiedObservations || 'N/A'}`)
      .text(`Population Impact:  ${situation.impactOnPopulation || 'N/A'}`)
      .moveDown();

    doc.fontSize(13).text('4. Resource Requisition').moveDown(0.5);
    doc.fontSize(10)
      .text(`Immediate Needs:   ${needs}`)
      .text(`Suggested Agencies: ${agencies}`);

    doc.end();

    stream.on('finish', async () => {
      try {
        const result = await cloudinary.uploader.upload(tmpPath, {
          resource_type: 'auto',
          access_mode: 'public',
          format: 'pdf'
        });
        fs.unlinkSync(tmpPath);
        resolve(result.secure_url);
      } catch (err) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        reject(err);
      }
    });

    stream.on('error', reject);
  });
};
