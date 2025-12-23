/**
 * Product Routes
 * 
 * PROBLEM IT SOLVES: Defines all product-related API endpoints.
 * Separates route definitions from business logic.
 * 
 * REAL-WORLD: Routes are thin - they just:
 * - Define HTTP methods and paths
 * - Apply validation middleware
 * - Call controllers
 * - Apply auth middleware where needed
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getCategories,
  getBrands,
  getFeaturedProducts,
  getBestsellerProducts
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * Validation Rules
 */
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn([
      'Makeup',
      'Skincare',
      'Haircare',
      'Fragrance',
      'Bath & Body',
      'Tools & Brushes',
      'Men',
      'Appliances'
    ])
    .withMessage('Invalid category'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
];

const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ max: 500 })
    .withMessage('Review comment cannot exceed 500 characters')
];

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestsellerProducts);
router.get('/:id', getProductById);

// Protected routes (require authentication)
router.post('/:id/reviews', protect, reviewValidation, createProductReview);

// Admin routes (require authentication + admin role)
router.post('/', protect, authorize('admin'), productValidation, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;







