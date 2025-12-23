/**
 * Product Controller
 * 
 * PROBLEM IT SOLVES: Handles all product-related business logic.
 * Separates API logic from database queries for better maintainability.
 * 
 * HOW IT WORKS: Controllers receive requests, build queries using utilities,
 * interact with database, and return formatted responses.
 * 
 * REAL-WORLD: This pattern is used by companies to:
 * - Keep routes thin (routes just call controllers)
 * - Make business logic testable
 * - Handle errors consistently
 * - Return standardized API responses
 */

import Product from '../models/Product.js';
import { validationResult } from 'express-validator';
import {
  buildProductFilter,
  buildProductSort,
  buildPagination,
  createPaginationMeta
} from '../utils/queryBuilder.js';

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 * 
 * QUERY PARAMETERS:
 * - search: Text search in name/description
 * - category: Filter by category
 * - brand: Filter by brand(s)
 * - minPrice, maxPrice: Price range filter
 * - inStock: Filter by stock availability
 * - featured: Filter featured products
 * - bestSeller: Filter bestsellers
 * - rating: Minimum rating filter
 * - sortBy: Sort option (priceLow, priceHigh, rating, newest, name)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * REAL-WORLD: This is how e-commerce sites like Nykaa handle product listings.
 * All filtering/sorting happens server-side for performance and data consistency.
 */
export const getProducts = async (req, res, next) => {
  try {
    // Build filter, sort, and pagination from query params
    const filter = buildProductFilter(req.query);
    const sort = buildProductSort(req.query.sortBy);
    const { page, limit, skip } = buildPagination(req.query.page, req.query.limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-reviews'); // Exclude reviews from list view (too large)

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Build pagination metadata
    const pagination = createPaginationMeta(page, limit, total);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 * 
 * WHY: Product detail pages need full product info including reviews.
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 * 
 * REAL-WORLD: Only admins can create products in production.
 * This endpoint handles product creation from admin dashboard.
 */
export const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Calculate discount if originalPrice provided
    const { name, description, price, originalPrice, category, brand, images, stock, tags } = req.body;
    
    let discount = 0;
    if (originalPrice && originalPrice > price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice: originalPrice || price,
      discount,
      category,
      brand,
      images: images || [],
      stock: stock || 0,
      inStock: (stock || 0) > 0,
      tags: tags || [],
      featured: req.body.featured || false,
      bestSeller: req.body.bestSeller || false
    });

    res.status(201).json({
      success: true,
      data: {
        product
      },
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Calculate discount if price/originalPrice changed
    const { price, originalPrice } = req.body;
    if (price || originalPrice) {
      const finalPrice = price || product.price;
      const finalOriginalPrice = originalPrice || product.originalPrice || product.price;
      if (finalOriginalPrice > finalPrice) {
        req.body.discount = Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100);
      }
    }

    // Update stock availability
    if (req.body.stock !== undefined) {
      req.body.inStock = req.body.stock > 0;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    res.status(200).json({
      success: true,
      data: {
        product
      },
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 * 
 * REAL-WORLD: Users can review products they've purchased.
 * Reviews are embedded in products for faster reads.
 * 
 * FLOW:
 * 1. Validate review data
 * 2. Check if user already reviewed this product
 * 3. Add review to product
 * 4. Recalculate product rating
 * 5. Save product
 */
export const createProductReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this product'
      });
    }

    // Add review
    const review = {
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    // Recalculate rating
    product.calculateRating();

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: product.reviews[product.reviews.length - 1]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product categories
 * @route   GET /api/products/categories
 * @access  Public
 * 
 * WHY: Frontend needs list of categories for filter dropdowns.
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.getCategories();
    res.status(200).json({
      success: true,
      count: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product brands
 * @route   GET /api/products/brands
 * @access  Public
 * 
 * WHY: Frontend needs list of brands for filter dropdowns.
 */
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Product.getBrands();
    res.status(200).json({
      success: true,
      count: brands.length,
      data: {
        brands: brands.sort() // Sort alphabetically
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 * 
 * WHY: Homepage displays featured products for marketing.
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const products = await Product.find({ featured: true })
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('-reviews');

    res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bestseller products
 * @route   GET /api/products/bestsellers
 * @access  Public
 */
export const getBestsellerProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const products = await Product.find({ bestSeller: true })
      .limit(limit)
      .sort({ rating: -1, numReviews: -1 })
      .select('-reviews');

    res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};







