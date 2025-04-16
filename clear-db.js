// Script to clear all collections in the MongoDB database
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const MONGODB_URI = 'mongodb://localhost:27017/hackerrank_clone';

async function clearAllCollections() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('Connected to MongoDB');
    const db = client.db();
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections`);
    
    // Drop each collection
    for (const collection of collections) {
      console.log(`Clearing collection: ${collection.name}`);
      await db.collection(collection.name).deleteMany({});
      console.log(`Collection ${collection.name} cleared`);
    }
    
    console.log('All collections have been cleared');
    await client.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing collections:', error);
    process.exit(1);
  }
}

clearAllCollections();
