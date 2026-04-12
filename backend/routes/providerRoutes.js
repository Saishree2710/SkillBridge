const express = require('express');
const router = express.Router();
const {
  upsertProviderProfile,
  getProviderProfile,
  searchProviders,
  getProviderById
} = require('../controllers/providerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { parser } = require('../config/cloudinary');

router.post('/profile', protect, authorizeRoles('provider'), parser.single('profilePhoto'), upsertProviderProfile);
router.get('/profile', protect, authorizeRoles('provider'), getProviderProfile);

// Public route for search
router.get('/search', searchProviders);

// Public route to get single provider
router.get('/:id', getProviderById);

module.exports = router;
