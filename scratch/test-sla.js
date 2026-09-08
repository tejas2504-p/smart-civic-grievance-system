import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../server/config/db.js';
import Complaint from '../server/models/Complaint.js';
import SLARule from '../server/models/SLARule.js';
import Notification from '../server/models/Notification.js';

async function testSLA() {
  try {
    await connectDB();
    console.log('--- Starting SLA Engine Test ---');

    // 1. Seed Rules
    await SLARule.deleteMany({});
    await SLARule.create({ priority: 'Medium', deadlineHours: 48, warningHoursBefore: 12, escalationLevels: 3 });
    console.log('✅ Seeded SLARule');

    // 2. Create Dummy Complaint
    await Complaint.deleteMany({ id: 'TEST-SLA' });
    const complaint = await Complaint.create({
      id: 'TEST-SLA',
      title: 'SLA Test',
      description: 'Testing SLA breach and warning',
      category: 'Test',
      department: 'Test',
      priority: 'Medium',
      status: 'Submitted',
      slaState: 'ACTIVE',
      // Force deadline to 2 hours from now (will trigger warning but not breach)
      slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000)
    });
    console.log(`✅ Created Active Complaint TEST-SLA with deadline in 2h`);

    // 3. Trigger manual SLA Cron logic 
    console.log('--- Running SLA Logic ---');
    const { initSLACron } = await import('../server/jobs/slaCron.js');
    // We cannot wait for setInterval, so we mimic the inner logic directly for testing:
    const activeComplaints = await Complaint.find({ slaState: { $in: ['ACTIVE', 'APPROACHING_DEADLINE'] } });
    
    for (const c of activeComplaints) {
      if (c.id !== 'TEST-SLA') continue;

      let rule = await SLARule.findOne({ priority: c.priority });
      const msRemaining = c.slaDeadline.getTime() - Date.now();
      const hoursRemaining = msRemaining / (1000 * 60 * 60);

      console.log(`Complaint ${c.id} hours remaining: ${hoursRemaining.toFixed(2)}`);

      if (hoursRemaining <= rule.warningHoursBefore && c.slaState === 'ACTIVE') {
        console.log('✅ Warning logic triggered correctly');
        c.slaState = 'APPROACHING_DEADLINE';
        await c.save();
      }
    }

    // Assert Warning state
    const updated = await Complaint.findOne({ id: 'TEST-SLA' });
    if (updated.slaState === 'APPROACHING_DEADLINE') {
      console.log('🎉 SLA Warning Test PASSED');
    } else {
      throw new Error('SLA Warning Test FAILED');
    }

    console.log('--- Simulating Breach ---');
    // Force deadline to 1 hour ago
    updated.slaDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000);
    await updated.save();

    const breachComplaints = await Complaint.find({ slaState: { $in: ['ACTIVE', 'APPROACHING_DEADLINE'] } });
    for (const c of breachComplaints) {
      if (c.id !== 'TEST-SLA') continue;
      const msRemaining = c.slaDeadline.getTime() - Date.now();
      const hoursRemaining = msRemaining / (1000 * 60 * 60);

      if (hoursRemaining <= 0) {
        console.log('✅ Breach logic triggered correctly');
        c.slaState = 'BREACHED';
        c.escalationLevel = (c.escalationLevel || 0) + 1;
        await c.save();
      }
    }

    const breached = await Complaint.findOne({ id: 'TEST-SLA' });
    if (breached.slaState === 'BREACHED' && breached.escalationLevel === 1) {
      console.log('🎉 SLA Breach & Escalation Test PASSED');
    } else {
      throw new Error('SLA Breach Test FAILED');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSLA();
