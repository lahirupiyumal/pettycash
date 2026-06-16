const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @desc    Get all audit logs (Admin only)
// @route   GET /api/audit/logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userRole,
      actionType,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter query
    const filter = {};

    if (userRole) {
      filter.userRole = userRole;
    }

    if (actionType) {
      filter.actionType = actionType;
    }

    if (userId) {
      filter.user = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user session summary (login times and activities)
// @route   GET /api/audit/sessions
// @access  Private/Admin
const getUserSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userRole,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter for login events
    const loginFilter = { actionType: 'login' };

    if (userRole) {
      loginFilter.userRole = userRole;
    }

    if (startDate || endDate) {
      loginFilter.createdAt = {};
      if (startDate) {
        loginFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        loginFilter.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      loginFilter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get login events
    const loginEvents = await AuditLog.find(loginFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // For each login, find subsequent activities until logout or next login
    const sessions = await Promise.all(
      loginEvents.map(async (login) => {
        // Find activities after this login
        const activities = await AuditLog.find({
          user: login.user,
          createdAt: { $gt: login.createdAt },
          actionType: { $ne: 'login' }
        })
          .sort({ createdAt: 1 })
          .limit(10)
          .lean();

        // Find logout event if exists
        const logout = await AuditLog.findOne({
          user: login.user,
          actionType: 'logout',
          createdAt: { $gt: login.createdAt }
        })
          .sort({ createdAt: 1 })
          .lean();

        const sessionEnd = logout?.createdAt || activities[activities.length - 1]?.createdAt || new Date();
        const duration = Math.round((sessionEnd - login.createdAt) / 60000); // in minutes

        return {
          _id: login._id,
          user: login.user,
          userName: login.userName,
          userEmail: login.userEmail,
          userRole: login.userRole,
          loginTime: login.createdAt,
          logoutTime: logout?.createdAt || null,
          duration: logout ? Math.round((logout.createdAt - login.createdAt) / 60000) : duration,
          ipAddress: login.ipAddress,
          activities: activities.slice(0, 5).map(a => ({
            time: a.createdAt,
            action: a.action,
            actionType: a.actionType
          })),
          activityCount: activities.length
        };
      })
    );

    const total = await AuditLog.countDocuments(loginFilter);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get User Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get activity summary by user
// @route   GET /api/audit/summary
// @access  Private/Admin
const getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'userRole' } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const groupField = groupBy === 'user' ? '$user' : `$${groupBy}`;

    const summary = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          totalActions: { $sum: 1 },
          logins: {
            $sum: { $cond: [{ $eq: ['$actionType', 'login'] }, 1, 0] }
          },
          logouts: {
            $sum: { $cond: [{ $eq: ['$actionType', 'logout'] }, 1, 0] }
          },
          views: {
            $sum: { $cond: [{ $eq: ['$actionType', 'view'] }, 1, 0] }
          },
          creates: {
            $sum: { $cond: [{ $eq: ['$actionType', 'create'] }, 1, 0] }
          },
          updates: {
            $sum: { $cond: [{ $eq: ['$actionType', 'update'] }, 1, 0] }
          },
          deletes: {
            $sum: { $cond: [{ $eq: ['$actionType', 'delete'] }, 1, 0] }
          },
          imports: {
            $sum: { $cond: [{ $eq: ['$actionType', 'import'] }, 1, 0] }
          },
          firstActivity: { $min: '$createdAt' },
          lastActivity: { $max: '$createdAt' },
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' }
        }
      },
      { $sort: { totalActions: -1 } }
    ]);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get Activity Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single user's audit trail
// @route   GET /api/audit/user/:userId
// @access  Private/Admin
const getUserAuditTrail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 100, startDate, endDate } = req.query;

    const filter = { user: userId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total, user] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter),
      User.findById(userId).select('name email role').lean()
    ]);

    res.json({
      success: true,
      data: logs,
      user,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get User Audit Trail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAuditLogs,
  getUserSessions,
  getActivitySummary,
  getUserAuditTrail
};