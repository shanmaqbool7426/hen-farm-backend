import { Router } from 'express';
import User from '../models/User';
import { logger } from '../lib/logger';
import mongoose from 'mongoose';
import { hashPassword, verifyPassword, isLegacyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { requireAuth, type AuthedRequest } from '../middlewares/auth';
import { inMemoryUsers } from '../lib/inMemoryStore';

const router = Router();
const isMongoConnected = () => mongoose.connection.readyState === 1;

function sanitizeUser(user: any) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  return plain;
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = isMongoConnected()
      ? await User.findOne({ $or: [{ email }, { phone: email }] })
      : inMemoryUsers.find((u) => u.email === email || u.phone === email);

    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (isLegacyPassword(user.password) && 'save' in user) {
      user.password = hashPassword(password);
      await user.save();
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    logger.info({ userId: user._id, email }, 'User logged in');
    return res.json({ success: true, user: sanitizeUser(user), token });
  } catch (error) {
    logger.error({ error }, 'Login error');
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email and password required' });
    }

    if (isMongoConnected()) {
      const existing = await User.findOne({ $or: [{ email }, { phone }] });
      if (existing) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }

      const phoneNumber = phone || `030${Date.now().toString().slice(-8)}`;
      const user = new User({
        name,
        email,
        phone: phoneNumber,
        password: hashPassword(password),
        role: 'buyer',
        referralCode: `HF${phoneNumber.slice(-6)}`,
        // Only counts toward the referrer's reward once this user completes a
        // real order - see applyReferralRewardsOnFirstOrder in routes/orders.ts.
        referredBy: referralCode,
        whatsappNumber: phoneNumber,
      });
      await user.save();

      const token = signToken({ userId: user._id.toString(), role: user.role });

      logger.info({ userId: user._id }, 'User registered');
      return res.json({ success: true, user: sanitizeUser(user), token });
    }

    const existing = inMemoryUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const phoneNumber = phone || `030${Date.now().toString().slice(-8)}`;
    const user = {
      _id: Date.now().toString(),
      name,
      email,
      phone: phoneNumber,
      password: hashPassword(password),
      role: 'buyer',
      referralCode: `HF${phoneNumber.slice(-6)}`,
      referredBy: referralCode,
      referralFirstOrderDiscountUsed: false,
      completedReferralCount: 0,
      location: '',
      rating: 0,
      verified: false,
      easyPaisaAccount: '',
      jazzCashAccount: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountTitle: '',
      whatsappNumber: phoneNumber,
      availableHens: 0,
      henSellPrice: 900,
      hensOwned: 0,
      availableEggs: 0,
      eggBuyRate: 0,
      dealerResponseMinutes: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryUsers.push(user);
    logger.warn('MongoDB not connected, user created in memory');
    const token = signToken({ userId: user._id, role: user.role as 'buyer' });
    return res.json({ success: true, user: sanitizeUser(user), token });
  } catch (error) {
    logger.error({ error }, 'Register error');
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.get('/user/:userId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own account' });
    }

    const user = isMongoConnected()
      ? await User.findById(req.params.userId)
      : inMemoryUsers.find((u) => u._id === req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    logger.error({ error }, 'Get user error');
    return res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Self-service profile update. Only real contact/payment/pricing fields are
// editable here - never role, verification, referral counters, or inventory.
const EDITABLE_FIELDS = [
  'name', 'phone', 'location', 'whatsappNumber',
  'easyPaisaAccount', 'jazzCashAccount', 'bankName', 'bankAccountNumber', 'bankAccountTitle',
  'henSellPrice', 'eggBuyRate', 'dealerResponseMinutes',
];
const NUMERIC_FIELDS = ['henSellPrice', 'eggBuyRate', 'dealerResponseMinutes'];

router.patch('/profile/:userId', requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own profile' });
    }

    const updates: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== undefined && req.body[key] !== '') {
        updates[key] = NUMERIC_FIELDS.includes(key) ? Number(req.body[key]) : req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    if (isMongoConnected()) {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      Object.assign(user, updates);
      await user.save();
      logger.info({ userId: user._id }, 'Profile updated');
      return res.json({ success: true, user: sanitizeUser(user) });
    }

    const user = inMemoryUsers.find((u) => u._id === req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    Object.assign(user, updates);
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    logger.error({ error }, 'Profile update error');
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

router.post('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = isMongoConnected()
      ? await User.findById(req.userId)
      : inMemoryUsers.find((u) => u._id === req.userId);

    if (!user || !user.password || !verifyPassword(currentPassword, user.password)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = hashPassword(newPassword);
    if ('save' in user) {
      await user.save();
    }

    logger.info({ userId: user._id }, 'Password changed');
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Change password error');
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;
