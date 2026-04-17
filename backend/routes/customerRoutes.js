const express = require('express');
const router = express.Router();
const {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerPhoto
} = require('../controllers/customerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.get('/profile', protect, authorizeRoles('customer'), getCustomerProfile);
router.put('/profile', protect, authorizeRoles('customer'), updateCustomerProfile);
router.post('/upload-photo', protect, authorizeRoles('customer'), upload.single('photo'), uploadCustomerPhoto);

module.exports = router;
