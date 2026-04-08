const express = require('express');
const router = express.Router();
const {
  upsertProviderProfile,
  getProviderProfile,
  searchProviders
} = require('../controllers/providerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { parser } = require('../config/cloudinary');

router.post('/profile', protect, authorizeRoles('provider'), parser.single('profilePhoto'), upsertProviderProfile);
router.get('/profile', protect, authorizeRoles('provider'), getProviderProfile);

// Public route for search
// We mapped /api/public/providers to here in server.js, so this will be /api/public/providers/search if we use router.get('/search')
// Actually, let's just make it the root of public providers since in server.js we did:
// app.use('/api/public/providers', providerRoutes);
// Wait, that means /api/public/providers/profile is protected and /api/public/providers is search.
// Better to explicitly map it in server.js. In server.js we did:
// app.use('/api/public/providers', providerRoutes);
// Which is a bit overlapping. I will create a specific route for search.

router.get('/search', searchProviders);

module.exports = router;
