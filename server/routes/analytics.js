import express from 'express';
import Complaint from '../models/Complaint.js';

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get portal stats & department metrics
router.get('/overview', async (req, res) => {
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
router.get('/sla', async (req, res) => {
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

export default router;
