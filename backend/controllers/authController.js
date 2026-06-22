const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/audit');

const createAuthToken = (user) => jwt.sign(
  { id: user._id, role: user.role, serviceNumber: user.serviceNumber },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

const createAuthResponse = (user) => ({
  token: createAuthToken(user),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    serviceNumber: user.serviceNumber,
    joinedDate: user.createdAt,
  },
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role: requestedRole } = req.body;

    // Automatically set role and status for admin, else use requested role or default to user
    const isAdmin = email === 'admin@gmail.com';
    const role = isAdmin ? 'admin' : (['accountant', 'department_lead'].includes(requestedRole) ? requestedRole : 'user');
    const status = isAdmin ? 'approved' : 'pending';

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, status, authProvider: 'local', roleSelected: true });
    res.status(201).json({ message: isAdmin ? 'Admin account created' : 'Registration successful. Waiting for admin approval.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account access has been denied.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, serviceNumber: user.serviceNumber }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Log login event
    createAuditLog(
      user,
      'User logged in',
      'login',
      `Login via ${req.body.email}`,
      { method: 'local' },
      req
    ).catch(err => console.error('Audit log error:', err));

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, serviceNumber: user.serviceNumber, joinedDate: user.createdAt } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updateData = { status };
    if (status === 'approved') {
      updateData.isApproved = true;
    } else {
      updateData.isApproved = false;
    }
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.selectRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required.' });
    }
    if (!['user', 'accountant', 'department_lead'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'Role can only be selected for pending accounts.' });
    }
    user.role = role;
    user.roleSelected = true;
    await user.save();
    return res.json({ message: 'Role selected successfully. Your account is pending admin approval.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to select role.' });
  }
};

// @desc    Logout user and log the event
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Log logout event if user is authenticated
    if (req.user) {
      // Fetch full user data for audit log (JWT only contains id and role)
      const user = await User.findById(req.user.id).select('name email role serviceNumber').lean();
      if (user) {
        createAuditLog(
          user,
          'User logged out',
          'logout',
          'User session ended',
          { method: 'api' },
          req
        ).catch(err => console.error('Logout audit log error:', err));
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
