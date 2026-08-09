const mongoose = require('mongoose');
(async () => {
  try {
    const uri = process.argv[2] || 'mongodb://shanmaqbool33_db_user:VicgUI67cdOTq8SE@ac-qc4w5l1-shard-00-00.47vpwct.mongodb.net:27017,ac-qc4w5l1-shard-00-01.47vpwct.mongodb.net:27017,ac-qc4w5l1-shard-00-02.47vpwct.mongodb.net:27017/henform?ssl=true&replicaSet=ac-qc4w5l1-shard-0&authSource=admin&retryWrites=true&w=majority';
    console.log('Attempting to connect to:', uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    console.log('Mongoose connected');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
