/**
 * Product Model Schema
 * 
 * PROBLEM IT SOLVES: Defines structure for e-commerce products (inspired by Nykaa).
 * Handles beauty & cosmetic products with categories, brands, pricing, images,
 * reviews, and ratings.
 * 
 * HOW IT WORKS: Mongoose schema with nested schemas for reviews and embedded
 * data for categories/brands. Uses indexes for faster search queries.
 * 
 * REAL-WORLD APPROACH: Companies like Nykaa use similar schemas with:
 * - Multiple images for product galleries
 * - Stock tracking for inventory management
 * - Embedded reviews for better read performance
 * - Price fields (original, discounted) for promotions
 * - Categories and brands for filtering
 */

import mongoose from 'mongoose';

/**
 * Review Schema (Embedded in Product)
 * 
 * WHY EMBEDDED: Reviews belong to a product and are rarely queried independently.
 * Embedded documents improve read performance for product detail pages.
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

/**
 * Product Schema
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true // Index for faster search
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Makeup',
        'Skincare',
        'Haircare',
        'Fragrance',
        'Bath & Body',
        'Tools & Brushes',
        'Men',
        'Appliances'
      ],
      index: true // Index for category filtering
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true // Index for brand filtering
    },
    images: [
      {
        type: String, // Cloudinary URLs
        required: true
      }
    ],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    inStock: {
      type: Boolean,
      default: true
    },
    reviews: [reviewSchema], // Embedded reviews
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    numReviews: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false // For featured products on homepage
    },
    bestSeller: {
      type: Boolean,
      default: false // For bestseller badge
    },
    tags: [String], // For additional filtering/search
    specifications: {
      // Product-specific details (varies by category)
      type: Map,
      of: String
    }
  },
  {
    timestamps: true
  }
);

/**
 * INDEXES FOR PERFORMANCE
 * 
 * WHY: Indexes make queries faster, especially for:
 * - Search (name field)
 * - Filtering (category, brand)
 * - Sorting (price, rating)
 * 
 * TRADE-OFF: Indexes take storage space and slow down writes slightly,
 * but greatly speed up reads (which are more common in e-commerce).
 */
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1, brand: 1 }); // Compound index for filtering
productSchema.index({ price: 1 }); // For price sorting
productSchema.index({ rating: -1 }); // For rating sorting

/**
 * VIRTUAL: Calculate discount percentage
 * 
 * WHY VIRTUAL: Computed property that doesn't need to be stored in DB.
 * Calculated on-the-fly when needed.
 */
productSchema.virtual('discountPercentage').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

/**
 * METHOD: Calculate average rating from reviews
 * 
 * WHY: Called whenever a review is added/updated to maintain accurate rating.
 * Ensures rating field is always in sync with reviews.
 */
productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }

  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = (total / this.reviews.length).toFixed(1);
  this.numReviews = this.reviews.length;
};

/**
 * STATIC METHOD: Get all categories
 * 
 * WHY STATIC: Called on the model, not an instance.
 * Useful for populating category filters in frontend.
 */
productSchema.statics.getCategories = function () {
  return this.distinct('category');
};

/**
 * STATIC METHOD: Get all brands
 * 
 * WHY STATIC: Called on the model to get unique brands.
 */
productSchema.statics.getBrands = function () {
  return this.distinct('brand');
};

const Product = mongoose.model('Product', productSchema);

export default Product;







