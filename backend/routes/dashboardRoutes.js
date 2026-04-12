const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getProviderDashboard } = require('../controllers/dashboardController');

router.get('/provider', protect, authorizeRoles('provider'), getProviderDashboard);

module.exports = router;
