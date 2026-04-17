const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');

// @desc    Get Provider Dashboard Stats
// @route   GET /api/dashboard/provider
// @access  Private (Provider only)
const getProviderDashboard = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(200).json({ success: true, isProfileComplete: false, data: null });
    }

    const providerId = profile._id;

    // Get all bookings
    const allBookings = await Booking.find({ provider: providerId }).populate('customer', 'name');

    // Stats calculations
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    
    // Earnings: Assume average job takes provider's slotDuration (usually 1 hr), multiplied by hourly pricing
    // But since duration isn't strictly tracked per booking in this simple schema, 
    // we'll assume every completed booking equals 1 hour of `hourlyPricing` for simplicity
    const totalEarnings = completedBookings.length * profile.hourlyPricing;

    // Response Rate calculation: (Acted upon bookings / Total bookings)
    // Pending means untouched. Acted upon = Confirmed, In-Progress, Completed, Cancelled
    const actedUpon = allBookings.filter(b => b.status !== 'pending').length;
    const totalBookings = allBookings.length;
    const responseRate = totalBookings > 0 ? Math.round((actedUpon / totalBookings) * 100) : 0;

    // Earnings Chart Data (Group by Month for simple view)
    // E.g., { "Jan": 1500, "Feb": 2000 }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const earningsByMonth = {};
    
    completedBookings.forEach(b => {
      const dateStr = b.date; // format 'YYYY-MM-DD'
      if (!dateStr) return;
      const monthIndex = parseInt(dateStr.split('-')[1], 10) - 1;
      const month = monthNames[monthIndex];
      earningsByMonth[month] = (earningsByMonth[month] || 0) + profile.hourlyPricing;
    });

    const chartData = Object.keys(earningsByMonth).map(month => ({
      name: month,
      earnings: earningsByMonth[month]
    }));

    // Fill in missing months to look pretty in recharts
    const fullChartData = monthNames.map(m => ({
      name: m,
      earnings: earningsByMonth[m] || 0
    }));

    res.json({
      success: true,
      isProfileComplete: true,
      data: {
        stats: {
          totalEarnings,
          completedJobs: profile.completedJobs,
          profileViews: profile.profileViews,
          responseRate,
          trustScore: profile.trustScore,
          badges: profile.badges,
          averageRating: profile.averageRating
        },
        chartData: fullChartData,
        recentBookings: allBookings.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProviderDashboard
};
