const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getUserSessions,
  getActivitySummary,
  getUserAuditTrail
} = require('../controllers/auditController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/audit/logs
// @desc    Get all audit logs with filtering and pagination
router.get('/logs', getAuditLogs);

// @route   GET /api/audit/sessions
// @desc    Get user session summaries with login times and activities
router.get('/sessions', getUserSessions);

// @route   GET /api/audit/summary
// @desc    Get activity summary grouped by user or role
router.get('/summary', getActivitySummary);

// @route   GET /api/audit/user/:userId
// @desc    Get audit trail for a specific user
router.get('/user/:userId', getUserAuditTrail);

module.exports = router;