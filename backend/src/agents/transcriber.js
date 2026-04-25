import speech from '@google-cloud/speech';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const speechClient = new speech.SpeechClient();

const downloadFile = async (url, dest) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(dest, buffer);
};

export const transcribe = async (mediaUrls) => {
  let fullTranscript = '';

  for (const url of mediaUrls) {
    const isAudioOrVideo = /\.(mp4|webm|avi|mov|mp3|wav)$/i.test(url);
    if (!isAudioOrVideo) continue;

    const audioUrl = url.replace(/\.(mp4|webm|avi|mov)$/i, '.mp3');
    const tmpPath = path.join(os.tmpdir(), `${uuidv4()}.mp3`);

    try {
      await downloadFile(audioUrl, tmpPath);
      const audioBytes = fs.readFileSync(tmpPath).toString('base64');

      const [response] = await speechClient.recognize({
        audio: { content: audioBytes },
        config: { languageCode: 'en-US', enableAutomaticPunctuation: true }
      });

      const transcript = response.results
        .map(r => r.alternatives[0].transcript)
        .join('\n');

      fullTranscript += transcript + '\n';
    } catch (err) {
      console.error('Transcription error:', err.message);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  return fullTranscript.trim();
};
