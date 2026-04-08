const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  serviceCategory: {
    type: String,
    enum: ['Plumber', 'Electrician', 'Carpenter', 'Milkman', 'Cleaner', 'Mechanic', 'Painter', 'Other'],
    required: true
  },
  location: {
    city: { type: String, required: true },
    area: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  hourlyPricing: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  profilePhoto: {
    type: String, // URL from Cloudinary
    default: ''
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
