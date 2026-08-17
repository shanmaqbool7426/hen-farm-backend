import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    

// src/index.ts
import { readFileSync } from "fs";
import { resolve } from "path";

// src/app.ts
import express3 from "express";
import cors from "cors";
import pinoHttpImport from "pino-http";

// src/routes/index.ts
import { Router as Router5 } from "express";

// src/routes/health.ts
import { Router } from "express";
import mongoose2 from "mongoose";

// src/db/mongoose.ts
import mongoose from "mongoose";
import dns from "dns";

// src/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// src/db/mongoose.ts
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    logger.warn({ error: e }, "Failed to override DNS servers - SRV lookups may fail on some networks");
  }
}
var isProduction2 = process.env.NODE_ENV === "production";
var RETRY_DELAYS_MS = [2e3, 5e3, 1e4];
var connectPromise = null;
var usingInMemoryFallback = false;
var lastConnectionError = null;
function getDbFallbackStatus() {
  return { usingInMemoryFallback, lastConnectionError };
}
function sleep(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}
async function attemptConnect(uri) {
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 1e4,
        socketTimeoutMS: 45e3
      });
      logger.info("\u2705 MongoDB Connected Successfully!");
      usingInMemoryFallback = false;
      lastConnectionError = null;
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastConnectionError = message;
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (delay) {
        logger.error({ attempt, error: message }, `MongoDB connection attempt ${attempt} failed, retrying in ${delay}ms`);
        await sleep(delay);
      } else {
        logger.error({ attempt, error: message }, "MongoDB connection failed after all retry attempts");
        throw error;
      }
    }
  }
}
async function connectDB2() {
  if (mongoose.connection.readyState === 1) return;
  if (connectPromise) return connectPromise;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    lastConnectionError = "MONGODB_URI not set in environment";
    usingInMemoryFallback = true;
    if (isProduction2) {
      const errMsg = "MONGODB_URI not set in environment - production requires a real database";
      logger.error(errMsg);
      throw new Error(errMsg);
    }
    logger.warn("MONGODB_URI not set in environment - running with in-memory fallback (dev only)");
    return;
  }
  connectPromise = attemptConnect(MONGODB_URI).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    lastConnectionError = message;
    if (isProduction2) {
      logger.error({ error: message }, "\u274C MongoDB connection failed after all retries - production requires a real database");
      throw error;
    }
    usingInMemoryFallback = true;
    logger.warn({ error: message }, "\u26A0\uFE0F  MongoDB connection failed after all retries - continuing with IN-MEMORY data (dev only, nothing will persist)");
  }).finally(() => {
    connectPromise = null;
  });
  return connectPromise;
}
mongoose.connection.on("disconnected", () => {
  usingInMemoryFallback = true;
  logger.warn("MongoDB Disconnected");
});
mongoose.connection.on("reconnected", () => {
  usingInMemoryFallback = false;
  lastConnectionError = null;
  logger.info("MongoDB Reconnected");
});
mongoose.connection.on("error", (error) => {
  logger.error({ error }, "MongoDB Error");
});

// src/routes/health.ts
var router = Router();
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
var MONGOOSE_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};
router.get("/dbstatus", (_req, res) => {
  const state = mongoose2.connection.readyState;
  const { usingInMemoryFallback: usingInMemoryFallback2, lastConnectionError: lastConnectionError2 } = getDbFallbackStatus();
  res.json({
    connected: state === 1,
    state: MONGOOSE_STATES[state] || "unknown",
    usingInMemoryFallback: usingInMemoryFallback2,
    lastConnectionError: lastConnectionError2,
    note: state === 1 ? "Real MongoDB is connected - all data is real." : "MongoDB is NOT connected - the app is using the in-memory fallback (only Shan Dealer / Ali Buyer test accounts exist here, nothing you seeded)."
  });
});
var health_default = router;

// src/routes/auth.ts
import { Router as Router2 } from "express";

// src/models/User.ts
import mongoose3, { Schema } from "mongoose";
var UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer", index: true },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String },
  referralFirstOrderDiscountUsed: { type: Boolean, default: false },
  completedReferralCount: { type: Number, default: 0 },
  location: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  easyPaisaAccount: { type: String },
  jazzCashAccount: { type: String },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  bankAccountTitle: { type: String },
  whatsappNumber: { type: String },
  availableHens: { type: Number, default: 0 },
  henSellPrice: { type: Number, default: 900 },
  hensOwned: { type: Number, default: 0 },
  availableEggs: { type: Number, default: 0 },
  eggBuyRate: { type: Number, default: 28 },
  dealerResponseMinutes: { type: Number, default: 30 }
}, {
  timestamps: true
});
var User_default = mongoose3.model("User", UserSchema);

// src/routes/auth.ts
import mongoose4 from "mongoose";

