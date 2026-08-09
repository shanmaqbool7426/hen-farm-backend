import express, { Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import Transaction from '../models/Transaction';
import HenHolding, { INCUBATION_DAYS, PRODUCTIVE_DAYS } from '../models/HenHolding';
import { requireAuth, type AuthedRequest } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);
const DEFAULT_HEN_PRICE = 900;
const SELLER_ROLES = ['seller'];

function isSeller(user: any) {
  return user && SELLER_ROLES.includes(user.role) && user.verified;
}

const REFERRAL_EGG_BONUS = 2;

// Referral program: real eggs only, never cash, never repeated for the same
// referred friend. Only fires once the referred friend actually buys a hen -
// signing up alone earns nothing.
async function applyReferralRewardsOnFirstOrder(buyer: any, order: any) {
  if (!buyer.referredBy || buyer.referralFirstOrderDiscountUsed) return;

  // Must be called BEFORE this order's status is saved as 'approved', so this
  // count reflects orders completed before this one.
  const priorCompletedOrders = await Order.countDocuments({
    buyerId: buyer._id.toString(),
    orderType: 'buy-hen',
    status: 'approved',
  });
  if (priorCompletedOrders > 0) return;

  const referrer = await User.findOne({ referralCode: buyer.referredBy });
  if (!referrer) return;

  buyer.referralFirstOrderDiscountUsed = true;
  await buyer.save();

  referrer.availableEggs += REFERRAL_EGG_BONUS;
  referrer.completedReferralCount += 1;
  await referrer.save();
  await new Transaction({
    userId: referrer._id.toString(),
    type: 'referral-egg-bonus',
    quantity: REFERRAL_EGG_BONUS,
    description: `${REFERRAL_EGG_BONUS} eggs credited - ${buyer.name} bought their first hen`,
    metadata: { referredUserId: buyer._id, orderId: order._id },
  }).save();
}

