import express from 'express';
import SLARule from '../models/SLARule.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @route   GET /api/sla
// @desc    Get all SLA rules
// @access  Public or Authenticated
router.get('/', async (req, res) => {
  try {
    const rules = await SLARule.find().sort({ deadlineHours: 1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/sla/:priority
// @desc    Update SLA rule for a specific priority
// @access  Admin only
router.put('/:priority', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { deadlineHours, warningHoursBefore, escalationLevels } = req.body;
    
    let rule = await SLARule.findOne({ priority: req.params.priority });
    if (!rule) {
      rule = new SLARule({ priority: req.params.priority });
    }

    if (deadlineHours !== undefined) rule.deadlineHours = deadlineHours;
    if (warningHoursBefore !== undefined) rule.warningHoursBefore = warningHoursBefore;
    if (escalationLevels !== undefined) rule.escalationLevels = escalationLevels;

    await rule.save();

    await AuditLog.create({
      action: 'UPDATE_SLA',
      performedBy: req.user._id,
      details: `Updated SLA for ${req.params.priority}: ${deadlineHours}h`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/sla/seed
// @desc    Seed default SLA rules
// @access  Admin only
router.post('/seed', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const defaults = [
      { priority: 'Low', deadlineHours: 168, warningHoursBefore: 24, escalationLevels: 3 },
      { priority: 'Medium', deadlineHours: 72, warningHoursBefore: 12, escalationLevels: 3 },
      { priority: 'High', deadlineHours: 48, warningHoursBefore: 8, escalationLevels: 3 },
      { priority: 'Critical', deadlineHours: 24, warningHoursBefore: 4, escalationLevels: 3 },
    ];

    for (const rule of defaults) {
      await SLARule.findOneAndUpdate({ priority: rule.priority }, rule, { upsert: true });
    }

    res.json({ success: true, message: 'Default SLA rules seeded successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
