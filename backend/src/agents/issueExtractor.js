import { generateJSON } from './gemini.js';
import { normalizeIssueExtractionResult, ISSUE_CATEGORIES } from '../lib/aiValidation.js';

const ISSUE_EXTRACTION_SCHEMA = `
{
  "issues": [
    {
      "title": "string - brief title of the issue",
      "description": "string - detailed description of the issue",
      "category": "enum - one of: HEALTH, EDUCATION, SANITATION, ENVIRONMENT, WOMEN_AND_CHILD, DISASTER, FOOD, OTHER",
      "urgency": "number - 1-5, where 5 is most urgent",
      "tasks": [
        {
          "title": "string - brief task title",
          "description": "string - detailed task description",
          "category": "enum - one of: HEALTH, EDUCATION, SANITATION, ENVIRONMENT, WOMEN_AND_CHILD, DISASTER, FOOD, OTHER",
          "requiredSkills": ["string array - skills needed for this task"],
          "volunteersNeeded": "number - how many volunteers needed"
        }
      ]
    }
  ]
}
`;

const CATEGORY_LIST = [...ISSUE_CATEGORIES].join(', ');

export const extractIssuesAndTasks = async (facts, fieldReportDescription = '') => {
  const prompt = `
You are an expert at analyzing field reports and breaking them down into actionable issues and tasks for NGO coordination.

Based on the following field assessment data, extract all the distinct issues and the specific tasks needed to address them.
Each task MUST have a category that describes the type of work (HEALTH for medical tasks, EDUCATION for educational tasks, etc).

IMPORTANT INSTRUCTIONS:
1. Be thorough and extract ALL distinct issues mentioned
2. For each issue, extract ALL tasks that need to be done
3. Each task MUST have a category field
4. Set realistic urgency levels (1-5)
5. Include specific, actionable task titles
6. List only required skills that are truly necessary
7. Estimate realistic volunteer counts needed
8. Use only these categories: ${CATEGORY_LIST}

Field Assessment Facts:
"${facts}"

Report Description:
"${fieldReportDescription}"

Return ONLY valid JSON matching this exact schema (no markdown, no code blocks, just pure JSON):
${ISSUE_EXTRACTION_SCHEMA}
`;

  try {
    const rawResult = await generateJSON(prompt);
    const { issues } = normalizeIssueExtractionResult(rawResult);

    return {
      issues,
      rawOutput: rawResult
    };
  } catch (error) {
    console.error('Issue extraction error:', error);
    throw new Error(`Failed to extract issues and tasks: ${error.message}`);
  }
};
