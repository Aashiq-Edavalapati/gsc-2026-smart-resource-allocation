import { generateJSON } from './gemini.js';

const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: response.headers.get('content-type') || 'image/jpeg'
      }
    };
  } catch {
    return null;
  }
};

const SCHEMA = `
{
  "documentControl": {
    "reportId": "string",
    "assessmentDate": "string",
    "fieldAssessor": "string"
  },
  "incidentOverview": {
    "lat": "number",
    "lng": "number",
    "incidentClassification": "string",
    "criticalityLevel": "number (1-5)"
  },
  "situationAnalysis": {
    "verifiedObservations": "string",
    "impactOnPopulation": "string"
  },
  "visualEvidenceLog": [
    { "url": "string", "caption": "string" }
  ],
  "resourceRequisitionMatrix": {
    "immediateNeeds": ["string"],
    "suggestedAgencies": ["string"]
  }
}
`;

export const synthesize = async (facts, imageUrls, rawData) => {
  const imageParts = (
    await Promise.all(imageUrls.map(fetchImageAsBase64))
  ).filter(Boolean);

  const prompt = `
Generate a professional Emergency Field Assessment Report strictly matching the JSON schema below.
Do not hallucinate outside the provided facts.

Facts from field audio: "${facts}"
Volunteer statement: "${rawData.statement || ''}"
Volunteer observations: "${rawData.observations || ''}"
Beneficiary category: "${rawData.category || ''}"

JSON Schema:
${SCHEMA}
`;

  return generateJSON(prompt, imageParts);
};
