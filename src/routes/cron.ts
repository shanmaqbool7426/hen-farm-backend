import { Router, type IRouter } from "express";
import { processDailyEggs } from "../jobs/daily-eggs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Vercel Cron hits this on the schedule defined in vercel.json (see the
// `crons` array there). Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests once
// CRON_SECRET is set as a project env var - this rejects anyone else who
// finds the URL and tries to trigger egg credits on demand.
//
// This lives as a normal route (not a separate Vercel serverless function)
// because a second function nested under api/cron/ conflicted with the main
// api/[...path] catch-all's routing for every other multi-segment path.
router.get("/daily-eggs", async (req, res) => {
  const expected = process.env.CRON_SECRET;
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    await processDailyEggs();
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Cron daily-eggs run failed");
    return res.status(500).json({ success: false, error: "Cron run failed" });
  }
});

export default router;
