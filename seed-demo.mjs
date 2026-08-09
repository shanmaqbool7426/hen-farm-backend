// Seeds test data: 10 verified sellers + 10 buyers (idempotent - skips existing).
// Usage: node seed-demo.mjs
import mongoose from 'mongoose';
import dns from 'dns';
import { randomBytes, scryptSync } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Same DNS override as src/db/mongoose.ts - prevents querySrv ECONNREFUSED
// on Windows machines whose ISP DNS doesn't resolve Atlas SRV records.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback if DNS override fails
}

// Load .env the same way src/index.ts does, so this works with a plain `node seed-demo.mjs`.
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !process.env[key]) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch {
  // no .env file - fall through to relying on real environment variables
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (checked .env and environment variables).');
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const SELLERS = [
  { name: 'Rana Poultry Farm', phone: '03011122331', email: 'seller1@henfarm.com', location: 'Faisalabad', availableHens: 250, henSellPrice: 900, eggBuyRate: 12, rating: 4.8, bankName: 'Meezan Bank', bankAccountNumber: '0100-1234567' },
  { name: 'Multan Layer Hub', phone: '03022233442', email: 'seller2@henfarm.com', location: 'Multan', availableHens: 500, henSellPrice: 880, eggBuyRate: 12, rating: 4.7, bankName: 'HBL', bankAccountNumber: '0452-7654321' },
  { name: 'Sargodha Poultry Hub', phone: '03033344553', email: 'seller3@henfarm.com', location: 'Sargodha', availableHens: 150, henSellPrice: 920, eggBuyRate: 11, rating: 4.5, bankName: 'UBL', bankAccountNumber: '0451-3333333' },
  { name: 'Kasur Bio-Secure Farms', phone: '03044455664', email: 'seller4@henfarm.com', location: 'Kasur', availableHens: 300, henSellPrice: 900, eggBuyRate: 12, rating: 4.9, bankName: 'Askari Bank', bankAccountNumber: '0701-1112223' },
  { name: 'Gujranwala Avian Supply', phone: '03055566775', email: 'seller5@henfarm.com', location: 'Gujranwala', availableHens: 400, henSellPrice: 870, eggBuyRate: 13, rating: 4.6, bankName: 'MCB', bankAccountNumber: '0453-5555666' },
  { name: 'Sialkot Egg & Hen Co.', phone: '03066677886', email: 'seller6@henfarm.com', location: 'Sialkot', availableHens: 220, henSellPrice: 910, eggBuyRate: 12, rating: 4.4, bankName: 'Bank Alfalah', bankAccountNumber: '0102-9988776' },
  { name: 'Sheikhupura Layer Farms', phone: '03077788997', email: 'seller7@henfarm.com', location: 'Sheikhupura', availableHens: 180, henSellPrice: 895, eggBuyRate: 11, rating: 4.3, bankName: 'Faysal Bank', bankAccountNumber: '0203-4455667' },
  { name: 'Okara Poultry Traders', phone: '03088899008', email: 'seller8@henfarm.com', location: 'Okara', availableHens: 350, henSellPrice: 900, eggBuyRate: 12, rating: 4.7, bankName: 'Bank Islami', bankAccountNumber: '0304-1122334' },
  { name: 'Sahiwal Bio Farms', phone: '03099900119', email: 'seller9@henfarm.com', location: 'Sahiwal', availableHens: 275, henSellPrice: 885, eggBuyRate: 13, rating: 4.6, bankName: 'Allied Bank', bankAccountNumber: '0405-2233445' },
  { name: 'Jhang Commercial Layers', phone: '03010011220', email: 'seller10@henfarm.com', location: 'Jhang', availableHens: 320, henSellPrice: 900, eggBuyRate: 12, rating: 4.5, bankName: 'Bank of Punjab', bankAccountNumber: '0506-3344556' },
];

const BUYERS = [
  { name: 'Imran Ahmed', phone: '03067777886', email: 'buyer1@henfarm.com', location: 'Lahore' },
  { name: 'Ayesha Khan', phone: '03078888997', email: 'buyer2@henfarm.com', location: 'Karachi' },
  { name: 'Bilal Hussain', phone: '03089999008', email: 'buyer3@henfarm.com', location: 'Islamabad' },
  { name: 'Zainab Malik', phone: '03090000119', email: 'buyer4@henfarm.com', location: 'Rawalpindi' },
  { name: 'Usman Tariq', phone: '03001112233', email: 'buyer5@henfarm.com', location: 'Faisalabad' },
  { name: 'Mariam Yousuf', phone: '03012223344', email: 'buyer6@henfarm.com', location: 'Multan' },
  { name: 'Hamza Sheikh', phone: '03023334455', email: 'buyer7@henfarm.com', location: 'Peshawar' },
  { name: 'Fatima Siddiqui', phone: '03034445566', email: 'buyer8@henfarm.com', location: 'Quetta' },
  { name: 'Abdullah Raza', phone: '03045556677', email: 'buyer9@henfarm.com', location: 'Sialkot' },
  { name: 'Khadija Farooq', phone: '03056667788', email: 'buyer10@henfarm.com', location: 'Gujranwala' },
];

const SELLER_PASSWORD = 'Seller@1234';
const BUYER_PASSWORD = 'Buyer@1234';

async function main() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected');

  for (const s of SELLERS) {
    const existing = await User.findOne({ $or: [{ email: s.email }, { phone: s.phone }] });
    if (existing) {
      console.log('Seller exists, skipping:', s.email);
      continue;
    }
    await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: hashPassword(SELLER_PASSWORD),
      role: 'seller',
      referralCode: `SEL${s.phone.slice(-6)}${Math.floor(Math.random() * 900 + 100)}`,
      location: s.location,
      rating: s.rating,
      verified: true,
      availableHens: s.availableHens,
      henSellPrice: s.henSellPrice,
      hensOwned: 0,
      availableEggs: 0,
      eggBuyRate: s.eggBuyRate,
      dealerResponseMinutes: 30,
      easyPaisaAccount: s.phone,
      jazzCashAccount: s.phone,
      bankName: s.bankName,
      bankAccountNumber: s.bankAccountNumber,
      bankAccountTitle: s.name,
      whatsappNumber: s.phone,
      referralFirstOrderDiscountUsed: false,
      completedReferralCount: 0,
    });
    console.log('Seller created:', s.email, '| password:', SELLER_PASSWORD, '| hens:', s.availableHens);
  }

  for (const b of BUYERS) {
    const existing = await User.findOne({ $or: [{ email: b.email }, { phone: b.phone }] });
    if (existing) {
      console.log('Buyer exists, skipping:', b.email);
      continue;
    }
    await User.create({
      name: b.name,
      email: b.email,
      phone: b.phone,
      password: hashPassword(BUYER_PASSWORD),
      role: 'buyer',
      referralCode: `HF${b.phone.slice(-6)}`,
      location: b.location,
      rating: 0,
      verified: false,
      availableHens: 0,
      henSellPrice: 900,
      hensOwned: 0,
      availableEggs: 0,
      eggBuyRate: 12,
      dealerResponseMinutes: 30,
      whatsappNumber: b.phone,
      easyPaisaAccount: b.phone,
      jazzCashAccount: b.phone,
      referralFirstOrderDiscountUsed: false,
      completedReferralCount: 0,
    });
    console.log('Buyer created:', b.email, '| password:', BUYER_PASSWORD);
  }

  const count = await User.countDocuments({});
  console.log('Total users now:', count);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
