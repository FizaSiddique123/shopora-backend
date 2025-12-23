/**
 * Wishlist Routes
 * 
 * PROBLEM IT SOLVES: Defines all wishlist-related API endpoints.
 * All routes require authentication (user must be logged in).
 */

import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router
  .route('/')
  .get(getWishlist) // Get wishlist
  .post(addToWishlist) // Add to wishlist
  .delete(clearWishlist); // Clear wishlist

router.get('/check/:productId', checkWishlistStatus); // Check if product in wishlist
router.delete('/:productId', removeFromWishlist); // Remove from wishlist

export default router;







