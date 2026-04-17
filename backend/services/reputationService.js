const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const recalculateTrustScore = async (providerId) => {
  try {
    const profile = await ProviderProfile.findById(providerId);
    if (!profile) return;

    
    const ratingFactor = (profile.averageRating / 5) * 50;

    const jobsFactor = Math.min((profile.completedJobs / 50) * 25, 25);

    const bookings = await Booking.find({ provider: providerId, status: 'completed' });
    const uniqueCustomers = new Set(bookings.map(b => b.customer.toString())).size;
    const totalCompleted = profile.completedJobs;
    
    let repeatFactor = 0;
    if (totalCompleted > 0) {
      const repeatBookings = totalCompleted - uniqueCustomers; 
      const repeatRate = repeatBookings / totalCompleted;
      repeatFactor = Math.min((repeatRate / 0.3) * 25, 25);
    }

    const newScore = Math.round(ratingFactor + jobsFactor + repeatFactor);
    profile.trustScore = newScore;
    await profile.save();

  } catch (error) {
    console.error('Error recalculating trust score:', error);
  }
};

const evaluateBadges = async (providerId) => {
  try {
    const profile = await ProviderProfile.findById(providerId);
    if (!profile) return;

    let newBadges = [...profile.badges];

    if (profile.completedJobs >= 10 && !newBadges.includes('10 Jobs Done')) {
      newBadges.push('10 Jobs Done');
    }
    if (profile.completedJobs >= 50 && !newBadges.includes('50 Jobs Done')) {
      newBadges.push('50 Jobs Done');
    }
    if (profile.completedJobs >= 100 && !newBadges.includes('100 Jobs Done')) {
      newBadges.push('100 Jobs Done');
    }
    if (profile.averageRating >= 4.5 && profile.totalReviews >= 3 && !newBadges.includes('Top Rated')) {
      newBadges.push('Top Rated');
    }
    // Remove Top Rated if average drops
    if (profile.averageRating < 4.5 && newBadges.includes('Top Rated')) {
      newBadges = newBadges.filter(b => b !== 'Top Rated');
    }

    profile.badges = newBadges;
    await profile.save();

  } catch (error) {
    console.error('Error evaluating badges:', error);
  }
};

module.exports = {
  recalculateTrustScore,
  evaluateBadges
};
