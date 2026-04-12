const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const { recalculateTrustScore, evaluateBadges } = require('../services/reputationService');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = async (req, res) => {
  try {
    const { bookingId, providerId, rating, comment } = req.body;
    const customerId = req.user.id;

    // Verify booking is completed and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: customerId,
      provider: providerId,
      status: 'completed'
    });

    if (!booking) {
      return res.status(400).json({ message: 'You can only review a completed booking' });
    }

    // Check for existing review (redundant to DB index, but good for custom error)
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    const review = new Review({
      booking: bookingId,
      customer: customerId,
      provider: providerId,
      rating,
      comment
    });

    await review.save();

    // Recalculate Provider's average rating
    const allReviews = await Review.find({ provider: providerId });
    const avgRating = allReviews.reduce((acc, current) => acc + current.rating, 0) / allReviews.length;

    const profile = await ProviderProfile.findById(providerId);
    if (profile) {
      profile.averageRating = avgRating;
      profile.totalReviews = allReviews.length;
      await profile.save();

      // Trigger Reputation engine
      await recalculateTrustScore(providerId);
      await evaluateBadges(providerId);
    }

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/public/reviews/:providerId
// @access  Public
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReview,
  getProviderReviews
};
