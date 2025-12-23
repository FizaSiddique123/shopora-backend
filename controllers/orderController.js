/**
 * Order Controller
 * 
 * PROBLEM IT SOLVES: Handles order placement, status updates, and order history.
 * Manages the complete order lifecycle from placement to delivery.
 * 
 * REAL-WORLD: Order management is critical for e-commerce operations.
 * Companies optimize for:
 * - Secure order placement
 * - Accurate order tracking
 * - Efficient order fulfillment
 * - Customer order history
 */

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { createPaymentIntent, verifyPaymentIntent } from '../utils/stripe.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 * 
 * FLOW:
 * 1. Get user's cart
 * 2. Validate cart has items
 * 3. Validate all products are in stock
 * 4. Create order with cart items (as snapshot)
 * 5. Calculate totals (items, tax, shipping, total)
 * 6. Clear cart
 * 7. Create Stripe payment intent (if payment method is Stripe)
 * 8. Return order with payment client secret
 * 
 * REAL-WORLD: This is a critical endpoint. Must be atomic (use transactions in production).
 */
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'stripe' } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address is required'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Validate all products are in stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.name} not found`
        });
      }

      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.name} is out of stock or insufficient quantity available`
        });
      }
    }

    // Create order items (snapshot of cart items)
    const orderItems = cart.items.map(item => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price, // Price snapshot from cart
      quantity: item.quantity
    }));

    // Create order
    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: 0, // Will be calculated
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: 0,
      isPaid: false,
      orderStatus: 'pending'
    });

    // Calculate totals
    order.calculateTotals();

    // If payment method is COD, mark as paid (will be paid on delivery)
    if (paymentMethod === 'cod') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.orderStatus = 'processing';
    }

    // Save order
    await order.save();

    // Clear cart
    await cart.clearCart();

    // Create Stripe payment intent if payment method is Stripe
    let paymentIntent = null;
    if (paymentMethod === 'stripe') {
      try {
        const stripeResult = await createPaymentIntent(
          order.totalPrice,
          'inr',
          {
            orderId: order._id.toString(),
            userId: req.user.id.toString()
          }
        );

        // Store payment intent ID in order for tracking
        order.paymentIntentId = stripeResult.paymentIntentId;
        await order.save();

        paymentIntent = {
          clientSecret: stripeResult.clientSecret,
          paymentIntentId: stripeResult.paymentIntentId
        };
      } catch (error) {
        // If payment intent creation fails, delete order
        await Order.findByIdAndDelete(order._id);
        return res.status(500).json({
          success: false,
          error: `Payment processing failed: ${error.message}`
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        ...(paymentIntent && { paymentIntent })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 * 
 * REAL-WORLD: Users need to see their order history.
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 * 
 * REAL-WORLD: Order detail page needs full order information.
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'orderItems.product',
      'name images'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Make sure user owns the order or is admin
    if (order.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order to paid
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 * 
 * FLOW:
 * 1. Verify payment with Stripe
 * 2. Update order payment status
 * 3. Update product stock (decrease stock)
 * 4. Mark order as processing
 * 
 * REAL-WORLD: Called after Stripe payment confirmation or via webhook.
 */
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }

    // Verify payment with Stripe (if payment method is Stripe)
    if (order.paymentMethod === 'stripe' && paymentIntentId) {
      try {
        const paymentIntent = await verifyPaymentIntent(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            error: 'Payment not successful'
          });
        }

        // Store payment result
        order.paymentResult = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString(),
          email_address: paymentIntent.receipt_email || req.user.email
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Payment verification failed: ${error.message}`
        });
      }
    }

    // Update order payment status
    order.isPaid = true;
    order.paidAt = new Date();
    order.orderStatus = 'processing';

    // Update product stock (decrease stock)
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        product.inStock = product.stock > 0;
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order payment confirmed',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admins need to update order status during fulfillment.
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.orderStatus = status;

    // If status is delivered, set deliveredAt
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 * 
 * REAL-WORLD: Admin dashboard needs to see all orders.
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};
