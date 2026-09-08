import express from 'express';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import ComplaintMessage from '../models/ComplaintMessage.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function createComplaintRouter(io) {
  const router = express.Router();

  // Helper to generate unique MH Complaint ID (e.g. MH-2026-8492)
  const generateComplaintId = async () => {
    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `MH-${year}-${String(count + 1).padStart(4, '0') || randomSuffix}`;
  };

  // @route   GET /api/complaints
  // @desc    Get all complaints with optional filters
  router.get('/', async (req, res) => {
    try {
      const { status, priority, department, citizenId, search, limit = 50 } = req.query;
      const query = {};

      if (status && status !== 'ALL') {
        if (status === 'PENDING') query.status = { $in: ['Submitted', 'Under Review'] };
        else if (status === 'IN_PROGRESS') query.status = { $in: ['In Progress', 'Assigned'] };
        else if (status === 'RESOLVED') query.status = { $in: ['Resolved', 'Closed'] };
        else query.status = status;
      }

      if (priority) query.priority = priority;
      if (department) query.department = department;
      if (citizenId) query['citizen.id'] = citizenId;

      if (search) {
        query.$or = [
          { id: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ];
      }

      const complaints = await Complaint.find(query)
        .sort({ submittedDate: -1 })
        .limit(Number(limit));

      // Privacy: Mask citizen PII unless user is an officer/admin
      let isOfficer = false;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
           const token = req.headers.authorization.split(' ')[1];
           const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026');
           const user = await User.findById(decoded.id);
           if (user && (user.role === 'officer' || user.role === 'admin')) isOfficer = true;
        } catch(e) {}
      }

      const safeComplaints = complaints.map(c => {
        const obj = c.toObject();
        if (!isOfficer && obj.citizen) {
          obj.citizen.phone = '***';
          obj.citizen.email = '***';
        }
        return obj;
      });

      res.json({
        success: true,
        count: safeComplaints.length,
        data: safeComplaints,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   GET /api/complaints/:id
  // @desc    Get single complaint by custom ID or Mongo _id
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: `Grievance with ID ${id} not found` });
      }

      res.json({ success: true, data: complaint });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   POST /api/complaints
  // @desc    Lodge a new complaint (Real-time trigger)
  router.post('/', protect, async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        department,
        priority = 'Medium',
        location,
        citizen,
        attachments = [],
      } = req.body;

      if (!Array.isArray(attachments)) return res.status(400).json({ success: false, message: 'Attachments must be an array.' });
      if (attachments.length > 5) return res.status(400).json({ success: false, message: 'Maximum 5 attachments allowed.' });
      for (const att of attachments) {
         // rough base64 size check (5MB)
         if (typeof att === 'string' && att.length > 5 * 1024 * 1024 * 1.35) {
            return res.status(400).json({ success: false, message: 'An attachment exceeds the 5MB size limit.' });
         }
      }

      const generatedId = await generateComplaintId();

      const complaint = new Complaint({
        id: generatedId,
        title,
        description,
        category,
        department,
        priority,
        status: 'Submitted',
        location: location || { address: '', city: 'Mumbai' },
        citizen: citizen || { name: 'Citizen' },
        attachments,
        timeline: [
          {
            status: 'Submitted',
            date: new Date(),
            updatedBy: citizen?.name || 'Citizen',
            role: 'citizen',
            remarks: 'Grievance lodged through web portal.',
          },
        ],
      });

      await complaint.save();

      // Create notification for officers/admins
      const notif = await Notification.create({
        userId: 'officer_all',
        role: 'officer',
        complaintId: complaint.id,
        title: 'New Grievance Registered',
        message: `New complaint ${complaint.id} lodged in ${department}: "${title}"`,
        type: 'status_change',
      });

      // ⚡ EMIT REAL-TIME WEBSOCKET EVENT
      if (io) {
        io.to('officer_all').emit('new_grievance', {
          complaint,
          notification: notif,
        });
        io.to(`user_${req.user._id.toString()}`).emit('new_grievance', { complaint });
        console.log(`📡 [Socket.IO] Emitted 'new_grievance' for ${complaint.id}`);
      }

      res.status(201).json({
        success: true,
        message: 'Grievance lodged successfully',
        data: complaint,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   PATCH /api/complaints/:id/status
  // @desc    Update complaint status (Real-time trigger)
  router.patch('/:id/status', protect, authorizeRoles('officer', 'admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks, updatedBy = 'Officer', officerId, officerName } = req.body;

      let complaint = await Complaint.findOne({ id });
      if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
        complaint = await Complaint.findById(id);
      }

      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found' });
      }

      complaint.status = status;
      complaint.updatedDate = new Date();

      if (officerName) {
        complaint.assignedOfficer = {
          id: officerId || complaint.assignedOfficer?.id || '',
          name: officerName,
          department: complaint.department,
        };
      }

      complaint.timeline.push({
        status,
        date: new Date(),
        updatedBy,
        role: 'officer',
        remarks: remarks || `Status updated to ${status}.`,
      });

      await complaint.save();

      // Create Audit Log
      await AuditLog.create({
        action: 'STATUS_UPDATE',
        entity: 'Complaint',
        entityId: complaint.id,
        performedBy: req.user.email || 'officer',
        role: req.user.role || 'officer',
        ipAddress: req.ip,
        details: { oldStatus: complaint.status, newStatus: status }
      });

      // Create citizen notification
      const notif = await Notification.create({
        userId: complaint.citizen?.id || 'citizen_user',
        complaintId: complaint.id,
        title: 'Status Updated',
        message: `Your grievance ${complaint.id} status is now: ${status}`,
        type: 'status_change',
      });

      io.to(`user_${notif.userId}`).emit('status_updated', {
        complaintId: complaint.id,
        status: complaint.status,
      });
      io.to(`user_${notif.userId}`).emit('new_notification', notif);

      // ⚡ EMIT REAL-TIME WEBSOCKET EVENT
      if (io) {
        io.emit('status_updated', {
          complaintId: complaint.id,
          status,
          complaint,
          notification: notif,
          updatedBy,
        });
        console.log(`📡 [Socket.IO] Emitted 'status_updated' for ${complaint.id} -> ${status}`);
      }

      res.json({
        success: true,
        message: `Complaint status updated to ${status}`,
        data: complaint,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   POST /api/complaints/:id/remarks
  // @desc    Add official remark or communication
  router.post('/:id/remarks', async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks, updatedBy = 'Officer', role = 'officer' } = req.body;

      const complaint = await Complaint.findOne({ id });
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

      complaint.timeline.push({
        status: complaint.status,
        date: new Date(),
        updatedBy,
        role,
        remarks,
      });
      complaint.updatedDate = new Date();
      await complaint.save();

      if (io) {
        io.emit('remark_added', { complaintId: complaint.id, remarks, updatedBy, complaint });
      }

      res.json({ success: true, data: complaint });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   GET /api/complaints/:id/messages
  // @desc    Get chat messages for a complaint
  router.get('/:id/messages', protect, async (req, res) => {
    try {
      const complaintId = req.params.id;
      // Basic check, if officer it's fine, if citizen ensure it's their complaint
      if (req.user.role === 'citizen') {
        const complaint = await Complaint.findOne({ id: complaintId, 'citizen.id': req.user._id.toString() });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
      }

      const messages = await ComplaintMessage.find({ complaintId }).sort({ createdAt: 1 });
      res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // @route   POST /api/complaints/:id/messages
  // @desc    Send a message in complaint chat
  router.post('/:id/messages', protect, async (req, res) => {
    try {
      const complaintId = req.params.id;
      const { message } = req.body;
      if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

      let complaint;
      if (req.user.role === 'citizen') {
        complaint = await Complaint.findOne({ id: complaintId, 'citizen.id': req.user._id.toString() });
      } else {
        complaint = await Complaint.findOne({ id: complaintId });
      }

      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

      const newMsg = await ComplaintMessage.create({
        complaintId,
        senderId: req.user._id.toString(),
        senderName: req.user.name || 'User',
        role: req.user.role,
        message
      });

      // Emit to the specific complaint chat room
      io.to(`complaint_${complaintId}`).emit('new_message', newMsg);

      // Also create a notification for the OTHER party
      const notifyUserId = req.user.role === 'citizen' ? 'officer_all' : complaint.citizen.id;
      const notif = await Notification.create({
        userId: notifyUserId,
        complaintId,
        title: 'New Message',
        message: `${req.user.name} sent a message: "${message.substring(0, 30)}..."`,
        type: 'new_message',
      });
      io.to(`user_${notifyUserId}`).emit('new_notification', notif);

      res.status(201).json({ success: true, data: newMsg });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