function makeParty(user: any) {
  return {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    whatsappNumber: user.whatsappNumber || user.phone,
    easyPaisaAccount: user.easyPaisaAccount || '',
    jazzCashAccount: user.jazzCashAccount || '',
    bankName: user.bankName || '',
    bankAccountNumber: user.bankAccountNumber || '',
    bankAccountTitle: user.bankAccountTitle || '',
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Attaches the real hen batch's incubation/laying/expiry countdown (in days)
// to an approved buy-hen order, so order history can show it without a
// separate round-trip to /orders/my-hens.
async function attachHenExpiry(order: any) {
  if (order.orderType !== 'buy-hen' || order.status !== 'approved') return null;

  const holding = await HenHolding.findOne({ orderId: order._id.toString() });
  if (!holding) return null;

  const now = Date.now();
  const layingStartsAt = holding.layingStartsAt.getTime();
  const expiresAt = holding.expiresAt.getTime();

  if (holding.retired || now >= expiresAt) {
    return { status: 'expired', daysRemaining: 0, expiresAt: holding.expiresAt };
  }

  const status: 'incubating' | 'laying' = now < layingStartsAt ? 'incubating' : 'laying';
  const daysRemaining = Math.ceil((status === 'incubating' ? layingStartsAt - now : expiresAt - now) / DAY_MS);
  return { status, daysRemaining, expiresAt: holding.expiresAt };
}

async function hydrateOrder(order: any) {
  const [buyer, seller, henExpiry] = await Promise.all([
    User.findById(order.buyerId),
    User.findById(order.sellerId),
    attachHenExpiry(order),
  ]);
  const plain = order.toObject ? order.toObject() : { ...order };
  return {
    ...plain,
    buyerId: buyer ? makeParty(buyer) : { _id: plain.buyerId, name: plain.buyerName, phone: plain.buyerPhone },
    sellerId: seller ? makeParty(seller) : { _id: plain.sellerId, name: plain.sellerName, phone: plain.sellerPhone },
    henExpiry,
  };
}

router.post('/create', async (req: AuthedRequest, res: Response) => {
  try {
    const {
      sellerId,
      dealerId,
      orderType,
      quantity,
      pricePerUnit,
      paymentMethod,
      paymentProof,
      receiverAccount,
      buyerNotes,
    } = req.body;

    // The buyer is always the authenticated caller - never a client-supplied ID.
    const normalUserId = req.userId!;
    const selectedDealerId = sellerId || dealerId;
    const qty = Number(quantity);

    if (!normalUserId || !selectedDealerId || !orderType || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'User, dealer, order type and quantity are required' });
    }

    if (!['buy-hen', 'sell-egg'].includes(orderType)) {
      return res.status(400).json({ success: false, error: 'Invalid order type' });
    }

    if (normalUserId === selectedDealerId) {
      return res.status(400).json({ success: false, error: 'Dealer and user cannot be the same account' });
    }

    // Only one pending request per type at a time - otherwise the same eggs/
    // hens could be offered to multiple dealers at once and double-approved.
    const existingPending = await Order.findOne({ buyerId: normalUserId, orderType, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: orderType === 'sell-egg'
          ? 'You already have a pending egg sale request. Wait for the dealer to respond before creating another.'
          : 'You already have a pending hen purchase request. Wait for the dealer to respond before creating another.',
      });
    }

    const [buyer, dealer] = await Promise.all([
      User.findById(normalUserId),
      User.findById(selectedDealerId),
    ]);

    if (!buyer || !dealer) {
      return res.status(404).json({ success: false, error: 'User or dealer not found' });
    }

    if (!isSeller(dealer)) {
      return res.status(400).json({ success: false, error: 'Selected seller is not a verified dealer' });
    }

    if (buyer.role !== 'buyer') {
      return res.status(400).json({ success: false, error: 'Only normal buyer accounts can create marketplace requests' });
    }

    const unitPrice = Number(pricePerUnit) || (orderType === 'sell-egg' ? dealer.eggBuyRate || 12 : dealer.henSellPrice || DEFAULT_HEN_PRICE);
    const totalAmount = qty * unitPrice;

    if (orderType === 'buy-hen' && dealer.availableHens < qty) {
      return res.status(400).json({ success: false, error: 'Dealer does not have enough hens available' });
    }

    if (orderType === 'sell-egg' && buyer.availableEggs < qty) {
      return res.status(400).json({ success: false, error: 'You do not have enough eggs to sell' });
    }

    const responseMinutes = dealer.dealerResponseMinutes || 30;
    const order = new Order({
      orderType,
      buyerId: buyer._id.toString(),
      buyerName: buyer.name,
      buyerPhone: buyer.phone,
      sellerId: dealer._id.toString(),
      sellerName: dealer.name,
      sellerPhone: dealer.phone,
      quantity: qty,
      pricePerUnit: unitPrice,
      totalAmount,
      paymentMethod: ['easypaisa', 'jazzcash', 'bank', 'wallet'].includes(paymentMethod) ? paymentMethod : 'easypaisa',
      paymentAccount: dealer.easyPaisaAccount || dealer.jazzCashAccount || dealer.bankAccountNumber || '',
      buyerPaymentAccount:
        orderType === 'sell-egg'
          ? receiverAccount || buyer.easyPaisaAccount || buyer.jazzCashAccount || buyer.bankAccountNumber || ''
          : '',
      paymentProof,
      paymentProofUploaded: Boolean(paymentProof),
      whatsappNumber: dealer.whatsappNumber || dealer.phone,
      buyerNotes,
      status: 'pending',
      expiresAt: new Date(Date.now() + responseMinutes * 60 * 1000),
    });

    await order.save();
    return res.json({
      success: true,
      message: 'Request created successfully',
      order: await hydrateOrder(order),
      expiresInMinutes: responseMinutes,
      sellerPaymentDetails: makeParty(dealer),
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create request' });
  }
});

router.get('/my-hens/:userId', async (req: AuthedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own hens' });
    }
    // Batches past expiresAt but not yet processed by the hourly job (runs at
    // most 59 minutes late) are excluded here so they never display as active.
    const holdings = await HenHolding.find({
      userId,
      retired: false,
      expiresAt: { $gt: new Date() },
    }).sort({ purchasedAt: -1 });
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    let totalHens = 0;
    let layingHens = 0;
    let incubatingHens = 0;

    const items = holdings.map((h) => {
      const layingStartsAt = h.layingStartsAt.getTime();
      const expiresAt = h.expiresAt.getTime();
      const status: 'incubating' | 'laying' = now < layingStartsAt ? 'incubating' : 'laying';
      const daysRemaining = Math.ceil((status === 'incubating' ? layingStartsAt - now : expiresAt - now) / DAY);

      if (status === 'incubating') {
        incubatingHens += h.quantity;
      } else {
        layingHens += h.quantity;
      }
      totalHens += h.quantity;

      return {
        _id: h._id,
        quantity: h.quantity,
        purchasedAt: h.purchasedAt,
        layingStartsAt: h.layingStartsAt,
        expiresAt: h.expiresAt,
        status,
        daysRemaining,
      };
    });

    return res.json({
      success: true,
      holdings: items,
      summary: { totalHens, layingHens, incubatingHens, eggsPerDay: layingHens },
    });
  } catch (error: any) {
    console.error('Get my hens error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load hens' });
  }
});

router.get('/referral-activity/:userId', async (req: AuthedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own activity' });
    }
    const [activity, totalAgg] = await Promise.all([
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(100),
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]),
    ]);
    const totalEarned = totalAgg[0]?.total || 0;
    return res.json({ success: true, activity, totalEarned });
  } catch (error: any) {
    console.error('Get referral activity error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load referral activity' });
  }
});

