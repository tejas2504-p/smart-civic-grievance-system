import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  head: {
    name: String,
    email: String,
    phone: String,
  },
  description: String,
  slaHoursDefault: {
    type: Number,
    default: 48,
  },
  activeOfficersCount: {
    type: Number,
    default: 0,
  },
  categories: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
