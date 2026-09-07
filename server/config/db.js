import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ [MongoDB Atlas] MONGODB_URI is not set in .env. Server will run in memory/fallback mode until configured.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Connection error:', error.message);
    console.log('💡 Tip: Make sure your IP is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0) and credentials in .env are correct.');
    return false;
  }
}
