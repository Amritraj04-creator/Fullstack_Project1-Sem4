const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['patient', 'clinic_admin'],
      default: 'patient',
    },
    activeTokens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token',
      },
    ],
    // ── Password reset fields ──
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate a secure reset token, store its hash in the DB, return the raw token
userSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Store hashed version in DB (never store raw token)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  // Expires in 15 minutes
  this.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  return rawToken; // send this to user via email
};

module.exports = mongoose.model('User', userSchema);