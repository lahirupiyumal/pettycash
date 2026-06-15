const AuditLog = require('../models/AuditLog');

// Middleware to log user actions
const auditLog = (action, actionType = 'other', resource = null) => {
  return async (req, res, next) => {
    // Store original send to capture response
    const originalSend = res.send;
    
    // Attach audit info to request for later use
    req.auditInfo = {
      action,
      actionType,
      resource
    };

    // Continue to next middleware/route
    next();
  };
};

// Function to create audit log entry (to be called after authentication)
const createAuditLog = async (userData, action, actionType, details = null, metadata = null, req = null) => {
  try {
    const auditEntry = new AuditLog({
      user: userData._id || userData.id,
      userName: userData.name,
      userEmail: userData.email,
      userRole: userData.role,
      action,
      actionType,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get?.('User-Agent') || null,
      sessionStart: new Date(),
      metadata
    });
    
    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Audit Log Error:', error);
    // Don't fail the request if audit logging fails
    return null;
  }
};

// Middleware to automatically log route access
const logRouteAccess = (actionType = 'navigate') => {
  return async (req, res, next) => {
    if (req.user) {
      // Log in background (don't wait)
      createAuditLog(
        req.user,
        `Accessed ${req.path}`,
        actionType,
        `${req.method} ${req.originalUrl}`,
        { route: req.path, method: req.method },
        req
      ).catch(err => console.error('Route audit log error:', err));
    }
    next();
  };
};

module.exports = {
  auditLog,
  createAuditLog,
  logRouteAccess
};