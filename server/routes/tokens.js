const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/tokens/book
router.post('/book', protect, async (req, res) => {
  try {
    const { clinicId, reason, patientPhone } = req.body;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (!clinic.isOpen) return res.status(400).json({ message: 'Clinic is currently closed' });

    const today = new Date().toISOString().split('T')[0];
    const existingToken = await Token.findOne({
      clinic: clinicId, patient: req.user._id, date: today,
      status: { $in: ['waiting', 'in-progress'] },
    });
    if (existingToken) {
      return res.status(400).json({
        message: 'You already have an active token for this clinic today',
        token: existingToken,
      });
    }

    clinic.lastTokenIssued += 1;
    await clinic.save();

    const waitingCount = await Token.countDocuments({ clinic: clinicId, status: 'waiting', date: today });
    const estimatedTime = new Date(Date.now() + waitingCount * clinic.avgWaitTimeMinutes * 60000);

    const token = await Token.create({
      clinic: clinicId,
      patient: req.user._id,
      tokenNumber: clinic.lastTokenIssued,
      patientName: req.user.name,
      patientPhone: patientPhone || req.user.phone,
      reason: reason || 'General Checkup',
      estimatedTime,
      date: today,
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { activeTokens: token._id } });
    const populated = await Token.findById(token._id).populate('clinic', 'name address');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tokens/my
router.get('/my', protect, async (req, res) => {
  try {
    const tokens = await Token.find({ patient: req.user._id })
      .populate('clinic', 'name address specialization currentTokenNumber avgWaitTimeMinutes')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tokens/:id/status
// @desc    Clinic admin changes token status: waiting → in-progress → completed
// @access  Private (clinic admin only)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['waiting', 'in-progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const token = await Token.findById(req.params.id).populate('clinic');
    if (!token) return res.status(404).json({ message: 'Token not found' });

    // Verify requester is the clinic admin
    const clinic = await Clinic.findById(token.clinic._id);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (clinic.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized — clinic admins only' });
    }

    const prevStatus = token.status;

    // Enforce valid transitions
    const validTransitions = {
      waiting: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!validTransitions[prevStatus].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from "${prevStatus}" to "${status}"`,
      });
    }

    token.status = status;

    // When moving to in-progress: update clinic's currentTokenNumber
    if (status === 'in-progress') {
      clinic.currentTokenNumber = token.tokenNumber;
      await clinic.save();
    }

    // When completing: record served time, bump currentTokenNumber
    if (status === 'completed') {
      token.servedAt = new Date();
      if (clinic.currentTokenNumber < token.tokenNumber) {
        clinic.currentTokenNumber = token.tokenNumber;
        await clinic.save();
      }
    }

    await token.save();

    // Return enriched token with queue position info
    const today = new Date().toISOString().split('T')[0];
    const queuePosition = await Token.countDocuments({
      clinic: clinic._id,
      tokenNumber: { $lt: token.tokenNumber },
      status: 'waiting',
      date: today,
    });

    const populated = await Token.findById(token._id)
      .populate('clinic', 'name address specialization currentTokenNumber avgWaitTimeMinutes')
      .populate('patient', 'name email phone');

    res.json({ ...populated.toObject(), queuePosition: queuePosition + 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tokens/:id/cancel  (patient cancels own token)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const isPatient = token.patient.toString() === req.user._id.toString();
    // Also allow clinic admin to cancel
    const clinic = await Clinic.findById(token.clinic);
    const isAdmin = clinic && clinic.admin.toString() === req.user._id.toString();

    if (!isPatient && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (token.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed token' });
    }

    token.status = 'cancelled';
    await token.save();
    await User.findByIdAndUpdate(token.patient, { $pull: { activeTokens: token._id } });
    res.json({ message: 'Token cancelled successfully', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tokens/:id  — token detail + live queue position
router.get('/:id', protect, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate(
      'clinic', 'name address currentTokenNumber avgWaitTimeMinutes specialization isOpen'
    );
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const today = new Date().toISOString().split('T')[0];
    const ahead = await Token.countDocuments({
      clinic: token.clinic._id,
      tokenNumber: { $lt: token.tokenNumber },
      status: 'waiting',
      date: today,
    });

    res.json({ ...token.toObject(), queuePosition: ahead + 1, peopleAhead: ahead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;