import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../server/config/db.js';
import Complaint from '../server/models/Complaint.js';

async function testAnalytics() {
  try {
    await connectDB();
    console.log('--- Starting Analytics Aggregation Test ---');

    console.log('Testing Public Transparency Aggregation...');
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    const departmentStats = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } } } },
      { $project: { department: '$_id', total: '$count', resolved: 1, rate: { $multiply: [{ $divide: ['$resolved', { $cond: [{ $eq: ['$count', 0] }, 1, '$count'] }] }, 100] } } },
      { $sort: { total: -1 } }
    ]);

    console.log('Public Data Results:', { total, resolved, resolutionRate, departmentsCount: departmentStats.length });
    if (departmentStats.length > 0) {
      console.log('Sample Department:', departmentStats[0]);
    }
    console.log('✅ Public Transparency pipeline executed successfully.');

    console.log('Testing Trends Aggregation...');
    const trends = await Complaint.aggregate([
      {
        $group: {
          _id: { year: { $year: '$submittedDate' }, month: { $month: '$submittedDate' } },
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    console.log('Trends generated:', trends.length);
    console.log('✅ Trends pipeline executed successfully.');

    console.log('🎉 All analytics pipelines passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    process.exit(1);
  }
}

testAnalytics();
