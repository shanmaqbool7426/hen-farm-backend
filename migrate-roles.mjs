// Migrates existing users to the new role system: buyer | seller | admin.
// Usage: node migrate-roles.mjs
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shanmaqbool33_db_user:VicgUI67cdOTq8SE@formhen.47vpwct.mongodb.net/henform';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
});

// 1. Old 'dealer' role -> 'seller'
const dealerRes = await User.updateMany({ role: 'dealer' }, { $set: { role: 'seller' } });
console.log('dealer -> seller:', dealerRes.modifiedCount, 'updated');

// 2. Verified accounts with hens but no role -> seller (legacy seed accounts)
const legacySellers = await User.updateMany(
  { role: { $exists: false }, verified: true, availableHens: { $gt: 0 } },
  { $set: { role: 'seller' } },
);
console.log('legacy sellers upgraded:', legacySellers.modifiedCount);

// 3. Everything else without a role -> buyer
const defaultedBuyers = await User.updateMany(
  { role: { $exists: false } },
  { $set: { role: 'buyer' } },
);
console.log('users defaulted to buyer:', defaultedBuyers.modifiedCount);

const summary = await User.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } },
]);
console.log('Role summary:', summary);

await mongoose.disconnect();
