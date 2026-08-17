// Drops every collection in the target database. Irreversible.
// Usage: node wipe-database.mjs
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';

try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  });
} catch {
  // fall through to system env
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const dbNameMatch = MONGODB_URI.match(/\.net\/([^?]+)/);
console.log(`About to drop ALL collections in database: ${dbNameMatch ? dbNameMatch[1] : '(unknown)'}`);

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

const collections = await mongoose.connection.db.listCollections().toArray();
if (collections.length === 0) {
  console.log('No collections found - database is already empty.');
} else {
  for (const { name } of collections) {
    await mongoose.connection.db.dropCollection(name);
    console.log(`Dropped: ${name}`);
  }
  console.log(`Done - dropped ${collections.length} collection(s).`);
}

await mongoose.disconnect();
