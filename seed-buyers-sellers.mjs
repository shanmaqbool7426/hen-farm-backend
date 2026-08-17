// Creates 5 demo sellers and 5 demo buyers.
// Usage: node seed-buyers-sellers.mjs
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
  { name: 'Bilal Poultry Farm', email: 'bilal.farm@henfarm.test', phone: '03001234501', password: 'Seller1@26', referralCode: 'SEL001', availableHens: 5000, henSellPrice: 900 },
  { name: 'Fahad Layers & Sons', email: 'fahad.layers@henfarm.test', phone: '03001234502', password: 'Seller2@26', referralCode: 'SEL002', availableHens: 3800, henSellPrice: 880 },
  { name: 'Gujranwala Hen Traders', email: 'gujranwala.traders@henfarm.test', phone: '03001234503', password: 'Seller3@26', referralCode: 'SEL003', availableHens: 4200, henSellPrice: 910 },
  { name: 'Multan Egg & Hen Supply', email: 'multan.supply@henfarm.test', phone: '03001234504', password: 'Seller4@26', referralCode: 'SEL004', availableHens: 2600, henSellPrice: 895 },
  { name: 'Sialkot Farm House', email: 'sialkot.farmhouse@henfarm.test', phone: '03001234505', password: 'Seller5@26', referralCode: 'SEL005', availableHens: 3300, henSellPrice: 905 },
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

const buyers = [
  { name: 'Ahmed Raza', email: 'ahmed.raza@henfarm.test', phone: '03011234501', password: 'Buyer1@26', referralCode: 'BUY001' },
  { name: 'Sana Malik', email: 'sana.malik@henfarm.test', phone: '03011234502', password: 'Buyer2@26', referralCode: 'BUY002' },
  { name: 'Usman Tariq', email: 'usman.tariq@henfarm.test', phone: '03011234503', password: 'Buyer3@26', referralCode: 'BUY003' },
  { name: 'Ayesha Khan', email: 'ayesha.khan@henfarm.test', phone: '03011234504', password: 'Buyer4@26', referralCode: 'BUY004' },
  { name: 'Hamza Sheikh', email: 'hamza.sheikh@henfarm.test', phone: '03011234505', password: 'Buyer5@26', referralCode: 'BUY005' },
].map((b) => ({
  ...b,
  role: 'buyer',
  location: 'Pakistan',
  rating: 0,
  verified: false,
  availableHens: 0,
  hensOwned: 0,
  availableEggs: 0,
  whatsappNumber: `+92${b.phone.slice(1)}`,
}));

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

const results = [];
for (const person of [...sellers, ...buyers]) {
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
  console.log(`Created ${rest.role}: ${rest.email}`);
  results.push({ ...rest, password });
}

console.log('\n=== Credentials ===');
for (const r of results) {
  console.log(`${r.role.padEnd(6)} | ${r.name.padEnd(24)} | ${r.email.padEnd(28)} | ${r.password}`);
}

await mongoose.disconnect();