// src/utils/password.ts
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!stored.includes(":")) {
    return password === stored;
  }
  const [salt, storedHash] = stored.split(":");
  const computedHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(storedHash), Buffer.from(computedHash));
}
function isLegacyPassword(stored) {
  return !stored.includes(":");
}

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set - refusing to sign or verify tokens");
    }
    return "dev-secret-key-12345";
  }
  return secret;
}
function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

// src/middlewares/auth.ts
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : void 0;
  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired session - please log in again" });
  }
}
function requireAdminRole(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ success: false, error: "Only platform admin can perform this action" });
  }
  next();
}

// src/lib/inMemoryStore.ts
var TEST_USERS = [
  {
    _id: "67890shan123456789",
    name: "Shan Dealer",
    email: "shanmaqbool12345@gmail.com",
    phone: "03069829158",
    password: hashPassword("Shan7426@"),
    role: "seller",
    referralCode: "SHAN001",
    referralFirstOrderDiscountUsed: false,
    completedReferralCount: 0,
    location: "Islamabad",
    rating: 4.8,
    verified: true,
    easyPaisaAccount: "03069829158",
    jazzCashAccount: "03069829158",
    bankName: "Meezan Bank",
    bankAccountNumber: "0123456789012",
    bankAccountTitle: "Shan Maqbool",
    whatsappNumber: "+923069829158",
    availableHens: 1e4,
    henSellPrice: 900,
    hensOwned: 0,
    availableEggs: 0,
    eggBuyRate: 12,
    dealerResponseMinutes: 30,
    createdAt: "2025-01-28T10:00:00.000Z",
    updatedAt: "2025-01-28T10:00:00.000Z"
  },
  {
    _id: "67890ali1234567890",
    name: "Ali Buyer",
    email: "ali@mailinator.com",
    phone: "03001234567",
    password: hashPassword("Shan7426@"),
    role: "buyer",
    referralCode: "ALI001",
    referralFirstOrderDiscountUsed: false,
    completedReferralCount: 0,
    location: "Lahore",
    rating: 0,
    verified: false,
    easyPaisaAccount: "",
    jazzCashAccount: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountTitle: "",
    whatsappNumber: "+923001234567",
    availableHens: 0,
    henSellPrice: 900,
    hensOwned: 0,
    availableEggs: 0,
    eggBuyRate: 0,
    dealerResponseMinutes: 30,
    createdAt: "2025-01-28T10:00:00.000Z",
    updatedAt: "2025-01-28T10:00:00.000Z"
  }
];
var inMemoryUsers = [...TEST_USERS];

// src/routes/auth.ts
var router2 = Router2();
var isMongoConnected = () => mongoose4.connection.readyState === 1;
function sanitizeUser(user) {
  const plain = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plain.password;
  return plain;
}
router2.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }
    const user = isMongoConnected() ? await User_default.findOne({ $or: [{ email }, { phone: email }] }) : inMemoryUsers.find((u) => u.email === email || u.phone === email);
    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }
    if (isLegacyPassword(user.password) && "save" in user) {
      user.password = hashPassword(password);
      await user.save();
    }
    const token = signToken({ userId: user._id.toString(), role: user.role });
    logger.info({ userId: user._id, email }, "User logged in");
    return res.json({ success: true, user: sanitizeUser(user), token });
  } catch (error) {
    logger.error({ error }, "Login error");
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});
router2.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: "Name, email and password required" });
    }
    if (isMongoConnected()) {
      const existing2 = await User_default.findOne({ $or: [{ email }, { phone }] });
      if (existing2) {
        return res.status(400).json({ success: false, error: "User already exists" });
      }
      const phoneNumber2 = phone || `030${Date.now().toString().slice(-8)}`;
      const user2 = new User_default({
        name,
        email,
        phone: phoneNumber2,
        password: hashPassword(password),
        role: "buyer",
        referralCode: `HF${phoneNumber2.slice(-6)}`,
        // Only counts toward the referrer's reward once this user completes a
        // real order - see applyReferralRewardsOnFirstOrder in routes/orders.ts.
        referredBy: referralCode,
        whatsappNumber: phoneNumber2
      });
      await user2.save();
      const token2 = signToken({ userId: user2._id.toString(), role: user2.role });
      logger.info({ userId: user2._id }, "User registered");
      return res.json({ success: true, user: sanitizeUser(user2), token: token2 });
    }
    const existing = inMemoryUsers.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }
    const phoneNumber = phone || `030${Date.now().toString().slice(-8)}`;
    const user = {
      _id: Date.now().toString(),
      name,
      email,
      phone: phoneNumber,
      password: hashPassword(password),
      role: "buyer",
      referralCode: `HF${phoneNumber.slice(-6)}`,
      referredBy: referralCode,
      referralFirstOrderDiscountUsed: false,
      completedReferralCount: 0,
      location: "",
      rating: 0,
      verified: false,
      easyPaisaAccount: "",
      jazzCashAccount: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountTitle: "",
      whatsappNumber: phoneNumber,
      availableHens: 0,
      henSellPrice: 900,
      hensOwned: 0,
      availableEggs: 0,
      eggBuyRate: 0,
      dealerResponseMinutes: 30,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    inMemoryUsers.push(user);
    logger.warn("MongoDB not connected, user created in memory");
    const token = signToken({ userId: user._id, role: user.role });
    return res.json({ success: true, user: sanitizeUser(user), token });
  } catch (error) {
    logger.error({ error }, "Register error");
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});
router2.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "You can only view your own account" });
    }
    let user;
    if (isMongoConnected()) {
      try {
        user = await User_default.findById(req.params.userId);
      } catch {
        user = await User_default.findOne({ _id: req.params.userId });
      }
    } else {
      user = inMemoryUsers.find((u) => u._id === req.params.userId);
    }
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    logger.error({ error }, "Get user error");
    return res.status(500).json({ success: false, error: "Failed to get user" });
  }
});
var EDITABLE_FIELDS = [
  "name",
  "phone",
  "location",
  "whatsappNumber",
  "easyPaisaAccount",
  "jazzCashAccount",
  "bankName",
  "bankAccountNumber",
  "bankAccountTitle",
  "henSellPrice",
  "eggBuyRate",
  "dealerResponseMinutes"
];
var NUMERIC_FIELDS = ["henSellPrice", "eggBuyRate", "dealerResponseMinutes"];
router2.patch("/profile/:userId", requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "You can only edit your own profile" });
    }
    const updates = {};
    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== void 0 && req.body[key] !== "") {
        updates[key] = NUMERIC_FIELDS.includes(key) ? Number(req.body[key]) : req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }
    if (isMongoConnected()) {
      const user2 = await User_default.findById(req.params.userId);
      if (!user2) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      Object.assign(user2, updates);
      await user2.save();
      logger.info({ userId: user2._id }, "Profile updated");
      return res.json({ success: true, user: sanitizeUser(user2) });
    }
    const user = inMemoryUsers.find((u) => u._id === req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    Object.assign(user, updates);
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    logger.error({ error }, "Profile update error");
    return res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});
