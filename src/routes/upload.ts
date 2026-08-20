import express, { Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, type AuthedRequest } from '../middlewares/auth';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload/sign
// Returns a signed upload signature so the mobile app can upload directly
// to Cloudinary without exposing the API secret on the client.
router.post('/sign', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'payment-proofs';

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return res.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error: any) {
    console.error('Upload sign error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate upload signature' });
  }
});

export default router;
