const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const { sendEmail } = require('../utils/emailService');
const User = require('../models/User');

const isValidTransition = (current, next) => {
  const transitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['in-progress', 'cancelled'], 
    'in-progress': ['completed'],
    'completed': [],
    'cancelled': []
  };
  return transitions[current] && transitions[current].includes(next);
};

// Create new booking 
const createBooking = async (req, res) => {
  try {
    const { providerId, date, timeSlot, notes } = req.body;
    const customerId = req.user.id;

    const providerProfile = await ProviderProfile.findById(providerId).populate('user');
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if slot is overlapping with another non-cancelled booking
    const existingBooking = await Booking.findOne({
      provider: providerId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This timeslot is already booked or pending' });
    }

    const booking = new Booking({
      customer: customerId,
      provider: providerId,
      date,
      timeSlot,
      notes
    });

    await booking.save();

    res.status(201).json({ message: 'Booking requested successfully', booking });

    // Send emails
    const customer = req.user;
    const providerUser = providerProfile.user;

    await sendEmail(
      customer.email,
      'Booking Request Sent',
      `Your booking request with ${providerProfile.name} on ${date} at ${timeSlot} is pending.`
    );

    await sendEmail(
      providerUser.email,
      'New Booking Request',
      `You have a new auto-generated booking request from ${customer.name} on ${date} at ${timeSlot}.`
    );

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already requested this timeslot' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Provider accept/decline or status update
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId).populate('customer').populate({
      path: 'provider',
      populate: { path: 'user' }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Role-based auth check
    const isCustomer = req.user.role === 'customer' && booking.customer._id.toString() === req.user.id;
    const isProvider = req.user.role === 'provider' && booking.provider.user._id.toString() === req.user.id;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Strict transition check
    if (!isValidTransition(booking.status, status)) {
      return res.status(400).json({ message: `Cannot transition from ${booking.status} to ${status}` });
    }

    // Role rules
    if (isCustomer && status !== 'cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel a booking' });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: 'Booking updated successfully', booking });

    // Status notifications
    await sendEmail(
      booking.customer.email,
      `Booking Status update: ${status}`,
      `Your booking on ${booking.date} at ${booking.timeSlot} with ${booking.provider.name} is now ${status}.`
    );

    // If completed, increment completedJobs and assess badges
    if (status === 'completed') {
      const ProviderProfile = require('../models/ProviderProfile');
      const { evaluateBadges } = require('../services/reputationService');
      
      const profile = await ProviderProfile.findById(booking.provider._id);
      if (profile) {
        profile.completedJobs += 1;
        await profile.save();
        await evaluateBadges(profile._id);
      }
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookings for provider
const getProviderBookings = async (req, res) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });
    if (!providerProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const bookings = await Booking.find({ provider: providerProfile._id }).populate('customer', 'name email phone');
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookings for customer
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id }).populate({
      path: 'provider',
      populate: { path: 'user', select: 'name email phone' }
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  updateBookingStatus,
  getProviderBookings,
  getCustomerBookings
};
