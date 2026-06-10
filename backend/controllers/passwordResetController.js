const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendResetOtpEmail } = require('../config/email');

const OTP_EXPIRY_MINUTES = 5;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    if (user.authProvider === 'microsoft' && !user.password) {
      return res.status(400).json({ message: 'This account uses Microsoft sign in.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });
    await sendResetOtpEmail(email, otp);

    return res.json({ message: 'OTP sent successfully. Please check your email.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to send OTP.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be 6 digits.' });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return res.json({ message: 'OTP verified successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to verify OTP.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password, confirmPassword } = req.body;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!passwordRegex.test(password || '')) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const otpRecord = await OTP.findOne({ email, isVerified: true });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Please verify your OTP before resetting your password.' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.authProvider = 'local';
    await user.save();

    await OTP.deleteMany({ email });

    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to reset password.' });
  }
};
