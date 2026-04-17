const express = require('express');
const router = express.Router();
const {
  upsertProviderProfile,
  getProviderProfile,
  searchProviders,
  getProviderById,
  uploadPhoto
} = require('../controllers/providerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Note: UsingPUT or POST for upsert profile is fine, we use POST here.
router.post('/profile', protect, authorizeRoles('provider'), upsertProviderProfile);
router.put('/profile', protect, authorizeRoles('provider'), upsertProviderProfile);
router.get('/profile', protect, authorizeRoles('provider'), getProviderProfile);

// Route for uploading photos
router.post('/upload-photo', protect, authorizeRoles('provider'), upload.single('photo'), uploadPhoto);

// Public route for search
router.get('/search', searchProviders);

// Public route to get single provider
router.get('/:id', getProviderById);

module.exports = router;
