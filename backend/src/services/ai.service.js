// ===================== AI SERVICE =====================

// TODO: Replace all mock implementations with real APIs:
// - Analysis → Gemini API
import vision from '@google-cloud/vision';
import speech from '@google-cloud/speech';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';



// - OCR → Google Vision API
const visionClient = new vision.ImageAnnotatorClient();
export const ocr = async (fileUrl) => {
  const [result] = await visionClient.textDetection(fileUrl);

  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    return {
      text: '',
      blocks: [],
    };
  }

  return {
    text: detections[0].description, // full text
    blocks: detections.slice(1).map(item => ({
      text: item.description,
      boundingPoly: item.boundingPoly,
    })),
  };
};


// - Transcription → Google Speech-to-Text
const speechClient = new speech.SpeechClient();
export const transcribe = async (fileUrl) => {
  const audio = {
    uri: fileUrl, // MUST be public or GCS URL
  };

  // TODO: Detect audio format (mp3, wav, m4a, etc.) and set encoding accordingly.
    // Example:
    // - LINEAR16 → wav (PCM)
    // - MP3 → mp3 files
    // - WEBM_OPUS → webm
    // - OGG_OPUS → ogg
    // This should ideally be passed from frontend or inferred from file metadata.
  const config = {
    encoding: 'LINEAR16', // depends on file
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = {
    audio,
    config,
  };

  const [response] = await speechClient.recognize(request);

  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');

  return {
    text: transcription,
    raw: response,
  };
};

// Translation(Detected language to English) - Google Cloud Translation API
const translateClient = new Translate();
export const translateToEnglish = async (text) => {
  if (!text || text.trim() === '') {
    return {
      original: text,
      translated: text,
      detectedLanguage: null,
      translatedNeeded: false,
    };
  }

  // Detect language
  const [detection] = await translateClient.detect(text);
  const detectedLanguage = detection.language;

  // If already English → skip translation
  if (detectedLanguage === 'en') {
    return {
      original: text,
      translated: text,
      detectedLanguage,
      translatedNeeded: false,
    };
  }

  // Translate to English
  const [translation] = await translateClient.translate(text, 'en');

  return {
    original: text,
    translated: translation,
    detectedLanguage,
    translatedNeeded: true,
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