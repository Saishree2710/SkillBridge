const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createBooking,
  updateBookingStatus,
  getProviderBookings,
  getCustomerBookings
} = require('../controllers/bookingController');

// Customer routes
router.post('/', protect, authorizeRoles('customer'), createBooking);
router.get('/customer', protect, authorizeRoles('customer'), getCustomerBookings);

// Provider routes
router.get('/provider', protect, authorizeRoles('provider'), getProviderBookings);

// Shared route (Customers can cancel, Providers can accept/decline/etc)
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
