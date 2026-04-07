const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
      default: 'waiting',
    },
    patientName: {
      type: String,
      required: true,
    },
    patientPhone: {
      type: String,
    },
    reason: {
      type: String,
      default: 'General Checkup',
    },
    estimatedTime: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    date: {
      type: String, // YYYY-MM-DD format for daily reset
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Token', tokenSchema);