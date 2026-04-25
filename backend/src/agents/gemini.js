import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateJSON = async (prompt, imageParts = []) => {
  const contents = [...imageParts, prompt];
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents,
    config: { responseMimeType: 'application/json' }
  });

  const raw = response.text || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Gemini returned no valid JSON');
  return JSON.parse(match[0]);
};