router2.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }
    const user = isMongoConnected() ? await User_default.findById(req.userId) : inMemoryUsers.find((u) => u._id === req.userId);
    if (!user || !user.password || !verifyPassword(currentPassword, user.password)) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }
    user.password = hashPassword(newPassword);
    if ("save" in user) {
      await user.save();
    }
    logger.info({ userId: user._id }, "Password changed");
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Change password error");
    return res.status(500).json({ success: false, error: "Failed to change password" });
  }
});
var auth_default = router2;

// src/routes/marketplace.ts
import express from "express";
import mongoose5 from "mongoose";
var router3 = express.Router();
var SELLER_ROLES = ["seller"];
var isMongoConnected2 = () => mongoose5.connection.readyState === 1;
router3.get("/sellers", async (_req, res) => {
  try {
    const dealers = isMongoConnected2() ? await User_default.find({
      role: { $in: SELLER_ROLES },
      availableHens: { $gt: 0 }
    }).sort({ verified: -1, rating: -1, availableHens: -1 }) : inMemoryUsers.filter(
      (dealer) => SELLER_ROLES.includes(dealer.role) && dealer.availableHens > 0
    );
    const sellers = dealers.map((dealer) => ({
      userId: dealer._id.toString(),
      userName: dealer.name,
      role: dealer.role,
      location: dealer.location || "",
      totalHens: dealer.availableHens || 0,
      pricePerHen: dealer.henSellPrice || 900,
      eggBuyRate: dealer.eggBuyRate || 28,
      responseMinutes: dealer.dealerResponseMinutes || 30,
      rating: dealer.rating || 0,
      verified: dealer.verified,
      easyPaisaAccount: dealer.easyPaisaAccount || "",
      jazzCashAccount: dealer.jazzCashAccount || "",
      bankName: dealer.bankName || "",
      bankAccountNumber: dealer.bankAccountNumber || "",
      bankAccountTitle: dealer.bankAccountTitle || "",
      whatsappNumber: dealer.whatsappNumber || dealer.phone
    }));
    return res.json({ success: true, sellers });
  } catch (error) {
    console.error("Get dealers error:", error);
    return res.status(500).json({ success: false, error: "Failed to load dealers" });
  }
});
var BADGES = { 1: "gold", 2: "silver", 3: "bronze" };
router3.get("/egg-sellers", async (_req, res) => {
  try {
    const holders = isMongoConnected2() ? await User_default.find({ availableEggs: { $gt: 0 } }).sort({ availableEggs: -1 }).limit(50) : inMemoryUsers.filter((u) => (u.availableEggs || 0) > 0).sort((a, b) => (b.availableEggs || 0) - (a.availableEggs || 0));
    const eggSellers = holders.map((user, index) => {
      const rank = index + 1;
      return {
        userId: user._id.toString(),
        userName: user.name,
        location: user.location || "",
        availableEggs: user.availableEggs || 0,
        rank,
        badge: BADGES[rank] || null,
        whatsappNumber: user.whatsappNumber || user.phone
      };
    });
    return res.json({ success: true, eggSellers });
  } catch (error) {
    console.error("Get egg sellers error:", error);
    return res.status(500).json({ success: false, error: "Failed to load egg sellers" });
  }
});
var marketplace_default = router3;

