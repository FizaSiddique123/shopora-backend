/**
 * Wishlist Model Schema
 * 
 * PROBLEM IT SOLVES: Stores user's wishlist (favorite products).
 * Allows users to save products for later purchase.
 * 
 * HOW IT WORKS: One-to-one relationship with User. Wishlist contains
 * array of product references.
 * 
 * REAL-WORLD APPROACH: Companies like Nykaa, Amazon use wishlists for:
 * - Save for later functionality
 * - Price drop notifications
 * - Quick add to cart from wishlist
 * - Sharing wishlists with others
 * 
 * DESIGN DECISION: Simple array of product references (not embedded)
 * because products are already in Product collection, and we want
 * to avoid duplication. Can populate products when needed.
 */

import mongoose from 'mongoose';

/**
 * Wishlist Schema
 * 
 * RELATIONSHIP: One wishlist per user (one-to-one)
 * Stores array of product references
 */
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // One wishlist per user
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * INDEX FOR PERFORMANCE
 * 
 * WHY: Fast lookup of user's wishlist by user ID
 */
wishlistSchema.index({ user: 1 });

/**
 * METHOD: Add product to wishlist
 * 
 * WHY: Encapsulates logic to avoid duplicate products.
 * 
 * HOW: 
 * 1. Check if product already in wishlist
 * 2. If not, add product ID
 * 3. Save wishlist
 */
wishlistSchema.methods.addProduct = function (productId) {
  // Check if product already exists
  const exists = this.products.some(
    (id) => id.toString() === productId.toString()
  );

  if (!exists) {
    this.products.push(productId);
    return this.save();
  }

  return Promise.resolve(this); // Already exists, return without saving
};

/**
 * METHOD: Remove product from wishlist
 * 
 * WHY: Clean removal of products.
 */
wishlistSchema.methods.removeProduct = function (productId) {
  this.products = this.products.filter(
    (id) => id.toString() !== productId.toString()
  );
  return this.save();
};

/**
 * METHOD: Check if product is in wishlist
 * 
 * WHY: Utility method for frontend to show wishlist status.
 */
wishlistSchema.methods.hasProduct = function (productId) {
  return this.products.some(
    (id) => id.toString() === productId.toString()
  );
};

/**
 * METHOD: Clear wishlist
 * 
 * WHY: Allow users to clear entire wishlist.
 */
wishlistSchema.methods.clearWishlist = function () {
  this.products = [];
  return this.save();
};

/**
 * STATIC METHOD: Get or create wishlist for user
 * 
 * WHY: Utility method to ensure user always has a wishlist.
 */
wishlistSchema.statics.getOrCreateWishlist = async function (userId) {
  let wishlist = await this.findOne({ user: userId });
  
  if (!wishlist) {
    wishlist = await this.create({ user: userId });
  }
  
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;







