const router = require('express').Router();
const { sendOtp, verifyOtp, resetPassword } = require('../controllers/passwordResetController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
