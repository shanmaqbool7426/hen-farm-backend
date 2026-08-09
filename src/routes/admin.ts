import { Router } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { logger } from '../lib/logger';
import { requireAuth, requireAdminRole, type AuthedRequest } from '../middlewares/auth';

const router = Router();

function sanitizeUser(user: any) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  return plain;
}

// Every route below requires a valid signed-in session AND a real 'admin'
// role on that account (verified from the JWT, never from a client-supplied
// header/body id).
router.use(requireAuth, requireAdminRole);

// Verify admin session
router.get('/me', async (req: AuthedRequest, res) => {
  const admin = await User.findById(req.userId);
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin account not found' });
  }
  return res.json({ success: true, admin: sanitizeUser(admin) });
});

// Dashboard stats
router.get('/stats', async (_req, res) => {
  try {
    const [users, sellers, buyers, orders, pendingOrders, completedOrders] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'buyer' }),
      Order.countDocuments({}),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'approved' }),
    ]);
    return res.json({
      success: true,
      stats: {
        users,
        sellers,
        buyers,
        orders,
        pendingOrders,
        completedOrders,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Admin stats error');
    return res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

// List all sellers
router.get('/sellers', async (_req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).sort({ createdAt: -1 });
    return res.json({ success: true, sellers: sellers.map(sanitizeUser) });
  } catch (error) {
    logger.error({ error }, 'Admin list sellers error');
    return res.status(500).json({ success: false, error: 'Failed to load sellers' });
  }
});

// Create a seller account (admin's people)
router.post('/sellers', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      location,
      availableHens,
      henSellPrice,
      eggBuyRate,
      dealerResponseMinutes,
      easyPaisaAccount,
      jazzCashAccount,
      bankName,
      bankAccountNumber,
      bankAccountTitle,
      whatsappNumber,
      verified,
      rating,
    } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, phone, email and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const seller = new User({
      name,
      phone,
      email,
      password,
      role: 'seller',
      referralCode: `SEL${phone.replace(/\D/g, '').slice(-6)}${Math.floor(Math.random() * 900 + 100)}`,
      location: location || '',
      availableHens: Number(availableHens) || 0,
      henSellPrice: Number(henSellPrice) || 900,
      availableEggs: 0,
      eggBuyRate: Number(eggBuyRate) || 12,
      dealerResponseMinutes: Number(dealerResponseMinutes) || 30,
      easyPaisaAccount: easyPaisaAccount || '',
      jazzCashAccount: jazzCashAccount || '',
      bankName: bankName || '',
      bankAccountNumber: bankAccountNumber || '',
      bankAccountTitle: bankAccountTitle || '',
      whatsappNumber: whatsappNumber || phone,
      verified: Boolean(verified),
      rating: Number(rating) || 0,
    });
    await seller.save();

    logger.info({ sellerId: seller._id }, 'Seller created by admin');
    return res.json({ success: true, seller: sanitizeUser(seller) });
  } catch (error) {
    logger.error({ error }, 'Admin create seller error');
    return res.status(500).json({ success: false, error: 'Failed to create seller' });
  }
});

// Update a seller account
router.patch('/sellers/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }
    if (seller.role !== 'seller') {
      return res.status(400).json({ success: false, error: 'Account is not a seller' });
    }

    const allowed = [
      'name', 'phone', 'email', 'location', 'availableHens', 'henSellPrice', 'availableEggs',
      'eggBuyRate', 'dealerResponseMinutes', 'easyPaisaAccount', 'jazzCashAccount',
      'bankName', 'bankAccountNumber', 'bankAccountTitle', 'whatsappNumber',
      'verified', 'rating',
    ];
    const numericKeys = ['availableHens', 'henSellPrice', 'availableEggs', 'eggBuyRate', 'dealerResponseMinutes', 'rating'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (seller as any)[key] = typeof req.body[key] === 'string' && numericKeys.includes(key)
          ? Number(req.body[key])
          : req.body[key];
      }
    }
    await seller.save();
    return res.json({ success: true, seller: sanitizeUser(seller) });
  } catch (error) {
    logger.error({ error }, 'Admin update seller error');
    return res.status(500).json({ success: false, error: 'Failed to update seller' });
  }
});

// List all users (buyers/sellers/admins)
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, users: users.map(sanitizeUser) });
  } catch (error) {
    logger.error({ error }, 'Admin list users error');
    return res.status(500).json({ success: false, error: 'Failed to load users' });
  }
});


// List all orders
router.get('/orders', async (_req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    logger.error({ error }, 'Admin list orders error');
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
});

export default router;
