// ===================== AI SERVICE =====================

// TODO: Replace all mock implementations with real APIs:
// - OCR → Google Vision API
// - Analysis → Gemini API
import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

export const ocr = async (fileUrl) => {
  return {
    text: "Extracted text from document",
    language: "en"
  };
};


// - Transcription → Google Speech-to-Text
export const transcribe = async (fileUrl) => {
  const audio = {
    uri: fileUrl, // MUST be public or GCS URL
  };

  const config = {
    encoding: 'LINEAR16', // depends on file
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = {
    audio,
    config,
  };

  const [response] = await client.recognize(request);

  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');

  return {
    text: transcription,
    raw: response,
  };
};

export const analyzeSurvey = async (data) => {
  return {
    issues: [
      {
        title: "Water shortage",
        description: "No clean water available",
        category: "SANITATION",
        urgency: 8,
        priorityScore: 7.5
      }
    ]
  };
};

export const classifyIssue = async (text) => {
  return {
    category: "SANITATION",
    urgency: 7,
    priorityScore: 6.5,
    summary: "Issue classified"
  };
};