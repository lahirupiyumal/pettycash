const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'department lead', 'accountant'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ['login', 'logout', 'view', 'create', 'update', 'delete', 'import', 'export', 'navigate', 'other'],
    default: 'other'
  },
  resource: {
    type: String
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionStart: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Index for efficient querying by user and time range
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ userRole: 1, createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);