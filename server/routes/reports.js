import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Helper to convert JSON to CSV string
const jsonToCsv = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  ).join('\n');
  return `${headers}\n${rows}`;
};

// @route   GET /api/reports/export/:type
// @desc    Download CSV report
router.get('/export/:type', protect, authorizeRoles('admin', 'officer', 'department_head'), async (req, res) => {
  try {
    const { type } = req.params; // e.g., 'Category Report', 'SLA Report'
    let complaints = [];
    
    // In a real system, you'd apply filters based on req.query
    // For this demonstration, we map types to basic queries.
    if (type.includes('SLA')) {
      complaints = await Complaint.find().select('id title department category priority status slaState escalationLevel submittedDate');
    } else {
      complaints = await Complaint.find().select('id title department category priority status submittedDate updatedDate');
    }

    const csvData = complaints.map(c => c.toObject());
    const csvString = jsonToCsv(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type.replace(/\s+/g, '_')}_${Date.now()}.csv"`);
    res.status(200).send(csvString);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
