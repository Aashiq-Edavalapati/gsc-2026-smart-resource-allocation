import { generateJSON } from './gemini.js';

export const critique = async (reportData, facts, rawData) => {
  const prompt = `
Review the Emergency Field Assessment Report below against the raw facts.
If the report contains hallucinations or missing critical fields, return a corrected version.
If the report is accurate, return it unchanged.

Raw facts: "${facts}"
Volunteer statement: "${rawData.statement || ''}"

Report:
${JSON.stringify(reportData, null, 2)}
`;

  return generateJSON(prompt);
};
