import upload from '../middlewares/upload.js';
import { uploadFile } from '../services/upload.service.js';
import { Router } from 'express';
import { uploadLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
      });
    }

    const result = await uploadFile(req.file.path);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Upload Error:', err);

    res.status(500).json({
      success: false,
      error: err.message || 'Upload failed',
    });
  }
});

export default router;