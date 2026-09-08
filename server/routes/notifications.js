import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', async (req, res) => {
  try {
    // Get notifications for this specific user or role-based general notifications
    const query = {
      $or: [
        { userId: req.user._id.toString() },
        { userId: 'all' },
        { userId: `officer_all`, role: req.user.role === 'officer' || req.user.role === 'admin' ? 'officer' : 'none' }, // Officers get department/officer general alerts
      ]
    };

    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('❌ [Get Notifications Error]:', error.message);
    res.status(500).json({ success: false, message: 'Server Error fetching notifications.' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Only allow updating if it belongs to user or is a general one they are reading
    if (notification.userId !== req.user._id.toString() && notification.userId !== 'all' && !notification.userId.includes('officer')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error updating notification.' });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all unread notifications for a user as read
router.patch('/read-all', async (req, res) => {
  try {
    const query = {
      $or: [
        { userId: req.user._id.toString() },
      ],
      read: false
    };

    await Notification.updateMany(query, { $set: { read: true } });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error updating notifications.' });
  }
});

export default router;