// src/routes/orders.ts
import express2 from "express";

// src/models/Order.ts
import mongoose6, { Schema as Schema2 } from "mongoose";
var OrderSchema = new Schema2({
  orderType: {
    type: String,
    enum: ["buy-hen", "sell-egg"],
    required: true,
    index: true
  },
  buyerId: { type: String, required: true, index: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  sellerId: { type: String, required: true, index: true },
  sellerName: { type: String, required: true },
  sellerPhone: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ["easypaisa", "jazzcash", "bank", "wallet"],
    default: "wallet"
  },
  paymentAccount: { type: String },
  buyerPaymentAccount: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed", "cancelled", "expired"],
    default: "pending",
    index: true
  },
  paymentProof: { type: String },
  paymentProofUploaded: { type: Boolean, default: false },
  whatsappNumber: { type: String, required: true },
  approvedAt: { type: Date },
  expiresAt: { type: Date, required: true, index: true },
  completedAt: { type: Date },
  buyerNotes: { type: String },
  sellerNotes: { type: String },
  rejectionReason: { type: String }
}, {
  timestamps: true
});
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ orderType: 1, status: 1 });
var Order_default = mongoose6.model("Order", OrderSchema);

// src/models/Transaction.ts
import mongoose7, { Schema as Schema3 } from "mongoose";
var TransactionSchema = new Schema3({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["referral-egg-bonus", "hen-egg-yield"],
    required: true
  },
  quantity: { type: Number, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema3.Types.Mixed }
}, {
  timestamps: true
});
var Transaction_default = mongoose7.model("Transaction", TransactionSchema);

// src/models/HenHolding.ts
import mongoose8, { Schema as Schema4 } from "mongoose";
var INCUBATION_DAYS = 0;
var PRODUCTIVE_DAYS = 65;
var HenHoldingSchema = new Schema4({
  userId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },
  quantity: { type: Number, required: true },
  purchasedAt: { type: Date, required: true },
  layingStartsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  lastEggCreditDate: { type: Date },
  retired: { type: Boolean, default: false }
}, {
  timestamps: true
});
var HenHolding_default = mongoose8.model("HenHolding", HenHoldingSchema);

