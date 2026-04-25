import { bucket } from '../config/gcs.js';
import fs from 'fs';
import path from 'path';

export const uploadFile = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const destination = `uploads/${Date.now()}-${fileName}`;

    await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // delete local file
    fs.unlinkSync(filePath);

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    return {
      url: publicUrl,
      path: destination,
      type: fileName.split('.').pop(),
    };

  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw err;
  }
};