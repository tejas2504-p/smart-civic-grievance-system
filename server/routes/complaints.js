import express from 'express';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

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

      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
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
  router.post('/', async (req, res) => {
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
        io.emit('new_grievance', {
          complaint,
          notification: notif,
        });
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
  router.patch('/:id/status', async (req, res) => {
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

      // Create citizen notification
      const notif = await Notification.create({
        userId: complaint.citizen?.id || 'citizen_user',
        role: 'citizen',
        complaintId: complaint.id,
        title: `Status Update: ${complaint.id}`,
        message: `Your grievance "${complaint.title}" is now marked as "${status}".`,
        type: 'status_change',
      });

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

  return router;
}
