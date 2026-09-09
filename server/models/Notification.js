import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'all',
    index: true,
  },
  role: {
    type: String,
    default: 'citizen',
  },
  complaintId: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Notification',
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'status_change',
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { strict: false });

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
