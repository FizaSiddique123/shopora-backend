/**
 * Wishlist Controller
 * 
 * PROBLEM IT SOLVES: Handles wishlist operations (add/remove products).
 * Allows users to save products for later purchase.
 * 
 * REAL-WORLD: Wishlists are important for:
 * - Conversion optimization (save for later)
 * - User engagement
 * - Price drop notifications
 * - Quick add to cart
 */

import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 * 
 * REAL-WORLD: Populate products to show full product details in wishlist page.
 */
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products', 'name price images category brand inStock');

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 * 
 * FLOW:
 * 1. Validate product exists
 * 2. Get or create wishlist
 * 3. Add product (skip if already exists)
 * 4. Return updated wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id });
    }

    // Check if already in wishlist
    const alreadyExists = wishlist.hasProduct(productId);

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        error: 'Product already in wishlist'
      });
    }

    // Add product
    await wishlist.addProduct(productId);
    await wishlist.populate('products', 'name price images category brand inStock');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found'
      });
    }

    await wishlist.removeProduct(productId);
    await wishlist.populate('products', 'name price images category brand inStock');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/wishlist/check/:productId
 * @access  Private
 * 
 * WHY: Frontend needs to check wishlist status to show heart icon state.
 */
export const checkWishlistStatus = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    const isInWishlist = wishlist ? wishlist.hasProduct(productId) : false;

    res.status(200).json({
      success: true,
      data: {
        isInWishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear entire wishlist
 * @route   DELETE /api/wishlist
 * @access  Private
 */
export const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found'
      });
    }

    await wishlist.clearWishlist();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      data: {
        wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};







