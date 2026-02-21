const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Represents a user in the Survey Management SaaS application
 *
 * Fields:
 * - name: User's full name
 * - email: User's email address (unique, lowercase)
 * - password: User's password (hashed with bcrypt)
 * - role: User's role in the system (default: 'creator')
 * - createdAt: Timestamp of account creation (auto-generated)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: [true, 'Email already registered'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['creator', 'respondent', 'admin'],
        message: 'Role must be one of: creator, respondent, admin',
      },
      default: 'creator',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Indexes for better query performance
 */
userSchema.index({ email: 1 }); // Index on email for faster lookups
userSchema.index({ createdAt: -1 }); // Index on createdAt for sorting

/**
 * Pre-save middleware to hash password
 * Hashes the password if it's new or modified
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare passwords
 * Used during login to verify user credentials
 *
 * @param {string} enteredPassword - The password provided by user at login
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword) {
    throw new Error('Password is required for comparison');
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to get user public information
 * Returns user data without sensitive information
 *
 * @returns {Object} - Public user information
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password from JSON response
  return user;
};

/**
 * Static method to find user by email
 *
 * @param {string} email - User's email address
 * @returns {Promise<User>} - User document or null
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Static method to create a new user with hashed password
 *
 * @param {Object} userData - User data object
 * @returns {Promise<User>} - Created user document
 */
userSchema.statics.createUser = async function (userData) {
  // Validate required fields
  if (!userData.name || !userData.email || !userData.password) {
    throw new Error('Name, email, and password are required');
  }

  // Check if email already exists
  const existingUser = await this.findByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Create and save new user
  const user = new this(userData);
  await user.save();
  return user;
};

module.exports = mongoose.model('User', userSchema);
