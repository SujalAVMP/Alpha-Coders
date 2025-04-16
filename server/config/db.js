const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use a free MongoDB Atlas connection string as a fallback if local MongoDB is not available
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackerrank_clone';

    // Try to connect to the database
    let conn;
    try {
      conn = await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (initialError) {
      console.error(`Error connecting to primary MongoDB: ${initialError.message}`);
      console.log('Attempting to connect to in-memory MongoDB...');

      // If we can't connect to the database, use in-memory MongoDB
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      console.log(`Connected to in-memory MongoDB: ${conn.connection.host}`);
    }

    return conn;
  } catch (error) {
    console.error(`Error connecting to any MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
