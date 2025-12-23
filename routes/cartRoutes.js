import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router
  .route('/')
  .get(getCart) // Get cart
  .delete(clearCart); // Clear cart

router
  .route('/items')
  .post(addToCart); // Add item to cart

router
  .route('/items/:productId')
  .put(updateCartItem) // Update item quantity
  .delete(removeFromCart); // Remove item from cart

export default router;







