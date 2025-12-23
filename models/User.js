/**
 * User Model Schema
 * 
 * PROBLEM IT SOLVES: Defines the structure and validation rules for user data.
 * This ensures data consistency and prevents invalid data from entering the database.
 * 
 * HOW IT WORKS: Mongoose schema defines fields with types, validation, and default values.
 * Methods are attached to schema for password hashing and JWT token generation.
 * 
 * REAL-WORLD APPROACH: Companies use similar schemas with:
 * - Password hashing before saving (never store plain passwords)
 * - Role-based access control (user/admin)
 * - Timestamps for audit trails
 * - Methods for authentication (comparePassword, generateTokens)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    avatar: {
      type: String, // Cloudinary URL
      default: ''
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

/**
 * PRE-SAVE HOOK: Hash password before saving
 * 
 * WHY: Security best practice - never store plain text passwords.
 * bcrypt hashes passwords with a salt, making them nearly impossible to reverse.
 * 
 * HOW: Runs before every save operation. Only hashes if password was modified.
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password with cost factor of 12 (higher = more secure but slower)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * INSTANCE METHOD: Compare entered password with hashed password
 * 
 * WHY: Need to verify passwords during login without storing plain text.
 * 
 * HOW: bcrypt.compare() securely compares plain password with hash.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * INSTANCE METHOD: Generate JWT Access Token
 * 
 * WHY: Access tokens are short-lived (15min) for security. If stolen, they expire quickly.
 * Contains user ID and role for authorization.
 */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { 
      userId: this._id,
      role: this.role 
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

/**
 * INSTANCE METHOD: Generate JWT Refresh Token
 * 
 * WHY: Refresh tokens are long-lived (7 days) and stored in httpOnly cookies.
 * Used to get new access tokens without re-login. More secure than storing in localStorage.
 */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const User = mongoose.model('User', userSchema);

export default User;

