const router = require('express').Router();
const passport = require('../utils/passport');
const jwt = require('jsonwebtoken');
const { register, login, getUsers, updateStatus, deleteUser } = require('../controllers/authController');
const { auth, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/', auth, admin, getUsers);
router.patch('/status', auth, admin, updateStatus);
router.delete('/:id', auth, admin, deleteUser);

// Microsoft OAuth - Step 1: Redirect to Microsoft login
router.get('/microsoft', passport.authenticate('microsoft', {
  prompt: 'select_account',
}));

// Microsoft OAuth - Step 2: Callback after Microsoft login
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    const user = req.user;

    // Check user status
    if (user.status === 'pending') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=pending`);
    }
    if (user.status === 'rejected') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=rejected`);
    }

    // Issue JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&id=${user._id}`);
  }
);

module.exports = router;
