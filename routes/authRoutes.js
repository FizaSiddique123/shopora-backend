/**
 * Authentication Routes
 * 
 * PROBLEM IT SOLVES: Defines API endpoints for authentication.
 * Separates route definitions from business logic (controllers).
 * 
 * HOW IT WORKS: Express router defines HTTP methods and paths,
 * applies validation middleware, and connects to controllers.
 * 
 * REAL-WORLD: This separation allows:
 * - Easy route changes without touching business logic
 * - Middleware reuse across routes
 * - Clear API documentation
 */

import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  getMe,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Validation Rules
 * 
 * WHY: Validate input before it reaches controller.
 * Prevents invalid data from entering database.
 * 
 * HOW: express-validator checks data types, formats, lengths
 */
const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;







