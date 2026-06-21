const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/audit');

const microsoftScopes = ['openid', 'profile', 'email', 'User.Read'];

const getBackendUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

const createAuthToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
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
    joinedDate: user.createdAt,
  },
});

const getMicrosoftClient = () => new ConfidentialClientApplication({
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  },
});

const createState = () => jwt.sign(
  { redirectTo: `${getFrontendUrl()}/login` },
  process.env.JWT_SECRET,
  { expiresIn: '10m' }
);

const verifyState = (state) => {
  try {
    return jwt.verify(state, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const getMicrosoftEmail = (claims = {}) => (
  claims.preferred_username || claims.email || claims.upn || claims.unique_name || ''
).trim().toLowerCase();

const getMicrosoftName = (claims = {}, email = '') => (
  claims.name
  || [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim()
  || email
  || 'Microsoft User'
);

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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Log login event
    createAuditLog(
      user,
      'User logged in',
      'login',
      `Login via ${req.body.email}`,
      { method: 'local' },
      req
    ).catch(err => console.error('Audit log error:', err));
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, joinedDate: user.createdAt } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.microsoftLogin = async (req, res) => {
  try {
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_TENANT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent('Microsoft login is not configured on the server.')}`);
    }

    const authUrl = await getMicrosoftClient().getAuthCodeUrl({
      scopes: microsoftScopes,
      redirectUri: `${getBackendUrl()}/api/auth/microsoft/callback`,
      state: createState(),
    });

    return res.redirect(authUrl);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to start Microsoft login.' });
  }
};

exports.microsoftCallback = async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code) {
      return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent('Microsoft login was not completed.')}`);
    }

    const stateData = verifyState(state);
    const redirectTo = stateData?.redirectTo || `${getFrontendUrl()}/login`;

    const tokenResponse = await getMicrosoftClient().acquireTokenByCode({
      code,
      scopes: microsoftScopes,
      redirectUri: `${getBackendUrl()}/api/auth/microsoft/callback`,
    });

    const claims = tokenResponse?.idTokenClaims || {};
    const microsoftId = claims.oid || claims.sub || claims.objectid || '';
    const email = getMicrosoftEmail(claims);
    const name = getMicrosoftName(claims, email);

    if (!email && !microsoftId) {
      return res.redirect(`${redirectTo}?error=${encodeURIComponent('Unable to read Microsoft account details.')}`);
    }

    let user = null;
    if (microsoftId) {
      user = await User.findOne({ microsoftId });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        password: '',
        microsoftId,
        authProvider: 'microsoft',
        role: 'user',
        status: 'approved',
      });
    } else {
      const updates = {};
      if (microsoftId && !user.microsoftId) updates.microsoftId = microsoftId;
      if (user.authProvider !== 'microsoft') updates.authProvider = 'microsoft';
      if (!user.name || user.name === user.email) updates.name = name;
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    const authPayload = createAuthResponse(user);
    const encoded = Buffer.from(JSON.stringify(authPayload)).toString('base64url');
    
    // Log Microsoft login event
    createAuditLog(
      user,
      'User logged in via Microsoft',
      'login',
      `Login via Microsoft: ${email}`,
      { method: 'microsoft', microsoftId: claims.oid },
      req
    ).catch(err => console.error('Audit log error:', err));
    
    return res.redirect(`${redirectTo}?auth=${encoded}`);
  } catch (err) {
    return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent(err.message || 'Microsoft login failed.')}`);
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
      const user = await User.findById(req.user.id).select('name email role').lean();
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
