// Creates the platform admin account.
// Usage: node create-admin.mjs
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shanmaqbool33_db_user:VicgUI67cdOTq8SE@formhen.47vpwct.mongodb.net/henform';

const name = process.env.ADMIN_NAME || 'Admin';
const email = process.env.ADMIN_EMAIL || 'admin@henfarm.com';
const phone = process.env.ADMIN_PHONE || '03000000000';
const password = process.env.ADMIN_PASSWORD || 'Admin@1234';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
});

const existing = await User.findOne({ $or: [{ email }, { phone }] });
if (existing) {
  existing.role = 'admin';
  await existing.save();
  console.log('✅ Existing user promoted to admin:', existing._id);
  console.log('Email:', existing.email, '| Password:', existing.password);
} else {
  const admin = await User.create({
    name,
    email,
    phone,
    password,
    role: 'admin',
    referralCode: 'ADMIN001',
    location: 'Pakistan',
    rating: 0,
    verified: true,
    availableHens: 0,
    availableEggs: 0,
    eggBuyRate: 0,
    balance: 0,
    totalInvested: 0,
    lifetimeEarnings: 0,
    referralEarnings: 0,
    totalReferrals: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✅ Admin created:', admin._id);
  console.log('Email:', email, '| Password:', password);
}

await mongoose.disconnect();
