import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from './models/User.js';
import Complaint from './models/Complaint.js';
import Department from './models/Department.js';
import Notification from './models/Notification.js';
import { complaints, mockUser, mockOfficer, mockAdmin, departments, notifications } from '../src/data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is required in .env to run the seed script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Department.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Cleaned existing database collections.');

    // Seed Users
    await User.create([
      { ...mockUser, password: 'password123', role: 'citizen' },
      { ...mockOfficer, password: 'password123', role: 'officer' },
      { ...mockAdmin, password: 'password123', role: 'admin' },
    ]);
    console.log('👥 Seeded Users (Citizen, Officer, Admin).');

    // Seed Complaints
    const formattedComplaints = complaints.map(c => ({
      ...c,
      submittedDate: c.submittedDate ? new Date(c.submittedDate) : new Date(),
      updatedDate: c.updatedDate ? new Date(c.updatedDate) : new Date(),
      slaDeadline: c.slaDeadline ? new Date(c.slaDeadline) : new Date(Date.now() + 48 * 3600 * 1000),
      timeline: (c.timeline || []).map(t => ({
        ...t,
        date: t.date ? new Date(t.date) : new Date(),
      })),
    }));

    await Complaint.insertMany(formattedComplaints);
    console.log(`📋 Seeded ${formattedComplaints.length} Grievance Complaints.`);

    // Seed Departments
    if (departments && departments.length) {
      await Department.insertMany(departments);
      console.log(`🏢 Seeded ${departments.length} Departments.`);
    }

    // Seed Notifications
    if (notifications && notifications.length) {
      await Notification.insertMany(notifications);
      console.log(`🔔 Seeded ${notifications.length} Notifications.`);
    }

    console.log(`
    🎉 ==============================================
    ✅ Database Seeding Completed Successfully!
    ==============================================
    `);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
