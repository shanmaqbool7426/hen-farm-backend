// ⚠️ IMPORTANT: Load .env FIRST before any other imports that use env vars
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return; // skip empty lines and comments
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
  console.log('[env] Loaded .env — MONGODB_URI set:', !!process.env.MONGODB_URI);
} catch (err) {
  console.warn('[env] No .env file found — using system environment variables');
}

// Now safe to import app and db utilities
import app, { connectDB, startDailyEggsJob } from "./app";
import { logger } from "./lib/logger";

// Connect to MongoDB using process.env.MONGODB_URI
connectDB().catch((err) => {
  logger.error({ err }, "Initial MongoDB connection attempt failed");
});

// Start daily eggs job
startDailyEggsJob();

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

logger.info({ rawPort, port, cwd: process.cwd() }, "About to start server");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, '0.0.0.0', () => {
  logger.info({ port }, "Server listening on 0.0.0.0");
});

server.on('error', (err) => {
  logger.error({ err }, "Error starting server");
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  logger.info({ addr }, "Server bound to address");
});
