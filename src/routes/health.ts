import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { getDbFallbackStatus } from "../db/mongoose";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

const MONGOOSE_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

router.get("/dbstatus", (_req, res) => {
  const state = mongoose.connection.readyState;
  const { usingInMemoryFallback, lastConnectionError } = getDbFallbackStatus();
  res.json({
    connected: state === 1,
    state: MONGOOSE_STATES[state] || "unknown",
    usingInMemoryFallback,
    lastConnectionError,
    note: state === 1
      ? "Real MongoDB is connected - all data is real."
      : "MongoDB is NOT connected - the app is using the in-memory fallback (only Shan Dealer / Ali Buyer test accounts exist here, nothing you seeded).",
  });
});

export default router;
