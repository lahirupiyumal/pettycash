const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are not configured.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendResetOtpEmail = async (email, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Petty Cash Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>Password Reset Request</h2>
        <p>Use the OTP below to reset your password. It expires in 5 minutes.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>If you did not request this reset, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendResetOtpEmail };
