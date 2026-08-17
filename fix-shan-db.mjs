import mongoose from 'mongoose';
import dns from 'dns';
import crypto from 'crypto';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://shanmaqbool33_db_user:VicgUI67cdOTq8SE@formhen.47vpwct.mongodb.net/henform";

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
    const delRes1 = await usersColl.deleteMany({ _id: "67890shan123456789" });
    console.log(`Deleted mock user _id 67890shan123456789 count: ${delRes1.deletedCount}`);

    // 2. Delete any user with email shanmaqbool12345@gmail.com whose _id is NOT ObjectId("6a82d81e93a8eb0703c53004")
    const targetObjId = new mongoose.Types.ObjectId("6a82d81e93a8eb0703c53004");
    const delRes2 = await usersColl.deleteMany({
      email: 'shanmaqbool12345@gmail.com',
      _id: { $ne: targetObjId }
    });
    console.log(`Deleted duplicate email users count: ${delRes2.deletedCount}`);

    // 3. Update real Shan seller (ObjectId("6a82d81e93a8eb0703c53004")) with email and password
    const upRes = await usersColl.updateOne(
      { _id: targetObjId },
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
    console.log(`Updated real Shan seller count: ${upRes.modifiedCount}`);

    // 4. Verify Shan user in DB
    const finalShan = await usersColl.findOne({ _id: targetObjId });
    console.log('Final Shan User in DB:', finalShan);

    // 5. Verify pending orders for real Shan seller ID
    const pendingOrders = await ordersColl.find({ sellerId: targetObjId.toString(), status: 'pending' }).toArray();
    console.log(`Pending orders for real Shan (${targetObjId.toString()}):`, pendingOrders.length);

  } catch (error) {
    console.error('Error in fix script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
