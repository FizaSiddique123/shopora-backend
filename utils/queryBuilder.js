/**
 * Query Builder Utility
 * 
 * PROBLEM IT SOLVES: Centralizes complex MongoDB query building logic.
 * Instead of duplicating filter/search/sort logic in every controller,
 * this utility provides reusable query building functions.
 * 
 * HOW IT WORKS: Takes query parameters from request, builds MongoDB
 * filter objects, and handles pagination.
 * 
 * REAL-WORLD: Companies use similar patterns to:
 * - Keep controllers clean and focused
 * - Reuse query logic across endpoints
 * - Make query logic testable independently
 */

/**
 * Build filter object for product queries
 * 
 * Supports:
 * - Search by name/description
 * - Filter by category, brand, price range
 * - Filter by stock availability
 * - Filter by featured/bestseller flags
 */
export const buildProductFilter = (queryParams) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    featured,
    bestSeller,
    rating
  } = queryParams;

  const filter = {};

  // Text search (using MongoDB text index)
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Brand filter (supports multiple brands)
  if (brand) {
    const brands = Array.isArray(brand) ? brand : [brand];
    filter.brand = { $in: brands };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  // Stock availability
  if (inStock !== undefined) {
    filter.inStock = inStock === 'true' || inStock === true;
  }

  // Featured products
  if (featured !== undefined) {
    filter.featured = featured === 'true' || featured === true;
  }

  // Bestseller filter
  if (bestSeller !== undefined) {
    filter.bestSeller = bestSeller === 'true' || bestSeller === true;
  }

  // Minimum rating filter
  if (rating) {
    filter.rating = { $gte: Number(rating) };
  }

  return filter;
};

/**
 * Build sort object for product queries
 * 
 * Supports sorting by:
 * - price (ascending/descending)
 * - rating (descending by default)
 * - newest (createdAt)
 * - name (alphabetical)
 */
export const buildProductSort = (sortBy) => {
  const sortOptions = {
    priceLow: { price: 1 }, // Low to high
    priceHigh: { price: -1 }, // High to low
    rating: { rating: -1, numReviews: -1 }, // Highest rated first, then by review count
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 }
  };

  return sortOptions[sortBy] || sortOptions.newest; // Default to newest
};

/**
 * Build pagination parameters
 * 
 * Calculates skip and limit for MongoDB queries.
 * Also returns metadata for frontend pagination UI.
 */
export const buildPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

/**
 * Create pagination metadata for API response
 * 
 * WHY: Frontend needs total pages, current page, etc. to build pagination UI.
 * This provides all necessary metadata.
 */
export const createPaginationMeta = (page, limit, total) => {
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  };
};







