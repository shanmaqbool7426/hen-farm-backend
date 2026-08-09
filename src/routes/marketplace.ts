import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { inMemoryUsers } from '../lib/inMemoryStore';

const router = express.Router();
const SELLER_ROLES = ['seller'];

const isMongoConnected = () => mongoose.connection.readyState === 1;

router.get('/sellers', async (_req, res) => {
  try {
    const dealers = isMongoConnected()
      ? await User.find({
          role: { $in: SELLER_ROLES },
          availableHens: { $gt: 0 },
        }).sort({ verified: -1, rating: -1, availableHens: -1 })
      : inMemoryUsers.filter(
          (dealer) =>
            SELLER_ROLES.includes(dealer.role) &&
            dealer.availableHens > 0,
        );

    const sellers = dealers.map((dealer) => ({
      userId: dealer._id.toString(),
      userName: dealer.name,
      role: dealer.role,
      location: dealer.location || '',
      totalHens: dealer.availableHens || 0,
      pricePerHen: dealer.henSellPrice || 900,
      eggBuyRate: dealer.eggBuyRate || 28,
      responseMinutes: dealer.dealerResponseMinutes || 30,
      rating: dealer.rating || 0,
      verified: dealer.verified,
      easyPaisaAccount: dealer.easyPaisaAccount || '',
      jazzCashAccount: dealer.jazzCashAccount || '',
      bankName: dealer.bankName || '',
      bankAccountNumber: dealer.bankAccountNumber || '',
      bankAccountTitle: dealer.bankAccountTitle || '',
      whatsappNumber: dealer.whatsappNumber || dealer.phone,
    }));

    return res.json({ success: true, sellers });
  } catch (error) {
    console.error('Get dealers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load dealers' });
  }
});

const BADGES: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze' };

// Real buyers who currently have real eggs in stock, ranked by count so
// dealers can see who to contact - top 3 get a leaderboard badge.
router.get('/egg-sellers', async (_req, res) => {
  try {
    const holders = isMongoConnected()
      ? await User.find({ availableEggs: { $gt: 0 } }).sort({ availableEggs: -1 }).limit(50)
      : inMemoryUsers
          .filter((u) => (u.availableEggs || 0) > 0)
          .sort((a, b) => (b.availableEggs || 0) - (a.availableEggs || 0));

    const eggSellers = holders.map((user, index) => {
      const rank = index + 1;
      return {
        userId: user._id.toString(),
        userName: user.name,
        location: user.location || '',
        availableEggs: user.availableEggs || 0,
        rank,
        badge: BADGES[rank] || null,
        whatsappNumber: user.whatsappNumber || user.phone,
      };
    });

    return res.json({ success: true, eggSellers });
  } catch (error) {
    console.error('Get egg sellers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load egg sellers' });
  }
});

export default router;
