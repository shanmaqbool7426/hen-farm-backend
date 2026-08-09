// One-time migration: hash any plain-text passwords in the DB.
// Usage: node hash-passwords.mjs
import mongoose from 'mongoose';
import { randomBytes, scryptSync } from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shanmaqbool33_db_user:VicgUI67cdOTq8SE@formhen.47vpwct.mongodb.net/henform';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000, socketTimeoutMS: 45000 });
  console.log('MongoDB connected');

  const users = await User.find({});
  let updated = 0;
  for (const u of users) {
    const pwd = u.password;
    if (!pwd) continue;
    if (pwd.includes(':')) continue;
    u.password = hashPassword(pwd);
    await u.save();
    updated++;
    console.log(`Hashed password for: ${u.email || u._id}`);
  }
  console.log(`Done. Hashed ${updated} users.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
