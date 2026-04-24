import upload from '../middlewares/upload.js';
import { uploadFile } from '../services/upload.service.js';
import { Router } from 'express';

const router = Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const result = await uploadFile(req.file.path);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.log("Error: ", err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;