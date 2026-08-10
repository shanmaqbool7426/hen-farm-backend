import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from '../lib/logger';

// Set public DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED
// on Windows ISP DNS when resolving `mongodb+srv://` SRV records. The MongoDB
// Node driver resolves SRV/TXT records via the global `dns` module directly
// (it doesn't accept a custom resolver instance), so this has to be a process-
// wide override rather than something scoped to just this connection.
// Windows-only: cloud platforms (Vercel, Railway, etc.) run Linux and don't
// have this ISP-DNS problem - forcing custom DNS servers there risks the
// opposite failure, since sandboxed network environments often block outbound
// queries to arbitrary DNS servers, which hangs SRV resolution indefinitely.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    logger.warn({ error: e }, 'Failed to override DNS servers - SRV lookups may fail on some networks');
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const RETRY_DELAYS_MS = [2000, 5000, 10000];

// Serverless functions (Vercel) reuse a warm process across invocations, so
// connectDB() gets called on every request - this must never open a second
// connection on top of an already-live or in-progress one.
let connectPromise: Promise<void> | null = null;

// Exported so /api/dbstatus can report real state instead of only
// mongoose.connection.readyState, which can't distinguish "never configured"
// from "configured but every retry failed".
let usingInMemoryFallback = false;
let lastConnectionError: string | null = null;

export function getDbFallbackStatus() {
  return { usingInMemoryFallback, lastConnectionError };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptConnect(uri: string): Promise<void> {
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info('✅ MongoDB Connected Successfully!');
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
        logger.error({ attempt, error: message }, 'MongoDB connection failed after all retry attempts');
        throw error;
      }
    }
  }
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (connectPromise) return connectPromise; // a connection attempt is already in flight

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    lastConnectionError = 'MONGODB_URI not set in environment';
    usingInMemoryFallback = true;
    if (isProduction) {
      const errMsg = 'MONGODB_URI not set in environment - production requires a real database';
      logger.error(errMsg);
      throw new Error(errMsg);
    }
    logger.warn('MONGODB_URI not set in environment - running with in-memory fallback (dev only)');
    return;
  }

  connectPromise = attemptConnect(MONGODB_URI)
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      lastConnectionError = message;
      if (isProduction) {
        logger.error({ error: message }, '❌ MongoDB connection failed after all retries - production requires a real database');
        throw error;
      }
      usingInMemoryFallback = true;
      logger.warn({ error: message }, '⚠️  MongoDB connection failed after all retries - continuing with IN-MEMORY data (dev only, nothing will persist)');
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

mongoose.connection.on('disconnected', () => {
  usingInMemoryFallback = true;
  logger.warn('MongoDB Disconnected');
});

mongoose.connection.on('reconnected', () => {
  usingInMemoryFallback = false;
  lastConnectionError = null;
  logger.info('MongoDB Reconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error({ error }, 'MongoDB Error');
});
