import User from '../models/User';
import HenHolding from '../models/HenHolding';
import Transaction from '../models/Transaction';
import { logger } from '../lib/logger';

const getYieldIntervalMs = () => (Number(process.env.EGG_YIELD_INTERVAL_SEC) || 86400) * 1000;
const getCheckIntervalMs = () => (Number(process.env.EGG_CHECK_INTERVAL_SEC) || 3600) * 1000;

// Credits each real hen batch's natural egg output to its owner's egg stock,
// and retires batches once their 65-day productive life ends. This is NOT a
// cash reward - it only adds real eggs, which the owner must then actually
// sell to a dealer (a real, dealer-approved transaction) before any money
// changes hands.
export async function processDailyEggs() {
  const now = new Date();

  try {
    const layingHoldings = await HenHolding.find({
      retired: false,
      layingStartsAt: { $lte: now },
      expiresAt: { $gt: now },
    });

    const yieldIntervalMs = getYieldIntervalMs();
    const isCustomShortInterval = yieldIntervalMs < 24 * 60 * 60 * 1000;
    const today = now.toISOString().split('T')[0];

    let credited = 0;
    for (const holding of layingHoldings) {
      if (isCustomShortInterval) {
        const lastCreditTime = holding.lastEggCreditDate
          ? holding.lastEggCreditDate.getTime()
          : 0;
        if (now.getTime() - lastCreditTime < yieldIntervalMs) continue;
      } else {
        const lastCreditDate = holding.lastEggCreditDate
          ? holding.lastEggCreditDate.toISOString().split('T')[0]
          : null;
        if (lastCreditDate === today) continue;
      }

      await User.updateOne({ _id: holding.userId }, { $inc: { availableEggs: holding.quantity } });
      holding.lastEggCreditDate = now;
      await holding.save();
      await new Transaction({
        userId: holding.userId,
        type: 'hen-egg-yield',
        quantity: holding.quantity,
        description: `${holding.quantity} egg${holding.quantity > 1 ? 's' : ''} credited - daily yield from your hens`,
        metadata: { holdingId: holding._id },
      }).save();
      credited++;
    }
    if (credited > 0) {
      logger.info({ credited }, 'Daily egg yield credited');
    }
  } catch (error) {
    logger.error({ error }, 'Daily egg yield processing failed');
  }

  try {
    const expiredHoldings = await HenHolding.find({
      retired: false,
      expiresAt: { $lte: now },
    });

    for (const holding of expiredHoldings) {
      holding.retired = true;
      await holding.save();
      await User.updateOne(
        { _id: holding.userId },
        { $inc: { hensOwned: -holding.quantity } },
      );
      logger.info({ userId: holding.userId, quantity: holding.quantity }, 'Hen batch retired after 65-day productive life');
    }
  } catch (error) {
    logger.error({ error }, 'Hen retirement processing failed');
  }
}

export function startDailyEggsJob() {
  const checkInterval = getCheckIntervalMs();
  logger.info({
    yieldIntervalMs: getYieldIntervalMs(),
    checkIntervalMs: checkInterval
  }, 'Daily egg yield job scheduler started - waiting for scheduled trigger');
  // NOTE: We do NOT call processDailyEggs() immediately on server start.
  // Vercel serverless restarts on every cold start which would credit eggs
  // on every restart. Instead we rely solely on the Vercel cron job
  // (0 7 * * * = 12:00 PM PST daily) via /api/cron/daily-eggs route.
  // The setInterval below is only a fallback for non-Vercel local dev.
  if (process.env.NODE_ENV === 'development') {
    setInterval(processDailyEggs, checkInterval);
  }
}
