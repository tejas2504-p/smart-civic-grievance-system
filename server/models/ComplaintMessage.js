import mongoose from 'mongoose';

const complaintMessageSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  readBy: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false });

export default mongoose.models.ComplaintMessage || mongoose.model('ComplaintMessage', complaintMessageSchema);