// src/routes/orders.ts
var router4 = express2.Router();
router4.use(requireAuth);
var DEFAULT_HEN_PRICE = 900;
var SELLER_ROLES2 = ["seller"];
function isSeller(user) {
  return user && SELLER_ROLES2.includes(user.role) && user.verified;
}
var REFERRAL_EGG_BONUS = 2;
async function applyReferralRewardsOnFirstOrder(buyer, order) {
  if (!buyer.referredBy || buyer.referralFirstOrderDiscountUsed) return;
  const priorCompletedOrders = await Order_default.countDocuments({
    buyerId: buyer._id.toString(),
    orderType: "buy-hen",
    status: "approved"
  });
  if (priorCompletedOrders > 0) return;
  const referrer = await User_default.findOne({ referralCode: buyer.referredBy });
  if (!referrer) return;
  buyer.referralFirstOrderDiscountUsed = true;
  await buyer.save();
  referrer.availableEggs += REFERRAL_EGG_BONUS;
  referrer.completedReferralCount += 1;
  await referrer.save();
  await new Transaction_default({
    userId: referrer._id.toString(),
    type: "referral-egg-bonus",
    quantity: REFERRAL_EGG_BONUS,
    description: `${REFERRAL_EGG_BONUS} eggs credited - ${buyer.name} bought their first hen`,
    metadata: { referredUserId: buyer._id, orderId: order._id }
  }).save();
}
function makeParty(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    whatsappNumber: user.whatsappNumber || user.phone,
    easyPaisaAccount: user.easyPaisaAccount || "",
    jazzCashAccount: user.jazzCashAccount || "",
    bankName: user.bankName || "",
    bankAccountNumber: user.bankAccountNumber || "",
    bankAccountTitle: user.bankAccountTitle || ""
  };
}
var DAY_MS = 24 * 60 * 60 * 1e3;
async function attachHenExpiry(order) {
  if (order.orderType !== "buy-hen" || order.status !== "approved") return null;
  const holding = await HenHolding_default.findOne({ orderId: order._id.toString() });
  if (!holding) return null;
  const now = Date.now();
  const layingStartsAt = holding.layingStartsAt.getTime();
  const expiresAt = holding.expiresAt.getTime();
  if (holding.retired || now >= expiresAt) {
    return { status: "expired", daysRemaining: 0, expiresAt: holding.expiresAt };
  }
  const status = now < layingStartsAt ? "incubating" : "laying";
  const daysRemaining = Math.ceil((status === "incubating" ? layingStartsAt - now : expiresAt - now) / DAY_MS);
  return { status, daysRemaining, expiresAt: holding.expiresAt };
}
async function hydrateOrder(order) {
  const [buyer, seller, henExpiry] = await Promise.all([
    User_default.findById(order.buyerId),
    User_default.findById(order.sellerId),
    attachHenExpiry(order)
  ]);
  const plain = order.toObject ? order.toObject() : { ...order };
  return {
    ...plain,
    buyerId: buyer ? makeParty(buyer) : { _id: plain.buyerId, name: plain.buyerName, phone: plain.buyerPhone },
    sellerId: seller ? makeParty(seller) : { _id: plain.sellerId, name: plain.sellerName, phone: plain.sellerPhone },
    henExpiry
  };
}
router4.post("/create", async (req, res) => {
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
      buyerNotes
    } = req.body;
    const normalUserId = req.userId;
    const selectedDealerId = sellerId || dealerId;
    const qty = Number(quantity);
    if (!normalUserId || !selectedDealerId || !orderType || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: "User, dealer, order type and quantity are required" });
    }
    if (!["buy-hen", "sell-egg"].includes(orderType)) {
      return res.status(400).json({ success: false, error: "Invalid order type" });
    }
    if (normalUserId === selectedDealerId) {
      return res.status(400).json({ success: false, error: "Dealer and user cannot be the same account" });
    }
    const existingPending = await Order_default.findOne({ buyerId: normalUserId, orderType, status: "pending" });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: orderType === "sell-egg" ? "You already have a pending egg sale request. Wait for the dealer to respond before creating another." : "You already have a pending hen purchase request. Wait for the dealer to respond before creating another."
      });
    }
    const [buyer, dealer] = await Promise.all([
      User_default.findById(normalUserId),
      User_default.findById(selectedDealerId)
    ]);
    if (!buyer || !dealer) {
      return res.status(404).json({ success: false, error: "User or dealer not found" });
    }
    if (!isSeller(dealer)) {
      return res.status(400).json({ success: false, error: "Selected seller is not a verified dealer" });
    }
    if (buyer.role !== "buyer") {
      return res.status(400).json({ success: false, error: "Only normal buyer accounts can create marketplace requests" });
    }
    const unitPrice = Number(pricePerUnit) || (orderType === "sell-egg" ? dealer.eggBuyRate || 12 : dealer.henSellPrice || DEFAULT_HEN_PRICE);
    const totalAmount = qty * unitPrice;
    if (orderType === "buy-hen" && dealer.availableHens < qty) {
      return res.status(400).json({ success: false, error: "Dealer does not have enough hens available" });
    }
    if (orderType === "sell-egg" && buyer.availableEggs < qty) {
      return res.status(400).json({ success: false, error: "You do not have enough eggs to sell" });
    }
    const responseMinutes = dealer.dealerResponseMinutes || 30;
    const order = new Order_default({
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
      paymentMethod: ["easypaisa", "jazzcash", "bank", "wallet"].includes(paymentMethod) ? paymentMethod : "easypaisa",
      paymentAccount: dealer.easyPaisaAccount || dealer.jazzCashAccount || dealer.bankAccountNumber || "",
      buyerPaymentAccount: orderType === "sell-egg" ? receiverAccount || buyer.easyPaisaAccount || buyer.jazzCashAccount || buyer.bankAccountNumber || "" : "",
      paymentProof,
      paymentProofUploaded: Boolean(paymentProof),
      whatsappNumber: dealer.whatsappNumber || dealer.phone,
      buyerNotes,
      status: "pending",
      expiresAt: new Date(Date.now() + responseMinutes * 60 * 1e3)
    });
    await order.save();
    return res.json({
      success: true,
      message: "Request created successfully",
      order: await hydrateOrder(order),
      expiresInMinutes: responseMinutes,
      sellerPaymentDetails: makeParty(dealer)
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create request" });
  }
});
router4.get("/my-hens/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: "You can only view your own hens" });
    }
    const holdings = await HenHolding_default.find({
      userId,
      retired: false,
      expiresAt: { $gt: /* @__PURE__ */ new Date() }
    }).sort({ purchasedAt: -1 });
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1e3;
    let totalHens = 0;
    let layingHens = 0;
    let incubatingHens = 0;
    const items = holdings.map((h) => {
      const layingStartsAt = h.layingStartsAt.getTime();
      const expiresAt = h.expiresAt.getTime();
      const status = now < layingStartsAt ? "incubating" : "laying";
      const daysRemaining = Math.ceil((status === "incubating" ? layingStartsAt - now : expiresAt - now) / DAY);
      if (status === "incubating") {
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
        daysRemaining
      };
    });
    return res.json({
      success: true,
      holdings: items,
      summary: { totalHens, layingHens, incubatingHens, eggsPerDay: layingHens }
    });
  } catch (error) {
    console.error("Get my hens error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load hens" });
  }
});
router4.get("/referral-activity/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: "You can only view your own activity" });
    }
    const [activity, totalAgg] = await Promise.all([
      Transaction_default.find({ userId }).sort({ createdAt: -1 }).limit(100),
      Transaction_default.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ])
    ]);
    const totalEarned = totalAgg[0]?.total || 0;
    return res.json({ success: true, activity, totalEarned });
  } catch (error) {
    console.error("Get referral activity error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load referral activity" });
  }
});
router4.get("/my-orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, error: "You can only view your own orders" });
    }
    await Order_default.updateMany(
      { status: "pending", expiresAt: { $lt: /* @__PURE__ */ new Date() }, paymentProofUploaded: { $ne: true } },
      { status: "expired", rejectionReason: "Dealer response time expired" }
    );
    const buyOrdersRaw = await Order_default.find({ buyerId: userId }).sort({ createdAt: -1 });
    const sellOrdersRaw = await Order_default.find({ sellerId: userId }).sort({ createdAt: -1 });
    const [buyOrders, sellOrders] = await Promise.all([
      Promise.all(buyOrdersRaw.map(hydrateOrder)),
      Promise.all(sellOrdersRaw.map(hydrateOrder))
    ]);
    return res.json({ success: true, buyOrders, sellOrders });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load orders" });
  }
});
router4.get("/pending-approvals/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (req.userId !== sellerId) {
      return res.status(403).json({ success: false, error: "You can only view your own pending approvals" });
    }
    await Order_default.updateMany(
      { sellerId, status: "pending", expiresAt: { $lt: /* @__PURE__ */ new Date() }, paymentProofUploaded: { $ne: true } },
      { status: "expired", rejectionReason: "Dealer response time expired" }
    );
    const pendingOrdersRaw = await Order_default.find({ sellerId, status: "pending" }).sort({ createdAt: -1 });
    const pendingOrders = await Promise.all(pendingOrdersRaw.map(hydrateOrder));
    return res.json({ success: true, pendingOrders });
  } catch (error) {
    console.error("Get pending orders error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to load pending requests" });
  }
});
router4.post("/approve/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order_default.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }
    if (order.sellerId !== req.userId) {
      return res.status(403).json({ success: false, error: "Only assigned dealer can approve this request" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, error: "Request is not pending" });
    }
    if (order.expiresAt < /* @__PURE__ */ new Date() && !order.paymentProofUploaded) {
      order.status = "expired";
      order.rejectionReason = "Dealer response time expired";
      await order.save();
      return res.status(400).json({ success: false, error: "Request expired" });
    }
    const [buyer, dealer] = await Promise.all([
      User_default.findById(order.buyerId),
      User_default.findById(order.sellerId)
    ]);
    if (!buyer || !dealer || !isSeller(dealer)) {
      return res.status(404).json({ success: false, error: "User or dealer not found" });
    }
    if (order.orderType === "buy-hen") {
      if (dealer.availableHens < order.quantity) {
        return res.status(400).json({ success: false, error: "Dealer no longer has enough hens" });
      }
      dealer.availableHens -= order.quantity;
      buyer.hensOwned += order.quantity;
      await Promise.all([buyer.save(), dealer.save()]);
      const purchasedAt = /* @__PURE__ */ new Date();
      const layingStartsAt = new Date(purchasedAt.getTime() + INCUBATION_DAYS * 24 * 60 * 60 * 1e3);
      await new HenHolding_default({
        userId: buyer._id.toString(),
        orderId: order._id.toString(),
        quantity: order.quantity,
        purchasedAt,
        layingStartsAt,
        // 65 full days of laying starting day 1 (no incubation wait)
        expiresAt: new Date(layingStartsAt.getTime() + PRODUCTIVE_DAYS * 24 * 60 * 60 * 1e3)
      }).save();
      await applyReferralRewardsOnFirstOrder(buyer, order);
    } else if (order.orderType === "sell-egg") {
      if (buyer.availableEggs < order.quantity) {
        return res.status(400).json({ success: false, error: "Seller no longer has enough eggs" });
      }
      buyer.availableEggs -= order.quantity;
      dealer.availableEggs += order.quantity;
      await Promise.all([buyer.save(), dealer.save()]);
    }
    order.status = "approved";
    order.approvedAt = /* @__PURE__ */ new Date();
    order.completedAt = /* @__PURE__ */ new Date();
    await order.save();
    return res.json({ success: true, message: "Request approved successfully", order: await hydrateOrder(order) });
  } catch (error) {
    console.error("Approve order error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to approve request" });
  }
});
router4.post("/reject/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rejectionReason } = req.body;
    const order = await Order_default.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }
    if (order.sellerId !== req.userId) {
      return res.status(403).json({ success: false, error: "Only assigned dealer can reject this request" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, error: "Request is not pending" });
    }
    order.status = "rejected";
    order.rejectionReason = rejectionReason || "Dealer rejected the request";
    await order.save();
    return res.json({ success: true, message: "Request rejected", order: await hydrateOrder(order) });
  } catch (error) {
    console.error("Reject order error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to reject request" });
  }
});
var orders_default = router4;

