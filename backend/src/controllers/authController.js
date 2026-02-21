const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Register a new user
 * Creates a new user account with hashed password
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return sendError(res, 'Email already registered', 400);
    }

    // Create new user using static method
    const user = await User.createUser({
      name,
      email,
      password,
    });

    // Generate token (password is already hashed at this point)
    const token = generateToken(user._id, user.email, user.role);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 'Email already registered', 400);
    }
    sendError(res, error.message, 500);
  }
};

/**
 * Login user
 * Authenticates user with email and password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    // Find user and include password field (password is hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check password using bcrypt comparison
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
      'Login successful',
      200
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * Get user profile
 * Returns current authenticated user's profile information
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * Update user profile
 * Allows user to update their name
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name) {
      return sendError(res, 'Name is required', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      'Profile updated successfully'
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * Change password
 * Allows user to change their password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    // Get user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
