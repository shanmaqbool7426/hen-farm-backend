import mongoose from 'mongoose';
import dns from 'dns';
import crypto from 'crypto';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const OLD_MONGODB_URI = "mongodb+srv://auto-wheel-apps:AutoWheels123@auto-wheels.m4wrf.mongodb.net/henform";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function run() {
  try {
    console.log('Connecting to OLD MongoDB Cluster (auto-wheels)...');
    await mongoose.connect(OLD_MONGODB_URI);
    console.log('Connected successfully to old cluster!');

    const db = mongoose.connection.db;
    const usersColl = db.collection('users');
    const ordersColl = db.collection('orders');

    const users = await usersColl.find({ email: 'shanmaqbool12345@gmail.com' }).toArray();
    console.log(`Found ${users.length} Shan users in old cluster:`);
    for (const u of users) {
      console.log('Old cluster user:', u._id, u.name, u.email);
    }

    // 1. Delete mock Shan user "67890shan123456789" if present
    const del1 = await usersColl.deleteMany({ _id: '67890shan123456789' });
    console.log(`Deleted mock 67890shan123456789 count: ${del1.deletedCount}`);

    // 2. Upsert real Shan user (ObjectId 6a82d81e93a8eb0703c53004) in old cluster
    const targetId = new mongoose.Types.ObjectId("6a82d81e93a8eb0703c53004");
    await usersColl.updateOne(
      { _id: targetId },
      {
        $set: {
          name: 'Shan',
          email: 'shanmaqbool12345@gmail.com',
          phone: '03069829158',
          password: hashPassword('Shan7426@'),
          role: 'seller',
          verified: true,
          easyPaisaAccount: '03069829158',
          jazzCashAccount: '03069829158',
          whatsappNumber: '+923069829158',
          availableHens: 10000,
          henSellPrice: 900,
          eggBuyRate: 28,
        }
      },
      { upsert: true }
    );
    console.log(`✅ Upserted real Shan seller (${targetId.toString()}) in old cluster!`);

    // 3. Migrate any orders with sellerId "67890shan123456789" to targetId.toString()
    const upOrders = await ordersColl.updateMany(
      { sellerId: '67890shan123456789' },
      { $set: { sellerId: targetId.toString() } }
    );
    console.log(`Migrated ${upOrders.modifiedCount} orders in old cluster.`);

    // 4. Restore order 6a834533c4fa5bf6e2defc24 in old cluster if it exists
    const orderObjId = new mongoose.Types.ObjectId("6a834533c4fa5bf6e2defc24");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const upOrd = await ordersColl.updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: 'pending',
          rejectionReason: '',
          expiresAt: tomorrow,
          sellerId: targetId.toString()
        }
      }
    );
    console.log(`Restored order 6a834533c4fa5bf6e2defc24 in old cluster count: ${upOrd.modifiedCount}`);

  } catch (error) {
    console.error('Error in old cluster fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