// src/routes/admin.ts
import { Router as Router3 } from "express";
var router5 = Router3();
function sanitizeUser2(user) {
  const plain = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plain.password;
  return plain;
}
router5.use(requireAuth, requireAdminRole);
router5.get("/me", async (req, res) => {
  const admin = await User_default.findById(req.userId);
  if (!admin) {
    return res.status(404).json({ success: false, error: "Admin account not found" });
  }
  return res.json({ success: true, admin: sanitizeUser2(admin) });
});
router5.get("/stats", async (_req, res) => {
  try {
    const [users, sellers, buyers, orders, pendingOrders, completedOrders] = await Promise.all([
      User_default.countDocuments({}),
      User_default.countDocuments({ role: "seller" }),
      User_default.countDocuments({ role: "buyer" }),
      Order_default.countDocuments({}),
      Order_default.countDocuments({ status: "pending" }),
      Order_default.countDocuments({ status: "approved" })
    ]);
    return res.json({
      success: true,
      stats: {
        users,
        sellers,
        buyers,
        orders,
        pendingOrders,
        completedOrders
      }
    });
  } catch (error) {
    logger.error({ error }, "Admin stats error");
    return res.status(500).json({ success: false, error: "Failed to load stats" });
  }
});
router5.get("/sellers", async (_req, res) => {
  try {
    const sellers = await User_default.find({ role: "seller" }).sort({ createdAt: -1 });
    return res.json({ success: true, sellers: sellers.map(sanitizeUser2) });
  } catch (error) {
    logger.error({ error }, "Admin list sellers error");
    return res.status(500).json({ success: false, error: "Failed to load sellers" });
  }
});
router5.post("/sellers", async (req, res) => {
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
      rating
    } = req.body;
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, phone, email and password are required" });
    }
    const existing = await User_default.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }
    const seller = new User_default({
      name,
      phone,
      email,
      password,
      role: "seller",
      referralCode: `SEL${phone.replace(/\D/g, "").slice(-6)}${Math.floor(Math.random() * 900 + 100)}`,
      location: location || "",
      availableHens: Number(availableHens) || 0,
      henSellPrice: Number(henSellPrice) || 900,
      availableEggs: 0,
      eggBuyRate: Number(eggBuyRate) || 12,
      dealerResponseMinutes: Number(dealerResponseMinutes) || 30,
      easyPaisaAccount: easyPaisaAccount || "",
      jazzCashAccount: jazzCashAccount || "",
      bankName: bankName || "",
      bankAccountNumber: bankAccountNumber || "",
      bankAccountTitle: bankAccountTitle || "",
      whatsappNumber: whatsappNumber || phone,
      verified: Boolean(verified),
      rating: Number(rating) || 0
    });
    await seller.save();
    logger.info({ sellerId: seller._id }, "Seller created by admin");
    return res.json({ success: true, seller: sanitizeUser2(seller) });
  } catch (error) {
    logger.error({ error }, "Admin create seller error");
    return res.status(500).json({ success: false, error: "Failed to create seller" });
  }
});
router5.patch("/sellers/:id", async (req, res) => {
  try {
    const seller = await User_default.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, error: "Seller not found" });
    }
    if (seller.role !== "seller") {
      return res.status(400).json({ success: false, error: "Account is not a seller" });
    }
    const allowed = [
      "name",
      "phone",
      "email",
      "location",
      "availableHens",
      "henSellPrice",
      "availableEggs",
      "eggBuyRate",
      "dealerResponseMinutes",
      "easyPaisaAccount",
      "jazzCashAccount",
      "bankName",
      "bankAccountNumber",
      "bankAccountTitle",
      "whatsappNumber",
      "verified",
      "rating"
    ];
    const numericKeys = ["availableHens", "henSellPrice", "availableEggs", "eggBuyRate", "dealerResponseMinutes", "rating"];
    for (const key of allowed) {
      if (req.body[key] !== void 0) {
        seller[key] = typeof req.body[key] === "string" && numericKeys.includes(key) ? Number(req.body[key]) : req.body[key];
      }
    }
    await seller.save();
    return res.json({ success: true, seller: sanitizeUser2(seller) });
  } catch (error) {
    logger.error({ error }, "Admin update seller error");
    return res.status(500).json({ success: false, error: "Failed to update seller" });
  }
});
router5.get("/users", async (_req, res) => {
  try {
    const users = await User_default.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, users: users.map(sanitizeUser2) });
  } catch (error) {
    logger.error({ error }, "Admin list users error");
    return res.status(500).json({ success: false, error: "Failed to load users" });
  }
});
router5.get("/orders", async (_req, res) => {
  try {
    const orders = await Order_default.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    logger.error({ error }, "Admin list orders error");
    return res.status(500).json({ success: false, error: "Failed to load orders" });
  }
});
var admin_default = router5;

