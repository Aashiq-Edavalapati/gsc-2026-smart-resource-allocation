import vision from '@google-cloud/vision';
import speech from '@google-cloud/speech';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import { getAudioEncoding } from '../utils/audioEncoding.js';

// ===================== OCR =====================
const visionClient = new vision.ImageAnnotatorClient();

export const ocr = async (fileUrl) => {
  const [result] = await visionClient.textDetection({
    image: { source: { imageUri: fileUrl } },
  });

  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    return { text: '', blocks: [] };
  }

  return {
    text: detections[0].description,
    blocks: detections.slice(1).map(item => ({
      text: item.description,
      boundingPoly: item.boundingPoly,
    })),
  };
};

// ===================== TRANSCRIBE =====================
const speechClient = new speech.SpeechClient();

export const transcribe = async (fileUrl) => {
  try {
    // extract extension from URL
    const extMatch = fileUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
    const encoding = getAudioEncoding(extMatch);

    const config = {
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      ...(encoding && { encoding }),
    };

    const request = {
      audio: { uri: fileUrl },
      config,
    };

    const [response] = await speechClient.recognize(request, {
      timeout: 30000,
    });

    const transcription = (response.results || [])
      .map(result => result.alternatives[0]?.transcript || '')
      .join('\n');

    return {
      text: transcription,
      raw: response,
      usedEncoding: encoding || 'AUTO',
    };
  } catch (err) {
    console.error('Transcription Error:', err);
    throw new Error('Transcription failed');
  }
};

// ===================== TRANSLATION =====================
const translateClient = new Translate();

export const translateToEnglish = async (text) => {
  try {
    if (!text || text.trim() === '') {
      return {
        original: text,
        translated: text,
        detectedLanguage: null,
        translatedNeeded: false,
      };
    }

    const [detections] = await translateClient.detect(text);

    const detectedLanguage = Array.isArray(detections)
      ? detections[0].language
      : detections.language;

    if (detectedLanguage === 'en') {
      return {
        original: text,
        translated: text,
        detectedLanguage,
        translatedNeeded: false,
      };
    }

    const [translation] = await translateClient.translate(text, 'en');

    return {
      original: text,
      translated: translation,
      detectedLanguage,
      translatedNeeded: true,
    };
  } catch (err) {
    console.error('Translation Error:', err);
    throw new Error('Translation failed');
  }
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