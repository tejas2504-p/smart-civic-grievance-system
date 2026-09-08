import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
  },
  entity: {
    type: String,
    required: true,
    enum: ['User', 'Complaint', 'OTP', 'System'],
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  performedBy: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin', 'system'],
    default: 'system',
  },
  ipAddress: {
    type: String,
    default: '0.0.0.0',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 31536000, // Auto-delete logs after 1 year (365 days)
  }
}, { timestamps: false }); // Disable standard timestamps as we use custom 'timestamp'

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
