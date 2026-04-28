import { transcribe } from './transcriber.js';
import { extractFacts } from './extractor.js';
import { synthesize } from './synthesizer.js';
import { critique } from './critic.js';
import { publish } from './publisher.js';
import { generateJSON } from './gemini.js';
import { extractIssuesAndTasks } from './issueExtractor.js';

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

export const runFullPipeline = async (payload, hooks = {}) => {
  const { mediaUrls = [], lat, lng, city, organizationId, textContext = '', ocrContext = '' } = payload;
  const { onStageUpdate = async () => {} } = hooks;

  const imageUrls = mediaUrls.filter(
    url => /\.(jpeg|jpg|gif|png)$/i.test(url) || !/\.(mp4|webm|avi|mov|mp3|wav)$/i.test(url)
  );

  const hasAudioOrVideo = mediaUrls.some(url => /\.(mp4|webm|avi|mov|mp3|wav)$/i.test(url));

  // Step 1: Transcribe audio/video if present
  const audioTranscript = hasAudioOrVideo ? await transcribe(mediaUrls) : '';
  await onStageUpdate('TRANSCRIBED');

  const transcript = [textContext, ocrContext, audioTranscript]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('\n\n');

  if (!transcript) {
    throw new Error('No usable context provided for AI processing');
  }
  
  // Step 2: Extract facts
  const facts = await extractFacts(transcript);
  await onStageUpdate('FACTS_EXTRACTED');

  // Step 3: Extract issues and tasks using Gemini
  const extractedData = await extractIssuesAndTasks(facts, payload.description || '');
  await onStageUpdate('ISSUES_EXTRACTED');

  // Step 4: Generate assessment report
  let report = await synthesize(facts, imageUrls, payload);

  // Step 5: Critique report
  for (let attempt = 0; attempt < 2; attempt++) {
    report = await critique(report, facts, payload);
  }

  // Step 6: Publish report as PDF
  const pdfUrl = await publish(report);
  await onStageUpdate('REPORT_PUBLISHED');

  return {
    report,
    pdfUrl,
    issues: extractedData.issues,
    issueExtractionRaw: extractedData.rawOutput,
    transcript,
    audioTranscript,
    ocrContext,
    facts
  };
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
