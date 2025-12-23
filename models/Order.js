/**
 * Order Model Schema
 * 
 * PROBLEM IT SOLVES: Stores customer orders with complete order details,
 * payment information, shipping address, and order status tracking.
 * 
 * HOW IT WORKS: Each order contains order items (snapshot of products),
 * shipping address, payment details, and status. Orders are immutable
 * once placed (can't be modified, only status can be updated).
 * 
 * REAL-WORLD APPROACH: Companies like Nykaa, Amazon use similar patterns:
 * - Order items as snapshots (products may change/delete later)
 * - Status tracking for order fulfillment
 * - Payment information storage
 * - Shipping address at time of order
 * - Order history for users and admin management
 * 
 * WHY IMMUTABLE: Orders represent a transaction at a point in time.
 * Products, prices, addresses may change, but order should remain as it was.
 */

import mongoose from 'mongoose';

/**
 * Order Item Schema (Embedded in Order)
 * 
 * WHY EMBEDDED: Order items are always accessed with orders.
 * Stored as snapshot (price, name, image) because products may change/delete.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    }
  },
  {
    _id: false
  }
);

/**
 * Shipping Address Schema (Embedded in Order)
 * 
 * WHY: Store shipping address at time of order (user may change address later).
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  {
    _id: false
  }
);

/**
 * Payment Result Schema (Embedded in Order)
 * 
 * WHY: Store payment gateway response for record keeping.
 */
const paymentResultSchema = new mongoose.Schema(
  {
    id: {
      type: String // Payment intent ID from Stripe
    },
    status: {
      type: String
    },
    update_time: {
      type: String
    },
    email_address: {
      type: String
    }
  },
  {
    _id: false
  }
);

/**
 * Order Schema
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'cod'], // Stripe or Cash on Delivery
      default: 'stripe'
    },
    paymentResult: paymentResultSchema,
    paymentIntentId: {
      type: String // Store Stripe payment intent ID before payment confirmation
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: {
      type: Date
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',      // Order placed, payment pending
        'processing',   // Payment received, preparing order
        'shipped',      // Order shipped
        'delivered',    // Order delivered
        'cancelled'     // Order cancelled
      ],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

/**
 * INDEXES FOR PERFORMANCE
 */
orderSchema.index({ user: 1 }); // Fast lookup of user's orders
orderSchema.index({ orderStatus: 1 }); // Fast filtering by status

/**
 * METHOD: Calculate order totals
 * 
 * WHY: Calculate itemsPrice, taxPrice, shippingPrice, totalPrice.
 * Called during order creation to ensure accurate pricing.
 */
orderSchema.methods.calculateTotals = function () {
  // Calculate items price (sum of all order items)
  this.itemsPrice = this.orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate tax (10% of items price in India)
  this.taxPrice = Math.round(this.itemsPrice * 0.1);

  // Calculate shipping (free above 500, otherwise 50)
  this.shippingPrice = this.itemsPrice > 500 ? 0 : 50;

  // Calculate total
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
