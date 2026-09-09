import express from 'express';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

export function createComplaintRouter(io) {
  const router = express.Router();

  // Helper to generate unique MH Complaint ID (e.g. MH-2026-8492)
  const generateComplaintId = async () => {
    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `MH-${year}-${String(count + 1).padStart(4, '0') || randomSuffix}`;
  };

  /**
   * @route   POST /api/complaints
   * @desc    Lodge a new complaint (Authenticated citizen, Real-time user-isolated)
   * @access  Private (Citizen, Officer, Admin)
   */
  router.post('/', protect, async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        department,
        priority = 'Medium',
        location,
        attachments = [],
      } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and category are required.',
        });
      }

      const generatedId = await generateComplaintId();

      // STRICT USER ISOLATION: userId is derived directly from verified JWT
      const complaint = new Complaint({
        userId: req.user._id,
        id: generatedId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        department: department || 'General Administration',
        priority,
        status: 'Submitted',
        location: location || { address: req.user.address || '', city: 'Mumbai' },
        citizen: {
          id: req.user._id.toString(),
          name: req.user.name,
          phone: req.user.phone || '',
          email: req.user.email || '',
        },
        attachments,
        timeline: [
          {
            status: 'Submitted',
            date: new Date(),
            updatedBy: req.user.name || 'Citizen',
            role: 'citizen',
            remarks: 'Grievance lodged through citizen portal.',
          },
        ],
      });

      await complaint.save();

      // Create notification for citizen
      const citizenNotif = await Notification.create({
        userId: req.user._id.toString(),
        role: 'citizen',
        complaintId: complaint.id,
        title: 'Grievance Registered',
        message: `Your grievance ${complaint.id} has been submitted successfully.`,
        type: 'status_change',
      });

      // Create notification for department officers/admins
      const officerNotif = await Notification.create({
        userId: 'officer_all',
        role: 'officer',
        complaintId: complaint.id,
        title: 'New Grievance Registered',
        message: `New complaint ${complaint.id} lodged in ${complaint.department}: "${title}"`,
        type: 'status_change',
      });

      // ⚡ EMIT TARGETED REAL-TIME SOCKET.IO EVENTS
      if (io) {
        const payload = {
          complaint,
          notification: citizenNotif,
        };

        // 1. Send strictly to current authenticated user's isolated room
        io.to(`user:${req.user._id}`).emit('complaint:created', payload);
        io.to(`user:${req.user._id}`).emit('new_grievance', payload);

        // 2. Send to department officers
        if (complaint.department) {
          io.to(`dept:${complaint.department}`).emit('complaint:created', {
            complaint,
            notification: officerNotif,
          });
          io.to(`dept:${complaint.department}`).emit('new_grievance', {
            complaint,
            notification: officerNotif,
          });
        }

        // 3. Send to administrative dashboard
        io.to('role:admin').emit('complaint:created', {
          complaint,
          notification: officerNotif,
        });
        io.to('role:admin').emit('new_grievance', {
          complaint,
          notification: officerNotif,
        });

        console.log(`📡 [Socket.IO] Emitted complaint:created for ${complaint.id} to user:${req.user._id}`);
      }

      res.status(201).json({
        success: true,
        message: 'Grievance lodged successfully',
        data: complaint,
      });
    } catch (error) {
      console.error('❌ [Create Complaint Error]:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/my
   * @desc    Get currently authenticated citizen's complaints ONLY
   * @access  Private
   */
  router.get('/my', protect, async (req, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;

      // STRICT USER ISOLATION: Query matches ONLY req.user._id
      const query = { userId: req.user._id };

      if (status && status.toUpperCase() !== 'ALL') {
        const s = status.toUpperCase();
        if (s === 'PENDING') query.status = { $in: ['Submitted', 'Under Review'] };
        else if (s === 'INPROGRESS' || s === 'IN_PROGRESS') query.status = { $in: ['In Progress', 'Assigned'] };
        else if (s === 'RESOLVED') query.status = { $in: ['Resolved', 'Closed'] };
        else query.status = status;
      }

      if (search && search.trim()) {
        const q = search.trim();
        query.$or = [
          { id: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [complaints, total] = await Promise.all([
        Complaint.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Complaint.countDocuments(query),
      ]);

      res.json({
        success: true,
        count: complaints.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: complaints,
      });
    } catch (error) {
      console.error('❌ [Get My Complaints Error]:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/stats/my
   * @desc    Get dashboard metrics for currently authenticated user
   * @access  Private
   */
  router.get('/stats/my', protect, async (req, res) => {
    try {
      const userId = req.user._id;

      const [total, pending, inProgress, resolved] = await Promise.all([
        Complaint.countDocuments({ userId }),
        Complaint.countDocuments({ userId, status: { $in: ['Submitted', 'Under Review'] } }),
        Complaint.countDocuments({ userId, status: { $in: ['In Progress', 'Assigned'] } }),
        Complaint.countDocuments({ userId, status: { $in: ['Resolved', 'Closed'] } }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          pending,
          inProgress,
          resolved,
        },
      });
    } catch (error) {
      console.error('❌ [Get My Stats Error]:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/track/:id
   * @desc    Public tracking endpoint (Sanitized public representation)
   * @access  Public
   */
  router.get('/track/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let complaint = await Complaint.findOne({ id: { $regex: new RegExp(`^${id.trim()}$`, 'i') } });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: `Grievance with ID ${id} not found.` });
      }

      // Safe public representation: NEVER leak citizen phone, email, password or internal IDs
      const publicData = {
        id: complaint.id,
        title: complaint.title,
        category: complaint.category,
        department: complaint.department,
        priority: complaint.priority,
        status: complaint.status,
        submittedDate: complaint.submittedDate || complaint.createdAt,
        updatedDate: complaint.updatedDate || complaint.updatedAt,
        slaDeadline: complaint.slaDeadline,
        timeline: (complaint.timeline || []).map(t => ({
          status: t.status,
          date: t.date,
          role: t.role === 'citizen' ? 'Citizen' : 'Department Officer',
          remarks: t.remarks,
        })),
        city: complaint.location?.city || 'Mumbai',
      };

      res.json({ success: true, data: publicData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/officer
   * @desc    Get complaints for officer dashboard
   * @access  Private (Officer, Admin)
   */
  router.get('/officer', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (req.user.role === 'officer') {
        // Match officer assignment or officer's department
        query.$or = [
          { 'assignedOfficer.id': req.user._id.toString() },
          { department: req.user.department || 'Road Maintenance' },
        ];
      }

      if (status && status.toUpperCase() !== 'ALL') {
        const s = status.toUpperCase();
        if (s === 'PENDING') query.status = { $in: ['Submitted', 'Under Review', 'Assigned'] };
        else if (s === 'INPROGRESS' || s === 'IN_PROGRESS') query.status = 'In Progress';
        else if (s === 'RESOLVED') query.status = { $in: ['Resolved', 'Closed'] };
        else query.status = status;
      }

      if (search && search.trim()) {
        const q = search.trim();
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { id: { $regex: q, $options: 'i' } },
              { title: { $regex: q, $options: 'i' } },
              { category: { $regex: q, $options: 'i' } },
            ],
          },
        ];
      }

      const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/admin
   * @desc    Get authorized global complaints for admin
   * @access  Private (Admin)
   */
  router.get('/admin', protect, authorizeRoles('admin'), async (req, res) => {
    try {
      const { status, department, search, limit = 100 } = req.query;
      const query = {};

      if (status && status.toUpperCase() !== 'ALL') {
        query.status = status;
      }
      if (department) {
        query.department = department;
      }
      if (search) {
        query.$or = [
          { id: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }

      const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit));

      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/notifications/my
   * @desc    Get notifications for currently authenticated user
   * @access  Private
   */
  router.get('/notifications/my', protect, async (req, res) => {
    try {
      const userId = req.user._id.toString();
      const notifications = await Notification.find({
        $or: [
          { userId },
          { userId: 'all' },
          { role: req.user.role },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   PATCH /api/complaints/notifications/:id/read
   * @desc    Mark a notification as read
   * @access  Private
   */
  router.patch('/notifications/:id/read', protect, async (req, res) => {
    try {
      const { id } = req.params;
      await Notification.findByIdAndUpdate(id, { read: true });
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   PATCH /api/complaints/notifications/read-all
   * @desc    Mark all user notifications as read
   * @access  Private
   */
  router.patch('/notifications/read-all', protect, async (req, res) => {
    try {
      const userId = req.user._id.toString();
      await Notification.updateMany({ userId }, { read: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   GET /api/complaints/:id
   * @desc    Get single complaint with strict ownership/role verification
   * @access  Private
   */
  router.get('/:id', protect, async (req, res) => {
    try {
      const { id } = req.params;
      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: `Grievance with ID ${id} not found.` });
      }

      // OWNERSHIP & ACCESS CONTROL CHECK
      const isOwner = complaint.userId && complaint.userId.toString() === req.user._id.toString();
      const isOfficer = req.user.role === 'officer';
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isOfficer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view this grievance.',
        });
      }

      res.json({ success: true, data: complaint });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   DELETE /api/complaints/:id
   * @desc    Delete a complaint with strict ownership verification
   * @access  Private (Owner citizen or Admin)
   */
  router.delete('/:id', protect, async (req, res) => {
    try {
      const { id } = req.params;

      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      // STRICT OWNERSHIP VERIFICATION:
      // A citizen can ONLY delete their own complaint. Admin can delete any complaint.
      const isOwner = complaint.userId && complaint.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only delete your own complaints.',
        });
      }

      const deletedId = complaint.id;
      const ownerId = complaint.userId?.toString();
      const dept = complaint.department;

      // Real MongoDB Deletion
      await Complaint.deleteOne({ _id: complaint._id });
      await Notification.deleteMany({ complaintId: deletedId });

      console.log(`🗑️ [Complaint API] Complaint ${deletedId} deleted from MongoDB by ${req.user.name}`);

      // ⚡ EMIT REALTIME DELETION EVENTS
      if (io) {
        const deletePayload = {
          complaintId: deletedId,
          _id: complaint._id,
        };

        // Notify only the owner's room (Never broadcast to other citizens)
        if (ownerId) {
          io.to(`user:${ownerId}`).emit('complaint:deleted', deletePayload);
        }

        // Notify admin
        io.to('role:admin').emit('complaint:deleted', deletePayload);

        // Notify department if relevant
        if (dept) {
          io.to(`dept:${dept}`).emit('complaint:deleted', deletePayload);
        }
      }

      return res.json({
        success: true,
        message: 'Complaint deleted successfully.',
        data: { id: deletedId },
      });
    } catch (error) {
      console.error('❌ [Delete Complaint Error]:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   PATCH /api/complaints/:id/status
   * @desc    Update complaint status (Officer/Admin, Real-time sync)
   * @access  Private (Officer, Admin)
   */
  router.patch('/:id/status', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks, officerName } = req.body;

      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      complaint.status = status;
      complaint.updatedDate = new Date();

      const updater = officerName || req.user.name || 'Department Officer';

      complaint.timeline.push({
        status,
        date: new Date(),
        updatedBy: updater,
        role: req.user.role || 'officer',
        remarks: remarks || `Status updated to ${status}.`,
      });

      await complaint.save();

      // Create citizen notification
      const notif = await Notification.create({
        userId: complaint.userId ? complaint.userId.toString() : 'all',
        role: 'citizen',
        complaintId: complaint.id,
        title: `Status Update: ${complaint.id}`,
        message: `Your grievance "${complaint.title}" is now marked as "${status}".`,
        type: 'status_change',
      });

      // ⚡ EMIT TARGETED REAL-TIME SOCKET.IO EVENTS
      if (io) {
        const updatePayload = {
          complaintId: complaint.id,
          status,
          complaint,
          notification: notif,
          updatedBy: updater,
        };

        // Notify citizen owner room
        if (complaint.userId) {
          io.to(`user:${complaint.userId}`).emit('complaint:statusChanged', updatePayload);
          io.to(`user:${complaint.userId}`).emit('status_updated', updatePayload);
        }

        // Notify admin
        io.to('role:admin').emit('complaint:statusChanged', updatePayload);
        io.to('role:admin').emit('status_updated', updatePayload);

        // Notify department
        if (complaint.department) {
          io.to(`dept:${complaint.department}`).emit('status_updated', updatePayload);
        }
      }

      res.json({
        success: true,
        message: `Complaint status updated to ${status}`,
        data: complaint,
      });
    } catch (error) {
      console.error('❌ [Update Status Error]:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * @route   POST /api/complaints/:id/remarks
   * @desc    Add official remark or citizen comment
   * @access  Private
   */
  router.post('/:id/remarks', protect, async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      if (!remarks || !remarks.trim()) {
        return res.status(400).json({ success: false, message: 'Remarks text is required.' });
      }

      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      // Ownership check for citizens
      if (req.user.role === 'citizen' && complaint.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }

      complaint.timeline.push({
        status: complaint.status,
        date: new Date(),
        updatedBy: req.user.name,
        role: req.user.role || 'citizen',
        remarks: remarks.trim(),
      });
      complaint.updatedDate = new Date();
      await complaint.save();

      if (io) {
        const payload = {
          complaintId: complaint.id,
          remarks: remarks.trim(),
          updatedBy: req.user.name,
          complaint,
        };
        if (complaint.userId) {
          io.to(`user:${complaint.userId}`).emit('remark_added', payload);
        }
        io.to('role:admin').emit('remark_added', payload);
      }

      res.json({ success: true, data: complaint });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Backward compatibility alias for global listings
  router.get('/', protect, async (req, res) => {
    if (req.user.role === 'admin') {
      const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: complaints.length, data: complaints });
    }
    // For citizen, redirect to their isolated complaints
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, count: complaints.length, data: complaints });
  });

  return router;
}

export default createComplaintRouter;
