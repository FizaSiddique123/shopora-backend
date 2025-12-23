# Step 2: Product Model & APIs - COMPLETED ✅

## 🎯 Overview

Built a complete product management system with Nykaa-inspired features including categories, brands, search, filtering, sorting, pagination, and reviews.

---

## 📦 What Was Built

### 1. Product Model (`models/Product.js`)

**Features:**
- ✅ Product schema with all Nykaa-like fields (name, description, price, images, etc.)
- ✅ 8 categories: Makeup, Skincare, Haircare, Fragrance, Bath & Body, Tools & Brushes, Men, Appliances
- ✅ Brand field with indexing for fast filtering
- ✅ Embedded reviews schema (reviews stored within product document)
- ✅ Automatic rating calculation from reviews
- ✅ Stock management (stock quantity, inStock flag)
- ✅ Featured & bestseller flags for homepage
- ✅ Discount calculation (originalPrice vs price)
- ✅ MongoDB indexes for performance (text search, category, brand, price, rating)

**Why Embedded Reviews?**
- Reviews are always accessed with products (product detail page)
- Faster reads (no joins needed)
- Better for read-heavy e-commerce workloads
- Trade-off: Limited querying of reviews independently (acceptable for this use case)

---

### 2. Query Builder Utility (`utils/queryBuilder.js`)

**Purpose:** Centralized query building logic for reusable, testable code.

**Features:**
- ✅ `buildProductFilter()` - Handles all filtering logic
- ✅ `buildProductSort()` - Handles sorting options
- ✅ `buildPagination()` - Calculates skip/limit for pagination
- ✅ `createPaginationMeta()` - Generates pagination metadata for frontend

**Supported Filters:**
- Text search (name, description)
- Category
- Brand (single or multiple)
- Price range (minPrice, maxPrice)
- Stock availability
- Featured products
- Bestseller products
- Minimum rating

**Supported Sorting:**
- Price (low to high / high to low)
- Rating (highest first)
- Newest / Oldest
- Name (alphabetical)

---

### 3. Product Controller (`controllers/productController.js`)

