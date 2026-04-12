const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { createReview, getProviderReviews } = require('../controllers/reviewController');

// Private route for customer
router.post('/', protect, authorizeRoles('customer'), createReview);

// Public route for fetching reviews
router.get('/public/:providerId', getProviderReviews);

module.exports = router;
