// backend/controllers/authController.js
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { generateToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Test database connection
// @route   GET /api/auth/test-db
// @access  Public
export const testDatabase = async (req, res) => {
  try {
    // Try to count users in database
    const userCount = await User.countDocuments();
    console.log('Database test - User count:', userCount);
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    console.log('📝 Register request received:', {
      body: { ...req.body, password: '***hidden***' },
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, email, phone, password, role } = req.body;

    console.log('🔍 Checking if user exists with email:', email);
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email',
      });
    }

    console.log('✅ User does not exist, creating new user...');
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });
    
    console.log('✅ User created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    console.log('Login attempt with data:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both email and password',
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated',
      });
    }

    // Compare passwords
    let isMatch;
    try {
      isMatch = await user.comparePassword(password);
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Server error during password comparison',
      });
    }
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log(`Incorrect password for user: ${email}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    console.log('Last login updated');

    // Generate token
    const token = generateToken(user._id);
    console.log('Token generated');

    // Prepare user data to send back (remove sensitive data)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      kycStatus: user.kycStatus,
      restaurantId: user.restaurantId,
      wallet: user.wallet,
    };

    console.log('Login successful for user:', userData.email);
    
    res.json({
      status: 'success',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during login',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profileImage },
      { new: true, runValidators: true },
    );

    res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};

// @desc    Upload KYC documents
// @route   POST /api/auth/upload-kyc
// @access  Private
export const uploadKYC = async (req, res) => {
  try {
    console.log('📤 KYC upload request received');
    console.log('📋 Request headers:', req.headers['content-type']);
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📋 Request files:', req.files);
    console.log('📋 File info:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a document',
      });
    }

    const user = await User.findById(req.user.id);
    console.log('📋 User found:', user.email);

    try {
      // Upload file to Cloudinary
      console.log('☁️ Uploading to Cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'kyc-documents',
        resource_type: 'auto',
      });
      console.log('✅ Cloudinary upload successful:', result.secure_url);

      // Save document URL
      user.kycDocuments = user.kycDocuments || [];
      user.kycDocuments.push({
        type: req.file.fieldname,
        url: result.secure_url,
      });

      user.kycStatus = 'pending';
      await user.save();
      console.log('✅ User updated with KYC document');

      res.json({
        status: 'success',
        message: 'KYC documents uploaded successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          kycStatus: user.kycStatus,
          kycDocuments: user.kycDocuments
        },
      });

    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
      
      // Fallback: Save file info without Cloudinary upload
      console.log('💾 Saving without Cloudinary upload...');
      user.kycDocuments = user.kycDocuments || [];
      user.kycDocuments.push({
        type: req.file.fieldname,
        url: `local://uploads/${req.file.filename}`, // Local file reference
      });

      user.kycStatus = 'pending';
      await user.save();
      console.log('✅ User updated with local file reference');

      res.json({
        status: 'success',
        message: 'KYC documents uploaded successfully (stored locally)',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          kycStatus: user.kycStatus,
          kycDocuments: user.kycDocuments
        },
      });
    }

  } catch (error) {
    console.error('❌ KYC upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with this email',
      });
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    res.json({
      status: 'success',
      message: 'Password reset email sent',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process request',
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    // TODO: Implement password reset logic
    res.json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    });
  }
};
