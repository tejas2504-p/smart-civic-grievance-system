import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Complaint from './models/Complaint.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas...');

    const deletedComplaints = await Complaint.deleteMany({});
    const deletedNotifs = await Notification.deleteMany({});

    console.log(`🧹 Deleted ${deletedComplaints.deletedCount} demo complaints from MongoDB Atlas.`);
    console.log(`🧹 Deleted ${deletedNotifs.deletedCount} demo notifications from MongoDB Atlas.`);
    console.log('✨ MongoDB Atlas database is now clean and ready for real citizen grievances!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
