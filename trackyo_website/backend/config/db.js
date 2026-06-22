const mongoose = require('mongoose');

// Try to connect to an external MongoDB first. If not present, start an
// in-memory MongoDB for development convenience.
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`Error connecting to MongoDB at provided URI: ${error.message}`);
      // fallthrough to memory server fallback
    }
  }

  // Fallback to mongodb-memory-server for development if available
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB (memory) Connected: ${conn.connection.host}`);
    // Keep mongod reference alive through process lifetime
    process.on('exit', async () => {
      try { await mongod.stop(); } catch (e) {}
    });
  } catch (error) {
    console.error(`Error connecting to fallback in-memory MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
