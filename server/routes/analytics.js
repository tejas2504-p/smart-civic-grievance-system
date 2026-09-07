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

export default router;
