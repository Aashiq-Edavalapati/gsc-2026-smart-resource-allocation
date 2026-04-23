import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const classifyIssue = async (title, description) => {
  const prompt = `
    Analyze the following community issue report.
    Title: ${title}
    Description: ${description}
    
    Return ONLY a JSON object with the following keys:
    - category: Must be one of [HEALTH, EDUCATION, SANITATION, ENVIRONMENT, WOMEN_AND_CHILD, DISASTER, FOOD, OTHER].
    - urgency: Integer from 1 to 10.
    - priorityScore: Float from 0.0 to 1.0 based on impact scale.
    - summary: A clean, one-sentence summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Classification Failed, falling back to defaults", error);
    return { category: 'OTHER', urgency: 5, priorityScore: 0.5, summary: title };
  }
};