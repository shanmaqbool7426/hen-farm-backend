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
    const usersColl = db.collection('users');

    const shans = await usersColl.find({
      $or: [
        { email: 'shanmaqbool12345@gmail.com' },
        { phone: '03069829158' }
      ]
    }).toArray();

    console.log(`Found ${shans.length} Shan users in MongoDB Atlas:`);
    for (const u of shans) {
      console.log('--- USER ---');
      console.log('_id:', u._id, 'Type:', typeof u._id, 'Constructor:', u._id.constructor.name);
      console.log('name:', u.name);
      console.log('email:', u.email);
      console.log('phone:', u.phone);
      console.log('role:', u.role);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
