export function getAudioEncoding(ext) {
  switch (ext) {
    case 'wav':
      return 'LINEAR16';
    case 'mp3':
      return 'MP3';
    case 'webm':
      return 'WEBM_OPUS';
    case 'ogg':
      return 'OGG_OPUS';
    case 'flac':
      return 'FLAC';
    case 'm4a':
      return undefined; // IMPORTANT: let Google auto-detect (AAC)
    default:
      return undefined;
  }
}