import type { IncomingMessage, ServerResponse } from 'node:http';
import app, { connectDB } from '../src/app';

// Vercel serverless entry point. Unlike the traditional server (src/index.ts,
// used for local dev via `node --enable-source-maps ./dist/index.mjs`), this
// never calls app.listen() - Vercel's Node runtime invokes this handler
// directly per request. connectDB() is safe to call on every invocation
// (see db/mongoose.ts - it's a no-op once already connected).
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await connectDB();
  app(req, res);
}
