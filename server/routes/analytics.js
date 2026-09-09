import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get portal stats & department metrics
router.get('/overview', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const inProgress = await Complaint.countDocuments({ status: { $in: ['In Progress', 'Assigned'] } });
    const pending = await Complaint.countDocuments({ status: { $in: ['Submitted', 'Under Review'] } });

    // Category breakdown
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Department breakdown
    const departmentStats = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total,
        resolved,
        inProgress,
        pending,
        resolutionRate: Number(resolutionRate),
        categoryStats,
        departmentStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/sla
// @desc    Get SLA compliance and breach statistics
router.get('/sla', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const breached = await Complaint.countDocuments({ slaState: 'BREACHED' });
    const escalated = await Complaint.countDocuments({ escalationLevel: { $gt: 0 } });
    
    // Average resolution time for resolved complaints
    const resolvedComplaints = await Complaint.find({ status: { $in: ['Resolved', 'Closed'] } }).select('submittedDate updatedDate');
    let avgResolutionHours = 0;
    
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, c) => {
        const diffMs = new Date(c.updatedDate) - new Date(c.submittedDate);
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = totalHours / resolvedComplaints.length;
    }

    const complianceRate = total > 0 ? (((total - breached) / total) * 100).toFixed(1) : 100;
    const breachRate = total > 0 ? ((breached / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total,
        breached,
        escalated,
        compliant: total - breached,
        complianceRate: Number(complianceRate),
        breachRate: Number(breachRate),
        avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get complaint trends over time
router.get('/trends', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, weekly, monthly, yearly
    
    // Default to monthly trend grouping
    const groupBy = {
      year: { $year: '$submittedDate' },
      month: { $month: '$submittedDate' }
    };
    
    if (period === 'daily') {
      groupBy.day = { $dayOfMonth: '$submittedDate' };
    }

    const trends = await Complaint.aggregate([
      {
        $group: {
          _id: groupBy,
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const formattedTrends = trends.map(t => {
      const monthName = new Date(t._id.year, (t._id.month || 1) - 1).toLocaleString('default', { month: 'short' });
      const label = t._id.day ? `${t._id.day} ${monthName}` : monthName;
      return { label, complaints: t.total, resolved: t.resolved };
    });

    res.json({ success: true, data: formattedTrends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/locations
// @desc    Get complaint geographical distribution (Admin/Officer only for full details)
router.get('/locations', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
  try {
    const locations = await Complaint.aggregate([
      { $match: { 'location.lat': { $exists: true }, 'location.lng': { $exists: true } } },
      { $project: { _id: 1, lat: '$location.lat', lng: '$location.lng', status: 1, category: 1 } }
    ]);
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/public
// @desc    Get sanitized public transparency data
router.get('/public', async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    const departmentStats = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } } } },
      { $project: { department: '$_id', total: '$count', resolved: 1, rate: { $multiply: [{ $divide: ['$resolved', { $cond: [{ $eq: ['$count', 0] }, 1, '$count'] }] }, 100] } } },
      { $sort: { total: -1 } }
    ]);

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        total,
        resolved,
        resolutionRate: Number(resolutionRate),
        departmentStats,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
