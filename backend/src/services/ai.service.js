// ===================== AI SERVICE =====================

// TODO: Replace all mock implementations with real APIs:
// - OCR → Google Vision API
// - Transcription → Google Speech-to-Text
// - Analysis → Gemini API

export const ocr = async (fileUrl) => {
  return {
    text: "Extracted text from document",
    language: "en"
  };
};

export const transcribe = async (fileUrl) => {
  return {
    text: "Transcribed speech text",
    segments: [
      { text: "Sample", start: 0, end: 5 }
    ]
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