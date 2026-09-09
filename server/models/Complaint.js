import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    default: 'System',
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin', 'system'],
    default: 'system',
  },
  remarks: {
    type: String,
    default: '',
  },
});

const complaintSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: [
      'Submitted',
      'Under Review',
      'Assigned',
      'In Progress',
      'Resolved',
      'Closed',
      'Reopened',
      'Escalated',
    ],
    default: 'Submitted',
  },
  location: { type: mongoose.Schema.Types.Mixed, default: {} },
  citizen: { type: mongoose.Schema.Types.Mixed, default: {} },
  officer: { type: mongoose.Schema.Types.Mixed, default: {} },
  assignedOfficer: { type: mongoose.Schema.Types.Mixed, default: {} },
  slaDeadline: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // Fallback
  },
  slaState: {
    type: String,
    enum: ['ACTIVE', 'APPROACHING_DEADLINE', 'BREACHED', 'RESOLVED'],
    default: 'ACTIVE',
  },
  escalationLevel: {
    type: Number,
    default: 0,
  },
  escalatedTo: {
    type: String, // could be 'department_head', 'admin'
    default: null,
  },
  slaHoursRemaining: {
    type: Number,
    default: 48,
  },
  attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
  timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
  aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  feedback: { type: mongoose.Schema.Types.Mixed, default: {} },
  submittedDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
  expectedResolution: { type: String, default: '' },
  lastUpdated: { type: String, default: '' },
}, { strict: false, timestamps: true });

// Analytical Indexes
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ category: 1, submittedDate: -1 });
complaintSchema.index({ slaState: 1 });
complaintSchema.index({ 'location.city': 1 });
complaintSchema.index({ 'citizen.email': 1 });
complaintSchema.index({ assignedOfficer: 1 });
complaintSchema.index({ status: 1 });

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

