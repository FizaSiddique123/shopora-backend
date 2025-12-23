/**
 * Authentication Controller
 * 
 * PROBLEM IT SOLVES: Handles user registration and login logic. Separates
 * business logic from routes for better code organization (MVC pattern).
 * 
 * HOW IT WORKS: 
 * - Validates input data
 * - Checks if user already exists (signup)
 * - Hashes passwords securely (done in model pre-save hook)
 * - Generates JWT tokens
 * - Sends tokens to frontend
 * 
 * REAL-WORLD APPROACH:
 * - Companies separate controllers from routes for testability and maintainability
 * - Use service layer for complex business logic (we'll add later if needed)
 * - Return consistent response format
 */

import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Register new user
 * @route   POST /api/auth/signup
 * @access  Public
 * 
 * FLOW:
 * 1. Validate input (name, email, password)
 * 2. Check if user already exists
 * 3. Create new user (password automatically hashed by model pre-save hook)
 * 4. Generate access + refresh tokens
 * 5. Set refresh token in httpOnly cookie (more secure than localStorage)
 * 6. Return access token in response
 */
export const signup = async (req, res, next) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user (password will be hashed automatically by pre-save hook)
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by model pre-save hook
      phone: phone || ''
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Set refresh token in httpOnly cookie (secure, not accessible via JavaScript)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and access token
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        accessToken
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * FLOW:
 * 1. Validate input (email, password)
 * 2. Find user by email (include password field with select('+password'))
 * 3. Check if user exists
 * 4. Compare password with hashed password using bcrypt
 * 5. Generate tokens
 * 6. Set refresh token in cookie
 * 7. Return access token
 */
export const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password (normally excluded by select: false)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Compare password using model method (uses bcrypt.compare)
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and access token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        accessToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 * 
 * WHY: Frontend needs to check if user is logged in and get user info
 * Used after page refresh to restore user session
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 * 
 * WHY: Clear refresh token cookie to invalidate session
 */
export const logout = async (req, res, next) => {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0) // Expire immediately
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};