router.get('/my-orders/:userId', async (req: AuthedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own orders' });
    }
    // Never auto-expire an order the buyer already paid for - a dealer must
    // still be able to approve/reject it no matter how late they respond.
    await Order.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() }, paymentProofUploaded: { $ne: true } },
      { status: 'expired', rejectionReason: 'Dealer response time expired' },
    );

    const buyOrdersRaw = await Order.find({ buyerId: userId }).sort({ createdAt: -1 });
    const sellOrdersRaw = await Order.find({ sellerId: userId }).sort({ createdAt: -1 });

    const [buyOrders, sellOrders] = await Promise.all([
      Promise.all(buyOrdersRaw.map(hydrateOrder)),
      Promise.all(sellOrdersRaw.map(hydrateOrder)),
    ]);

    return res.json({ success: true, buyOrders, sellOrders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load orders' });
  }
});

router.get('/pending-approvals/:sellerId', async (req: AuthedRequest, res: Response) => {
  try {
    const { sellerId } = req.params;
    if (req.userId !== sellerId) {
      return res.status(403).json({ success: false, error: 'You can only view your own pending approvals' });
    }
    // Never auto-expire an order the buyer already paid for - a dealer must
    // still be able to approve/reject it no matter how late they respond.
    await Order.updateMany(
      { sellerId, status: 'pending', expiresAt: { $lt: new Date() }, paymentProofUploaded: { $ne: true } },
      { status: 'expired', rejectionReason: 'Dealer response time expired' },
    );

    const pendingOrdersRaw = await Order.find({ sellerId, status: 'pending' }).sort({ createdAt: -1 });
    const pendingOrders = await Promise.all(pendingOrdersRaw.map(hydrateOrder));
    return res.json({ success: true, pendingOrders });
  } catch (error: any) {
    console.error('Get pending orders error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to load pending requests' });
  }
});

router.post('/approve/:orderId', async (req: AuthedRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (order.sellerId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only assigned dealer can approve this request' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    // If the buyer already sent payment proof, the dealer can still approve
    // even after the response window - the buyer's real money is on the
    // line, so this must never silently expire on them.
    if (order.expiresAt < new Date() && !order.paymentProofUploaded) {
      order.status = 'expired';
      order.rejectionReason = 'Dealer response time expired';
      await order.save();
      return res.status(400).json({ success: false, error: 'Request expired' });
    }

    const [buyer, dealer] = await Promise.all([
      User.findById(order.buyerId),
      User.findById(order.sellerId),
    ]);

    if (!buyer || !dealer || !isSeller(dealer)) {
      return res.status(404).json({ success: false, error: 'User or dealer not found' });
    }

    if (order.orderType === 'buy-hen') {
      if (dealer.availableHens < order.quantity) {
        return res.status(400).json({ success: false, error: 'Dealer no longer has enough hens' });
      }

      // Payment happens directly between buyer and dealer (JazzCash/EasyPaisa/
      // bank, with proof) - the app never holds this money. Approval here just
      // confirms the dealer received it and is handing over the real hens.
      dealer.availableHens -= order.quantity;
      buyer.hensOwned += order.quantity;

      await Promise.all([buyer.save(), dealer.save()]);

      const purchasedAt = new Date();
      const layingStartsAt = new Date(purchasedAt.getTime() + INCUBATION_DAYS * 24 * 60 * 60 * 1000);
      await new HenHolding({
        userId: buyer._id.toString(),
        orderId: order._id.toString(),
        quantity: order.quantity,
        purchasedAt,
        layingStartsAt,
        // 65 full days of laying starting day 1 (no incubation wait)
        expiresAt: new Date(layingStartsAt.getTime() + PRODUCTIVE_DAYS * 24 * 60 * 60 * 1000),
      }).save();

      // One-time referral reward, only on the buyer's first-ever completed hen order.
      await applyReferralRewardsOnFirstOrder(buyer, order);
    } else if (order.orderType === 'sell-egg') {
      if (buyer.availableEggs < order.quantity) {
        return res.status(400).json({ success: false, error: 'Seller no longer has enough eggs' });
      }

      // Payment happens directly between dealer and seller (JazzCash/EasyPaisa/
      // bank, with proof) - approval here just confirms the egg handover.
      buyer.availableEggs -= order.quantity;
      dealer.availableEggs += order.quantity;

      await Promise.all([buyer.save(), dealer.save()]);
    }

    order.status = 'approved';
    order.approvedAt = new Date();
    order.completedAt = new Date();
    await order.save();

    return res.json({ success: true, message: 'Request approved successfully', order: await hydrateOrder(order) });
  } catch (error: any) {
    console.error('Approve order error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to approve request' });
  }
});

router.post('/reject/:orderId', async (req: AuthedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { rejectionReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (order.sellerId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Only assigned dealer can reject this request' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    order.status = 'rejected';
    order.rejectionReason = rejectionReason || 'Dealer rejected the request';
    await order.save();

    return res.json({ success: true, message: 'Request rejected', order: await hydrateOrder(order) });
  } catch (error: any) {
    console.error('Reject order error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to reject request' });
  }
});

export default router;
