import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { mockUser, mockOfficer, mockAdmin, departments } from '../../src/data/mockData.js';

let mongoMemoryServerInstance = null;

/**
 * Seed default demo users and departments if they do not exist
 */
export async function autoSeedDefaultUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 [Database] No users found. Seeding default demo accounts...');
      const defaultPassword = 'password123';

      await User.create([
        {
          name: mockUser.name || 'Rajesh Kumar',
          email: (mockUser.email || 'rajesh.kumar@email.com').toLowerCase(),
          phone: '+919876543210',
          password: defaultPassword,
          role: 'citizen',
          emailVerified: true,
          phoneVerified: true,
        },
        {
          name: 'Demo Citizen',
          email: 'demo.citizen@gov.in',
          phone: '+919653260119',
          password: defaultPassword,
          role: 'citizen',
          emailVerified: true,
          phoneVerified: true,
        },
        {
          name: mockOfficer.name || 'Suresh Patil',
          email: (mockOfficer.email || 'suresh.patil@gov.mh.in').toLowerCase(),
          phone: '+919765432109',
          password: defaultPassword,
          role: 'officer',
          department: mockOfficer.department || 'Road Maintenance',
          designation: mockOfficer.designation || 'Junior Engineer',
          emailVerified: true,
          phoneVerified: true,
        },
        {
          name: mockAdmin.name || 'Priya Sharma',
          email: (mockAdmin.email || 'priya.sharma@gov.mh.in').toLowerCase(),
          phone: '+919876543211',
          password: defaultPassword,
          role: 'admin',
          department: mockAdmin.department || 'Administration',
          emailVerified: true,
          phoneVerified: true,
        },
      ]);

      console.log('✅ [Database] Default users created:');
      console.log('   👤 Citizen:  rajesh.kumar@email.com / password123 (or +919653260119)');
      console.log('   👮 Officer:  suresh.patil@gov.mh.in / password123');
      console.log('   👑 Admin:    priya.sharma@gov.mh.in / password123');
    } else {
      // Ensure Demo Citizen has the current demo phone number
      const demoCitizen = await User.findOne({ email: 'demo.citizen@gov.in' });
      if (demoCitizen && demoCitizen.phone !== '+919653260119') {
        demoCitizen.phone = '+919653260119';
        await demoCitizen.save();
        console.log('🔄 [Database] Updated Demo Citizen phone number to +919653260119');
      }
    }

    const deptCount = await Department.countDocuments();
    if (deptCount === 0 && departments && departments.length) {
      await Department.insertMany(
        departments.map((d) => ({
          name: d.name,
          code: d.code,
          activeOfficersCount: d.officers || 0,
          slaHoursDefault: 48,
        }))
      );
      console.log(`🏢 [Database] Seeded ${departments.length} default departments.`);
    }
  } catch (seedErr) {
    console.warn('⚠️ [Database] Notice during auto-seeding:', seedErr.message);
  }
}

/**
 * Connect to MongoDB Atlas with auto-fallback to in-memory MongoDB
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  mongoose.set('strictQuery', true);

  let connected = false;

  // 1. Try connecting to configured MongoDB Atlas URI
  if (uri) {
    try {
      console.log('🔄 [MongoDB] Connecting to MongoDB Atlas cluster...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      console.log(`✅ [MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
      connected = true;
    } catch (error) {
      console.warn('⚠️ [MongoDB Atlas] Connection failed:', error.message);
      console.warn('💡 Tip: Whitelist your current IP address (or 0.0.0.0/0) in MongoDB Atlas Network Access: https://cloud.mongodb.com');
    }
  }

  // 2. If Atlas is unreachable or not configured, seamlessly fall back to In-Memory MongoDB
  if (!connected) {
    try {
      console.log('🔄 [MongoDB Fallback] Starting in-memory MongoDB database for development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      const memUri = mongoMemoryServerInstance.getUri();

      const conn = await mongoose.connect(memUri);
      console.log(`✅ [MongoDB In-Memory] Connected successfully: ${conn.connection.host}`);
      connected = true;
    } catch (memError) {
      console.error('❌ [MongoDB Fallback] Failed to start in-memory database:', memError.message);
      return false;
    }
  }

  // 3. Ensure test/demo accounts are ready for instant login
  if (connected) {
    await autoSeedDefaultUsers();
  }

  return connected;
}

export function getMongoMemoryServer() {
  return mongoMemoryServerInstance;
}