// src/routes/cron.ts
import { Router as Router4 } from "express";

// src/jobs/daily-eggs.ts
var getYieldIntervalMs = () => (Number(process.env.EGG_YIELD_INTERVAL_SEC) || 86400) * 1e3;
var getCheckIntervalMs = () => (Number(process.env.EGG_CHECK_INTERVAL_SEC) || 3600) * 1e3;
async function processDailyEggs() {
  const now = /* @__PURE__ */ new Date();
  try {
    const layingHoldings = await HenHolding_default.find({
      retired: false,
      layingStartsAt: { $lte: now },
      expiresAt: { $gt: now }
    });
    const yieldIntervalMs = getYieldIntervalMs();
    const isCustomShortInterval = yieldIntervalMs < 24 * 60 * 60 * 1e3;
    const today = now.toISOString().split("T")[0];
    let credited = 0;
    for (const holding of layingHoldings) {
      if (isCustomShortInterval) {
        const lastCreditTime = holding.lastEggCreditDate ? holding.lastEggCreditDate.getTime() : 0;
        if (now.getTime() - lastCreditTime < yieldIntervalMs) continue;
      } else {
        const lastCreditDate = holding.lastEggCreditDate ? holding.lastEggCreditDate.toISOString().split("T")[0] : null;
        if (lastCreditDate === today) continue;
      }
      await User_default.updateOne({ _id: holding.userId }, { $inc: { availableEggs: holding.quantity } });
      holding.lastEggCreditDate = now;
      await holding.save();
      await new Transaction_default({
        userId: holding.userId,
        type: "hen-egg-yield",
        quantity: holding.quantity,
        description: `${holding.quantity} egg${holding.quantity > 1 ? "s" : ""} credited - daily yield from your hens`,
        metadata: { holdingId: holding._id }
      }).save();
      credited++;
    }
    if (credited > 0) {
      logger.info({ credited }, "Daily egg yield credited");
    }
  } catch (error) {
    logger.error({ error }, "Daily egg yield processing failed");
  }
  try {
    const expiredHoldings = await HenHolding_default.find({
      retired: false,
      expiresAt: { $lte: now }
    });
    for (const holding of expiredHoldings) {
      holding.retired = true;
      await holding.save();
      await User_default.updateOne(
        { _id: holding.userId },
        { $inc: { hensOwned: -holding.quantity } }
      );
      logger.info({ userId: holding.userId, quantity: holding.quantity }, "Hen batch retired after 65-day productive life");
    }
  } catch (error) {
    logger.error({ error }, "Hen retirement processing failed");
  }
}
function startDailyEggsJob() {
  const checkInterval = getCheckIntervalMs();
  logger.info({
    yieldIntervalMs: getYieldIntervalMs(),
    checkIntervalMs: checkInterval
  }, "Daily egg yield job scheduler started");
  processDailyEggs();
  setInterval(processDailyEggs, checkInterval);
}