**API Endpoints:**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | Get all products (with filters, sort, pagination) |
| GET | `/api/products/:id` | Public | Get single product by ID |
| POST | `/api/products` | Admin | Create new product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/reviews` | Private | Add product review |
| GET | `/api/products/categories` | Public | Get all categories |
| GET | `/api/products/brands` | Public | Get all brands |
| GET | `/api/products/featured` | Public | Get featured products |
| GET | `/api/products/bestsellers` | Public | Get bestseller products |

**Key Features:**
- ✅ Full CRUD operations for products
- ✅ Advanced filtering and sorting
- ✅ Pagination with metadata
- ✅ Review system with automatic rating calculation
- ✅ Admin-only product creation/editing
- ✅ Public product browsing

---

### 4. Product Routes (`routes/productRoutes.js`)

**Features:**
- ✅ Input validation using express-validator
- ✅ Protected routes (authentication required)
- ✅ Admin-only routes (authorization required)
- ✅ Public routes for browsing

---

### 5. Seed Script (`utils/seed.js`)

**Purpose:** Populate database with realistic Nykaa-like beauty products for development/testing.

**Contains:**
- ✅ 20+ products across different categories
- ✅ Realistic brands (Lakme, Maybelline, L'Oréal, etc.)
- ✅ Varied pricing with discounts
- ✅ Featured and bestseller flags
- ✅ Stock quantities

**Usage:**
```bash
npm run seed
```

---

## 🔍 API Usage Examples

### Get All Products with Filters

```bash
GET /api/products?category=Makeup&minPrice=200&maxPrice=1000&sortBy=priceLow&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 12,
    "totalItems": 45,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": {
    "products": [...]
  }
}
```

### Search Products

```bash
GET /api/products?search=lipstick&sortBy=rating
```

### Filter by Multiple Brands

```bash
GET /api/products?brand=Lakme&brand=Maybelline&category=Makeup
```

### Get Featured Products

```bash
GET /api/products/featured?limit=8
```

### Add Product Review

```bash
POST /api/products/:id/reviews
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Amazing product! Highly recommend."
}
```

### Create Product (Admin Only)

```bash
POST /api/products
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 999,
  "originalPrice": 1299,
  "category": "Makeup",
  "brand": "Lakme",
  "images": ["https://..."],
  "stock": 50,
  "featured": true,
  "tags": ["new", "trending"]
}
```

---

## 🏗️ Architecture Decisions

### 1. Embedded Reviews vs Separate Collection

**Why Embedded:**
- Reviews are always accessed with products
- Faster reads (no joins/population needed)
- Better for read-heavy workloads
- Simpler queries for product detail pages

**Trade-off:**
- Can't easily query all reviews across products
- Acceptable for this use case (we show reviews on product pages)

### 2. MongoDB Indexes

**Indexes Created:**
- Text index on `name` and `description` (for search)
- Index on `category` (for filtering)
- Index on `brand` (for filtering)
- Index on `price` (for sorting)
- Index on `rating` (for sorting)
- Compound index on `category + brand` (for combined filtering)

**Why Indexes?**
- Speed up queries significantly
- Essential for production performance
- Trade-off: Slight storage increase, slightly slower writes

### 3. Query Builder Pattern

**Why Separate Utility:**
- Reusable across multiple endpoints
- Testable independently
- Keeps controllers clean
- Easy to extend with new filters

### 4. Pagination

**Why Server-Side Pagination:**
- Prevents loading all products at once
- Better performance for large catalogs
- Reduces network payload
- Industry standard approach

---

## 🔒 Security Features

- ✅ Input validation on all endpoints
- ✅ Admin-only product creation/editing
- ✅ Authenticated users only for reviews
- ✅ One review per user per product
- ✅ Rating validation (1-5 only)

---

## 📊 Database Schema

### Product Document Structure

```javascript
{
  name: String (indexed, text search),
  description: String (text search),
  price: Number,
  originalPrice: Number,
  discount: Number (0-100),
  category: String (enum, indexed),
  brand: String (indexed),
  images: [String],
  stock: Number,
  inStock: Boolean,
  reviews: [{
    user: ObjectId (ref: User),
    name: String,
    rating: Number (1-5),
    comment: String,
    createdAt: Date
  }],
  rating: Number (0-5, calculated),
  numReviews: Number,
  featured: Boolean,
  bestSeller: Boolean,
  tags: [String],
  specifications: Map
}
```

---

## 🧪 Testing the APIs

### 1. Seed the Database

```bash
cd server
npm run seed
```

### 2. Get All Products

```bash
curl http://localhost:5000/api/products
```

### 3. Filter Products

```bash
curl "http://localhost:5000/api/products?category=Skincare&minPrice=300&maxPrice=1000"
```

### 4. Search Products

```bash
curl "http://localhost:5000/api/products?search=foundation"
```

### 5. Get Categories

```bash
curl http://localhost:5000/api/products/categories
```

### 6. Get Brands

```bash
curl http://localhost:5000/api/products/brands
```

---

## 📚 Key Concepts for Interviews

### 1. Explain Pagination Implementation

**Answer:**
- Use `skip` and `limit` in MongoDB queries
- Calculate `skip = (page - 1) * limit`
- Return pagination metadata (total pages, current page, has next/prev)
- Frontend uses metadata to build pagination UI

### 2. Explain Filtering Strategy

**Answer:**
- Build MongoDB filter object from query parameters
- Use indexes on filtered fields (category, brand, price)
- Support multiple filters simultaneously
- Server-side filtering ensures data consistency

### 3. Explain Review System

**Answer:**
- Reviews embedded in product documents (not separate collection)
- When review added, recalculate average rating
- One review per user per product (enforced in controller)
- Embedded approach faster for product detail pages

### 4. Explain Search Implementation

**Answer:**
- Use MongoDB text index on name and description
- Text search uses `$text` operator
- Combine with filters for refined search
- Can be extended with Elasticsearch for advanced search

---

## ✅ Step 2 Checklist

- ✅ Product model with all fields
- ✅ Category and brand support
- ✅ Search functionality
- ✅ Filtering (category, brand, price, stock, rating)
- ✅ Sorting (price, rating, newest, name)
- ✅ Pagination with metadata
- ✅ Product CRUD operations
- ✅ Review and rating system
- ✅ Admin authorization
- ✅ Input validation
- ✅ Seed script with dummy data
- ✅ Indexes for performance

---

## 🚀 Next Steps (Step 3)

After confirming Step 2 works, we'll proceed to:
- Cart model and APIs
- Wishlist functionality
- Persistent cart with Redux + localStorage
- Cart operations (add, remove, update quantity)

---

**Built with ❤️ following industry best practices**







