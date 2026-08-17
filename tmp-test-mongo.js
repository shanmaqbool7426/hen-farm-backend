const mongoose = require('mongoose');
(async () => {
  try {
    const uri = process.argv[2] || process.env.MONGODB_URI;
    if (!uri) {
      console.error('Pass a connection string as argv[2] or set MONGODB_URI.');
      process.exit(1);
    }
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
