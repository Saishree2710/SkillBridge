const User = require('../models/User');

// @desc    Get customer profile
// @route   GET /api/customers/profile
// @access  Private (Customer only)
const getCustomerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customers/profile
// @access  Private (Customer only)
const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, email, profilePhoto } = req.body;
    
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePhoto) user.profilePhoto = profilePhoto;
    
    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload customer profile photo
// @route   POST /api/customers/upload-photo
// @access  Private (Customer only)
const uploadCustomerPhoto = async (req, res) => {
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

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerPhoto
};
