import { transcribe } from './transcriber.js';
import { extractFacts } from './extractor.js';
import { synthesize } from './synthesizer.js';
import { critique } from './critic.js';
import { publish } from './publisher.js';
import { generateJSON } from './gemini.js';

export const runPipeline = async (payload) => {
  const { mediaUrls = [] } = payload;

  const imageUrls = mediaUrls.filter(
    url => /\.(jpeg|jpg|gif|png)$/i.test(url) || !/\.(mp4|webm|avi|mov|mp3|wav)$/i.test(url)
  );

  const [transcript] = await Promise.all([transcribe(mediaUrls)]);
  const facts = await extractFacts(transcript);

  let report = await synthesize(facts, imageUrls, payload);

  for (let attempt = 0; attempt < 2; attempt++) {
    report = await critique(report, facts, payload);
  }

  const pdfUrl = await publish(report);

  return { report, pdfUrl };
};

export const regenerateReport = async (payload) => {
  const { originalReport, feedback } = payload;

  const prompt = `
Update the Emergency Field Assessment Report below based on the user feedback.
Return the corrected report matching the exact same JSON schema.

Original Report:
${JSON.stringify(originalReport, null, 2)}

User Feedback:
"${feedback}"
`;

  const updatedReport = await generateJSON(prompt);
  const pdfUrl = await publish(updatedReport);

  return { report: updatedReport, pdfUrl };
};
