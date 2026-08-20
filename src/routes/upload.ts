import express, { Response } from 'express';
import crypto from 'crypto';
import { requireAuth, type AuthedRequest } from '../middlewares/auth';

const router = express.Router();

// POST /api/upload/sign
// Returns a signed upload signature so the mobile app can upload directly
// to Cloudinary without exposing the API secret on the client.
router.post('/sign', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'payment-proofs';
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    // Cloudinary signature: SHA1 of "folder=...&timestamp=...{api_secret}"
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signaturePayload)
      .digest('hex');

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
