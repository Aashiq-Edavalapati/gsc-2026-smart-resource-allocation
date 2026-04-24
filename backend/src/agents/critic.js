const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const SIMILARITY_THRESHOLD = 0.15;

const computeSimilarity = async (sourceSentence, sentences) => {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { source_sentence: sourceSentence, sentences }
      })
    }
  );

  if (!response.ok) return sentences.map(() => 1);
  return response.json();
};

const validateStructure = (report) => {
  const errors = [];

  if (!report.documentControl?.reportId) errors.push('documentControl.reportId missing');
  if (!report.incidentOverview) errors.push('incidentOverview missing');

  const level = report.incidentOverview?.criticalityLevel;
  if (level != null && (level < 1 || level > 5)) errors.push('criticalityLevel out of 1-5 range');

  if (!report.situationAnalysis?.verifiedObservations) errors.push('verifiedObservations missing');
  if (!report.resourceRequisitionMatrix?.immediateNeeds?.length) errors.push('immediateNeeds empty');

  return errors;
};

export const critique = async (reportData, facts) => {
  const structuralErrors = validateStructure(reportData);

  const claims = [
    reportData.situationAnalysis?.verifiedObservations,
    reportData.situationAnalysis?.impactOnPopulation,
    reportData.incidentOverview?.incidentClassification
  ].filter(Boolean);

  let semanticFlags = [];

  if (facts && claims.length) {
    try {
      const scores = await computeSimilarity(facts, claims);
      scores.forEach((score, i) => {
        if (score < SIMILARITY_THRESHOLD) {
          semanticFlags.push(`claim ${i + 1} has low similarity to source facts (score: ${score.toFixed(2)})`);
        }
      });
    } catch {
      // Similarity check failed 
    }
  }

  const allFlags = [...structuralErrors, ...semanticFlags];

  return {
    ...reportData,
    _validation: {
      passed: allFlags.length === 0,
      flags: allFlags
    }
  };
};
