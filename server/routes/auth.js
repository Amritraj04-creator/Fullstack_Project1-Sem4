const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please fill all required fields' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists with this email' });

    const user = await User.create({ name, email, password, phone });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send a password-reset email
// @access  Public
// ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Please provide your email address' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond with the same message — don't reveal whether the email exists
    const safeMsg = 'If an account with that email exists, a reset link has been sent.';

    if (!user) return res.json({ message: safeMsg });

    // Generate token and save hashed version to DB
    const rawToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL — frontend route
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetURL = `${clientURL}/reset-password/${rawToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0A0F1E, #0F2744); padding: 32px 40px; text-align: center;">
          <div style="display:inline-flex; align-items:center; gap:10px;">
            <div style="width:36px;height:36px;background:rgba(14,165,233,0.25);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:18px;">⚕️</span>
            </div>
            <span style="font-family: sans-serif; font-size: 1.25rem; font-weight: 800; color: white;">
              Queue<span style="color:#0EA5E9;">Ease</span>
            </span>
          </div>
        </div>

        <div style="padding: 40px;">
          <h2 style="margin:0 0 8px; font-size: 1.5rem; color: #0A0F1E;">Reset your password</h2>
          <p style="color: #64748B; margin: 0 0 24px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>, we received a request to reset the password for your QueueEase account.
            Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
          </p>

          <a href="${resetURL}"
             style="display:inline-block; background: linear-gradient(135deg,#0EA5E9,#0284C7);
                    color: white; text-decoration: none; font-weight: 700;
                    padding: 14px 32px; border-radius: 12px; font-size: 0.9375rem;">
            Reset Password
          </a>

          <p style="color: #94A3B8; font-size: 0.8125rem; margin: 24px 0 0; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email — your password will remain unchanged.
            <br/><br/>
            Or copy this link into your browser:<br/>
            <a href="${resetURL}" style="color:#0EA5E9; word-break:break-all;">${resetURL}</a>
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 16px 40px; font-size: 0.75rem; color: #94A3B8; text-align: center;">
          © ${new Date().getFullYear()} QueueEase. All rights reserved.
        </div>
      </div>
    `;

    await sendEmail({ to: user.email, subject: 'QueueEase — Reset Your Password', html });
    res.json({ message: safeMsg });

  } catch (error) {
    console.error('forgot-password error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/auth/reset-password/:token
// @desc    Verify a reset token is valid (before showing new-password form)
// @access  Public
// ─────────────────────────────────────────
router.get('/reset-password/:token', async (req, res) => {
  try {
    const hashed = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

    res.json({ valid: true, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @desc    Set a new password using the reset token
// @access  Public
// ─────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const hashed = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

    // Set new password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully. You can now log in.',
      token: generateToken(user._id),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/auth/profile
// ─────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('activeTokens');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/auth/profile
// ─────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) user.password = req.body.password;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
      phone: updatedUser.phone, role: updatedUser.role, token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;