// src/routes/cron.ts
var router6 = Router4();
router6.get("/daily-eggs", async (req, res) => {
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
var cron_default = router6;

// src/routes/index.ts
var router7 = Router5();
router7.use(health_default);
router7.use("/auth", auth_default);
router7.use("/marketplace", marketplace_default);
router7.use("/orders", orders_default);
router7.use("/admin", admin_default);
router7.use("/cron", cron_default);
var routes_default = router7;

// src/app.ts
var pinoHttp = pinoHttpImport;
var app = express3();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
app.use(cors());
app.use(express3.json());
app.use(express3.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  const isProduction3 = process.env.NODE_ENV === "production";
  if (isProduction3) {
    try {
      await connectDB();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        error: `Database connection failed: ${message}. Make sure MONGODB_URI is set correctly in Vercel environment variables and your database network settings whitelist Vercel IPs (0.0.0.0/0).`
      });
    }
  }
  next();
});
app.use("/api", routes_default);
app.get("/", (_req, res) => {
  res.json({ message: "HenFarm API - see /api/healthz" });
});
var app_default = app;

// src/index.ts
try {
  const envPath = resolve(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
  console.log("[env] Loaded .env \u2014 MONGODB_URI set:", !!process.env.MONGODB_URI);
} catch (err) {
  console.warn("[env] No .env file found \u2014 using system environment variables");
}
connectDB2().catch((err) => {
  logger.error({ err }, "Initial MongoDB connection attempt failed");
});
startDailyEggsJob();
var rawPort = process.env["PORT"] || "3000";
var port = Number(rawPort);
logger.info({ rawPort, port, cwd: process.cwd() }, "About to start server");
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}
var server = app_default.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening on 0.0.0.0");
});
server.on("error", (err) => {
  logger.error({ err }, "Error starting server");
  process.exit(1);
});
server.on("listening", () => {
  const addr = server.address();
  logger.info({ addr }, "Server bound to address");
});
//# sourceMappingURL=index.mjs.map
