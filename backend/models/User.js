const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  microsoftId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'microsoft'], default: 'local' },
  role: { type: String, enum: ['admin', 'user', 'accountant', 'department_lead'], default: 'user' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isApproved: { type: Boolean, default: false },
  roleSelected: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
