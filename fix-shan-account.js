import mongoose from 'mongoose';
import dns from 'dns';
import crypto from 'crypto';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const usersColl = db.collection('users');
    const ordersColl = db.collection('orders');

    // 1. Delete old mock user "67890shan123456789"
    const delRes = await usersColl.deleteMany({ _id: "67890shan123456789" });
    console.log(`Deleted mock Shan users: ${delRes.deletedCount}`);

    // 2. Find real Shan seller
    const realShan = await usersColl.findOne({ phone: '03069829158' });
    if (realShan) {
      await usersColl.updateOne(
        { _id: realShan._id },
        {
          $set: {
            email: 'shanmaqbool12345@gmail.com',
            password: hashPassword('Shan7426@'),
            role: 'seller',
            verified: true,
            name: 'Shan',
            phone: '03069829158',
            easyPaisaAccount: '03069829158',
            jazzCashAccount: '03069829158',
            whatsappNumber: '+923069829158',
          }
        }
      );
      console.log(`✅ Updated Real Shan Seller! ID: ${realShan._id.toString()}`);

      // 3. Migrate any orders with sellerId string "67890shan123456789" to realShan._id
      const targetIdStr = realShan._id.toString();
      const upRes = await ordersColl.updateMany(
        { sellerId: '67890shan123456789' },
        { $set: { sellerId: targetIdStr } }
      );
      console.log(`Migrated ${upRes.modifiedCount} orders to real Shan seller ID: ${targetIdStr}`);
    } else {
      console.error('Real Shan seller not found!');
    }

  } catch (error) {
    console.error('Error fixing Shan account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
