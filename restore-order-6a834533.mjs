import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://shanmaqbool33_db_user:VicgUI67cdOTq8SE@formhen.47vpwct.mongodb.net/henform";

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const ordersColl = db.collection('orders');

    const orderObjId = new mongoose.Types.ObjectId("6a834533c4fa5bf6e2defc24");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const res = await ordersColl.updateOne(
      { _id: orderObjId },
      {
        $set: {
          status: 'pending',
          rejectionReason: '',
          expiresAt: tomorrow,
          sellerId: '6a82d81e93a8eb0703c53004'
        }
      }
    );

    console.log(`✅ Order 6a834533c4fa5bf6e2defc24 restored to PENDING! Modified count: ${res.modifiedCount}`);

    const restoredOrder = await ordersColl.findOne({ _id: orderObjId });
    console.log('Restored Order:', restoredOrder);

  } catch (error) {
    console.error('Error restoring order:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
