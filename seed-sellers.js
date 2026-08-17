import mongoose from 'mongoose';
import dns from 'dns';
import crypto from 'crypto';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Load your .env or export it before running this script.');
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String },
  referralFirstOrderDiscountUsed: { type: Boolean, default: false },
  completedReferralCount: { type: Number, default: 0 },
  location: { type: String, default: '' },
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
  dealerResponseMinutes: { type: Number, default: 30 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const sellersToSeed = [
  // 1. VERIFIED - 03069829158 - Full Rating 5.0 - 1000+ Hens - Egg Rate Rs 28
  {
    name: 'Tariq Mahmood Poultry Farm',
    email: 'tariq.poultry@henfarm.pk',
    phone: '03069829158',
    password: hashPassword('Seller1234@'),
    role: 'seller',
    referralCode: 'HF030698',
    location: 'Faisalabad, Punjab',
    rating: 5.0,
    verified: true,
    availableHens: 1250,
    henSellPrice: 900,
    eggBuyRate: 28,
    easyPaisaAccount: '03069829158',
    jazzCashAccount: '03069829158',
    bankName: 'Meezan Bank',
    bankAccountNumber: '01020304050607',
    bankAccountTitle: 'Tariq Mahmood',
    whatsappNumber: '03069829158',
    dealerResponseMinutes: 15,
  },

  // 2. VERIFIED - 03047711033 - Full Rating 5.0 - 1000+ Hens - Egg Rate Rs 30
  {
    name: 'Chaudhry Bilal Layers & Farm',
    email: 'bilal.farms@henfarm.pk',
    phone: '03047711033',
    password: hashPassword('Seller1234@'),
    role: 'seller',
    referralCode: 'HF030477',
    location: 'Sargodha, Punjab',
    rating: 5.0,
    verified: true,
    availableHens: 1500,
    henSellPrice: 900,
    eggBuyRate: 30,
    easyPaisaAccount: '03047711033',
    jazzCashAccount: '03047711033',
    bankName: 'Habib Bank Limited',
    bankAccountNumber: '99887766554433',
    bankAccountTitle: 'Chaudhry Bilal',
    whatsappNumber: '03047711033',
    dealerResponseMinutes: 20,
  },
  // 3. UNVERIFIED - Egg Rate Rs 26
  {
    name: 'Muhammad Usman Ghani',
    email: 'usman.ghani@henfarm.pk',
    phone: '03015544221',
    password: hashPassword('Seller1234@'),
    role: 'seller',
    referralCode: 'HF030155',
    location: 'Multan, Punjab',
    rating: 0,
    verified: false,
    availableHens: 450,
    henSellPrice: 920,
    eggBuyRate: 26,
    easyPaisaAccount: '03015544221',
    whatsappNumber: '03015544221',
    dealerResponseMinutes: 30,
  },
  // 4. UNVERIFIED - Egg Rate Rs 27
  {
    name: 'Hafiz Hamza Ali Farm',
    email: 'hamza.ali@henfarm.pk',
    phone: '03126677889',
    password: hashPassword('Seller1234@'),
    role: 'seller',
    referralCode: 'HF031266',
    location: 'Rawalpindi, Punjab',
    rating: 0,
    verified: false,
    availableHens: 600,
    henSellPrice: 910,
    eggBuyRate: 27,
    jazzCashAccount: '03126677889',
    whatsappNumber: '03126677889',
    dealerResponseMinutes: 45,
  },
  // 5. UNVERIFIED - Egg Rate Rs 25
  {
    name: 'Syed Rashid Mehmood',
    email: 'rashid.mehmood@henfarm.pk',
    phone: '03219988776',
    password: hashPassword('Seller1234@'),
    role: 'seller',
    referralCode: 'HF032199',
    location: 'Lahore, Punjab',
    rating: 0,
    verified: false,
    availableHens: 350,
    henSellPrice: 900,
    eggBuyRate: 25,
    easyPaisaAccount: '03219988776',
    whatsappNumber: '03219988776',
    dealerResponseMinutes: 30,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    for (const sellerData of sellersToSeed) {
      const existing = await User.findOne({ phone: sellerData.phone });
      if (existing) {
        Object.assign(existing, sellerData);
        await existing.save();
        console.log(`Updated seller: ${sellerData.name} (${sellerData.phone}) - Egg Buy Rate: Rs ${sellerData.eggBuyRate}`);
      } else {
        const seller = new User(sellerData);
        await seller.save();
        console.log(`Created seller: ${sellerData.name} (${sellerData.phone}) - Egg Buy Rate: Rs ${sellerData.eggBuyRate}`);
      }
    }

    console.log('\nAll sellers updated with egg prices in 25-30 Rs range successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
