import User from '../models/User';
import HenHolding from '../models/HenHolding';
import Transaction from '../models/Transaction';
import { logger } from '../lib/logger';

// TEMPORARY FOR TESTING - production behavior is "at most once per calendar
// day" (compares lastEggCreditDate's date string to today's). For fast
// testing this is swapped to "at most once per CREDIT_INTERVAL_MS", checked
// on a matching short setInterval below. Revert both to the daily/hourly
// versions before going back to production (see git history for the old code).
const CREDIT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

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

    let credited = 0;
    for (const holding of layingHoldings) {
      const elapsedSinceLastCredit = holding.lastEggCreditDate
        ? now.getTime() - holding.lastEggCreditDate.getTime()
        : Infinity;
      if (elapsedSinceLastCredit < CREDIT_INTERVAL_MS) continue;

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
  logger.info('Daily egg yield job scheduler started (TEST MODE: every 2 min)');
  processDailyEggs();
  setInterval(processDailyEggs, CREDIT_INTERVAL_MS);
}
