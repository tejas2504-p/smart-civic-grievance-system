import mongoose from 'mongoose';

const slaRuleSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    unique: true,
    index: true,
  },
  deadlineHours: {
    type: Number,
    required: true,
  },
  warningHoursBefore: {
    type: Number,
    default: 4, // e.g. warn 4 hours before deadline
  },
  escalationLevels: {
    type: Number,
    default: 3, // Officer -> Dept Head -> Admin
  },
}, { timestamps: true });

export default mongoose.models.SLARule || mongoose.model('SLARule', slaRuleSchema);
