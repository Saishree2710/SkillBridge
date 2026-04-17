const ProviderProfile = require('../models/ProviderProfile');
const { haversineDistance, calculateProximityScore } = require('../utils/haversine');

// @desc    Create or update provider profile
// @route   POST /api/provider/profile
// @access  Private (Provider only)
const upsertProviderProfile = async (req, res) => {
  try {
    const { name, serviceCategory, city, area, lat, lng, hourlyPricing, availability } = req.body;
    let profilePhoto = req.body.profilePhoto || '';

    // If a file was uploaded via multer-storage-cloudinary, req.file.path will hold the URL
    if (req.file && req.file.path) {
      profilePhoto = req.file.path;
    }

    const profileFields = {
      user: req.user._id,
      name,
      serviceCategory,
      location: { 
        city, 
        area, 
        lat: lat ? parseFloat(lat) : 0, 
        lng: lng ? parseFloat(lng) : 0 
      },
      hourlyPricing: parseFloat(hourlyPricing),
      availability: availability === 'true' || availability === true,
    };
    if (profilePhoto) profileFields.profilePhoto = profilePhoto;

    let profile = await ProviderProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update
      profile = await ProviderProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create
    profile = await ProviderProfile.create(profileFields);
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    res.json({
      success: true,
      photoUrl: req.file.path
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderProfile = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchProviders = async (req, res) => {
  try {
    const { category, city, minPrice, maxPrice, userLat, userLng } = req.query;

    let query = {};

    if (category) query.serviceCategory = category;
    if (city) query['location.city'] = { $regex: new RegExp(city, 'i') };
    if (minPrice || maxPrice) {
      query.hourlyPricing = {};
      if (minPrice) query.hourlyPricing.$gte = Number(minPrice);
      if (maxPrice) query.hourlyPricing.$lte = Number(maxPrice);
    }

    const providers = await ProviderProfile.find(query);

    // If user's location is provided, rank them based on the scoring formula
    // score = 0.4 × proximity + 0.4 × average rating + 0.2 × availability.
    // For average rating, let's max it at 5, so score out of 100 is (rating / 5) * 100.
    
    let rankedProviders = providers.map((provider) => {
      let proximityScore = 0;
      let distance = null;

      if (userLat && userLng) {
        distance = haversineDistance(
          { lat: parseFloat(userLat), lng: parseFloat(userLng) },
          { lat: provider.location.lat, lng: provider.location.lng }
        );
        proximityScore = calculateProximityScore(distance);
      }

      const ratingScore = (provider.averageRating / 5) * 100;
      const availabilityScore = provider.availability ? 100 : 0;

      const finalScore = 
        (0.4 * proximityScore) + 
        (0.4 * ratingScore) + 
        (0.2 * availabilityScore);

      return {
        ...provider._doc,
        distance,
        finalScore
      };
    });

    // Sort by finalScore descending
    rankedProviders.sort((a, b) => b.finalScore - a.finalScore);

    res.json(rankedProviders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderById = async (req, res) => {
  try {
    const provider = await ProviderProfile.findById(req.params.id).populate('user', 'name email');
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    // Increment profile views
    provider.profileViews += 1;
    await provider.save();

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upsertProviderProfile,
  getProviderProfile,
  searchProviders,
  getProviderById,
  uploadPhoto
};
