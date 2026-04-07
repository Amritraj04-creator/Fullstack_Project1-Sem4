const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const Token = require('../models/Token');
const { protect } = require('../middleware/auth');

// @route   GET /api/clinics
router.get('/', async (req, res) => {
  try {
    const { city, specialization, search } = req.query;
    let filter = {};
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (search) filter.name = new RegExp(search, 'i');
    const clinics = await Clinic.find(filter).populate('admin', 'name email').sort({ createdAt: -1 });
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/clinics/nearby
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'Coordinates required' });
    const clinics = await Clinic.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate('admin', 'name email');
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/clinics/my-clinic
// @desc    Get the clinic owned by logged-in user + today's stats
// @access  Private (clinic_admin)
router.get('/my-clinic', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ admin: req.user._id }).populate('admin', 'name email');
    if (!clinic) return res.status(404).json({ message: 'No clinic found for this account' });

    const today = new Date().toISOString().split('T')[0];
    const [waitingCount, inProgressCount, completedToday, cancelledToday, totalTokensAllTime] =
      await Promise.all([
        Token.countDocuments({ clinic: clinic._id, status: 'waiting', date: today }),
        Token.countDocuments({ clinic: clinic._id, status: 'in-progress', date: today }),
        Token.countDocuments({ clinic: clinic._id, status: 'completed', date: today }),
        Token.countDocuments({ clinic: clinic._id, status: 'cancelled', date: today }),
        Token.countDocuments({ clinic: clinic._id }),
      ]);

    res.json({
      ...clinic.toObject(),
      stats: {
        waitingCount,
        inProgressCount,
        completedToday,
        cancelledToday,
        totalTokensAllTime,
        totalToday: waitingCount + inProgressCount + completedToday + cancelledToday,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/clinics/my-clinic/history
// @desc    Get token history for last 7 days
// @access  Private (clinic_admin)
router.get('/my-clinic/history', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ admin: req.user._id });
    if (!clinic) return res.status(404).json({ message: 'No clinic found' });

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const history = await Promise.all(
      days.map(async (date) => {
        const [completed, cancelled, waiting] = await Promise.all([
          Token.countDocuments({ clinic: clinic._id, status: 'completed', date }),
          Token.countDocuments({ clinic: clinic._id, status: 'cancelled', date }),
          Token.countDocuments({ clinic: clinic._id, status: 'waiting', date }),
        ]);
        return { date, completed, cancelled, waiting, total: completed + cancelled + waiting };
      })
    );

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/clinics/:id
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id).populate('admin', 'name email');
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    const today = new Date().toISOString().split('T')[0];
    const waitingCount = await Token.countDocuments({ clinic: req.params.id, status: 'waiting', date: today });
    res.json({ ...clinic.toObject(), waitingCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/clinics/register
router.post('/register', protect, async (req, res) => {
  try {
    const { name, registrationNumber, specialization, address, phone, email, openTime, closeTime, lat, lng } = req.body;
    const existing = await Clinic.findOne({ registrationNumber });
    if (existing) return res.status(400).json({ message: 'Clinic with this registration number already exists' });

    const clinic = await Clinic.create({
      name, registrationNumber, specialization, address, phone, email, openTime, closeTime,
      admin: req.user._id,
      location: { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0] },
    });

    await require('../models/User').findByIdAndUpdate(req.user._id, { role: 'clinic_admin' });
    res.status(201).json(clinic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/clinics/:id
// @desc    Update clinic details (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (clinic.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const { name, specialization, phone, email, openTime, closeTime, avgWaitTimeMinutes, address } = req.body;
    if (name) clinic.name = name;
    if (specialization) clinic.specialization = specialization;
    if (phone) clinic.phone = phone;
    if (email) clinic.email = email;
    if (openTime) clinic.openTime = openTime;
    if (closeTime) clinic.closeTime = closeTime;
    if (avgWaitTimeMinutes) clinic.avgWaitTimeMinutes = parseInt(avgWaitTimeMinutes);
    if (address) clinic.address = { ...clinic.address.toObject(), ...address };

    const updated = await clinic.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/clinics/:id/toggle
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (clinic.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    clinic.isOpen = !clinic.isOpen;
    await clinic.save();
    res.json(clinic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/clinics/:id/reset-queue
// @desc    Reset today's token queue
// @access  Private (clinic admin)
router.put('/:id/reset-queue', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
    if (clinic.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    clinic.currentTokenNumber = 0;
    clinic.lastTokenIssued = 0;
    await clinic.save();

    const today = new Date().toISOString().split('T')[0];
    await Token.updateMany(
      { clinic: clinic._id, date: today, status: { $in: ['waiting', 'in-progress'] } },
      { status: 'cancelled' }
    );

    res.json({ message: 'Queue reset successfully', clinic });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/clinics/:id/queue
router.get('/:id/queue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tokens = await Token.find({
      clinic: req.params.id,
      date: today,
      status: { $in: ['waiting', 'in-progress'] },
    }).populate('patient', 'name phone').sort({ tokenNumber: 1 });
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;