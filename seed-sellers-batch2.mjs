// Creates 5 more demo sellers (second batch).
// Usage: node seed-sellers-batch2.mjs
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { randomBytes, scryptSync } from 'crypto';

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
  console.error('MONGODB_URI is not set. Load your .env or export it before running this script.');
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const sellers = [
  { name: 'Rawalpindi Poultry Co.', email: 'rawalpindi.poultry@henfarm.test', phone: '03001234506', password: 'Seller6@26', referralCode: 'SEL006', availableHens: 4700, henSellPrice: 890 },
  { name: 'Faisalabad Layer House', email: 'faisalabad.layers@henfarm.test', phone: '03001234507', password: 'Seller7@26', referralCode: 'SEL007', availableHens: 3900, henSellPrice: 900 },
  { name: 'Sargodha Hen Farm', email: 'sargodha.farm@henfarm.test', phone: '03001234508', password: 'Seller8@26', referralCode: 'SEL008', availableHens: 5200, henSellPrice: 915 },
  { name: 'Sheikhupura Poultry Traders', email: 'sheikhupura.traders@henfarm.test', phone: '03001234509', password: 'Seller9@26', referralCode: 'SEL009', availableHens: 3100, henSellPrice: 885 },
  { name: 'Okara Farm & Supply', email: 'okara.supply@henfarm.test', phone: '03001234510', password: 'Seller10@26', referralCode: 'SEL010', availableHens: 4400, henSellPrice: 900 },
].map((s) => ({
  ...s,
  role: 'seller',
  location: 'Pakistan',
  rating: 4.6,
  verified: true,
  hensOwned: s.availableHens,
  availableEggs: 500,
  eggBuyRate: 28,
  dealerResponseMinutes: 20,
  easyPaisaAccount: s.phone,
  jazzCashAccount: s.phone,
  whatsappNumber: `+92${s.phone.slice(1)}`,
}));

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
console.log('MongoDB connected.');

const results = [];
for (const person of sellers) {
  const { password, ...rest } = person;
  const existing = await User.findOne({ $or: [{ email: rest.email }, { phone: rest.phone }] });
  if (existing) {
    console.log(`Skipped (already exists): ${rest.email}`);
    results.push({ ...rest, password: '(already existed - password unchanged)' });
    continue;
  }
  await User.create({
    ...rest,
    password: hashPassword(password),
    referralFirstOrderDiscountUsed: false,
    completedReferralCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`Created seller: ${rest.email}`);
  results.push({ ...rest, password });
}

console.log('\n=== Credentials ===');
for (const r of results) {
  console.log(`${r.name.padEnd(28)} | ${r.email.padEnd(32)} | ${r.password}`);
}

await mongoose.disconnect();
