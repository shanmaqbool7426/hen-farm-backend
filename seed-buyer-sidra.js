import mongoose from 'mongoose';
import dns from 'dns';
import crypto from 'crypto';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
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

const sidraBuyerData = {
  name: 'Sidra',
  email: 'sidra@gmail.com',
  phone: '03007654321',
  password: hashPassword('Shan7426@'),
  role: 'buyer',
  referralCode: 'SIDRA001',
  location: 'Lahore, Pakistan',
  whatsappNumber: '+923007654321',
};

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    let user = await User.findOne({ email: 'sidra@gmail.com' });
    if (user) {
      Object.assign(user, sidraBuyerData);
      await user.save();
      console.log(`✅ Updated existing user to Sidra (Buyer)! ID: ${user._id}`);
    } else {
      user = new User(sidraBuyerData);
      await user.save();
      console.log(`✅ Created new Buyer Sidra! ID: ${user._id}`);
    }

    console.log('\nBuyer details:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: Shan7426@`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Role: ${user.role}`);
    console.log(`ID: ${user._id}`);

  } catch (error) {
    console.error('Error adding buyer:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
