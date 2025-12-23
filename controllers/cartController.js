import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 * 
 * REAL-WORLD: Cart is always loaded on cart page, checkout page.
 * Populate products to get full product details.
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name images price stock inStock');

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      data: {
        cart
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 * 
 * FLOW:
 * 1. Validate product exists and is in stock
 * 2. Get or create user's cart
 * 3. Add item (or update quantity if exists)
 * 4. Return updated cart
 * 
 * REAL-WORLD: This is one of the most important endpoints for conversion.
 * Must be fast and reliable.
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

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

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id });
    }

    // Add item to cart (handles quantity updates and stock checks)
    await cart.addItem(productId, quantity);

    // Populate product details for response
    await cart.populate('items.product', 'name images price stock inStock');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: {
        cart
      }
    });
  } catch (error) {
    // Handle specific error messages from cart methods
    if (error.message.includes('out of stock') || error.message.includes('available in stock')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/items/:productId
 * @access  Private
 * 
 * REAL-WORLD: Users frequently update quantities in cart.
 * Must validate stock availability.
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    // Update quantity (handles stock checks and removal if quantity is 0)
    await cart.updateItemQuantity(productId, quantity);
    await cart.populate('items.product', 'name images price stock inStock');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: {
        cart
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('available in stock')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:productId
 * @access  Private
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    await cart.removeItem(productId);
    await cart.populate('items.product', 'name images price stock inStock');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        cart
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 * 
 * REAL-WORLD: Useful after order placement or user action.
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: {
        cart
      }
    });
  } catch (error) {
    next(error);
  }
};







