const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createReview, getProviderReviews, getReviewByBooking } = require('../controllers/reviewController');

// Private route for customer
router.post('/', protect, authorizeRoles('customer'), createReview);
router.get('/booking/:bookingId', protect, authorizeRoles('customer'), getReviewByBooking);

// Public route for fetching reviews
router.get('/public/:providerId', getProviderReviews);

module.exports = router;
