# Step 3: Cart & Wishlist - COMPLETED ✅

## 🎯 Overview

Built complete shopping cart and wishlist functionality with persistent storage, stock validation, and price snapshots.

---

## 📦 What Was Built

### 1. Cart Model (`models/Cart.js`)

**Features:**
- ✅ One cart per user (one-to-one relationship)
- ✅ Embedded cart items (items stored within cart document)
- ✅ Price snapshots (price stored when item added, doesn't change)
- ✅ Automatic total calculation (totalPrice, totalItems)
- ✅ Stock validation before adding/updating
- ✅ Quantity management (add, update, remove)

**Key Methods:**
- `addItem()` - Add product or update quantity if exists
- `removeItem()` - Remove item from cart
- `updateItemQuantity()` - Update quantity with stock validation
- `clearCart()` - Remove all items
- `calculateTotals()` - Recalculate cart totals

**Why Price Snapshots?**
- Product prices may change over time
- Cart should show price at time of adding (better UX)
- Prevents price confusion during checkout

**Why Embedded Cart Items?**
- Cart items are always accessed with cart
- Faster reads (no joins needed)
- Better for frequent cart operations
- Simpler queries

---

### 2. Wishlist Model (`models/Wishlist.js`)

**Features:**
- ✅ One wishlist per user (one-to-one relationship)
- ✅ Array of product references (not embedded)
- ✅ Duplicate prevention
- ✅ Quick lookup methods

**Key Methods:**
- `addProduct()` - Add product (skip if exists)
- `removeProduct()` - Remove product
- `hasProduct()` - Check if product in wishlist
- `clearWishlist()` - Remove all products

**Why Product References (Not Embedded)?**
- Products already exist in Product collection
- Avoid duplication
- Can populate when needed
- Easier to maintain

---

### 3. Cart Controller (`controllers/cartController.js`)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart/items` | Add item to cart |
| PUT | `/api/cart/items/:productId` | Update item quantity |
| DELETE | `/api/cart/items/:productId` | Remove item from cart |
| DELETE | `/api/cart` | Clear entire cart |

**Features:**
- ✅ Stock validation before adding/updating
- ✅ Automatic cart creation if doesn't exist
- ✅ Quantity update or item addition
- ✅ Product population for full details
- ✅ Error handling for stock issues

---

### 4. Wishlist Controller (`controllers/wishlistController.js`)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist` | Get user's wishlist |
| POST | `/api/wishlist` | Add product to wishlist |
| DELETE | `/api/wishlist/:productId` | Remove product from wishlist |
| GET | `/api/wishlist/check/:productId` | Check if product in wishlist |
| DELETE | `/api/wishlist` | Clear entire wishlist |

**Features:**
- ✅ Duplicate prevention
- ✅ Automatic wishlist creation
- ✅ Product population
- ✅ Wishlist status check endpoint

---

### 5. Routes (`routes/cartRoutes.js`, `routes/wishlistRoutes.js`)

**Features:**
- ✅ All routes require authentication (protect middleware)
- ✅ RESTful route structure
- ✅ Clean route definitions

---

## 🔍 API Usage Examples

### Cart Operations

#### Get Cart
```bash
GET /api/cart
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "cart": {
      "_id": "...",
      "user": "...",
      "items": [
        {
          "product": { /* populated product */ },
          "name": "Lakme Foundation",
          "image": "https://...",
          "price": 399,
          "quantity": 2
        }
      ],
      "totalPrice": 798,
      "totalItems": 2
    }
  }
}
```

#### Add Item to Cart
```bash
POST /api/cart/items
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "60d5ec49f1b2c72b8c8e4b1a",
  "quantity": 1
}

Response:
{
  "success": true,
  "message": "Item added to cart",
  "data": { "cart": {...} }
}
```

#### Update Item Quantity
```bash
PUT /api/cart/items/:productId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```bash
DELETE /api/cart/items/:productId
Authorization: Bearer <access_token>
```

#### Clear Cart
```bash
DELETE /api/cart
Authorization: Bearer <access_token>
```

### Wishlist Operations

#### Get Wishlist
```bash
GET /api/wishlist
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "count": 5,
  "data": {
    "wishlist": {
      "_id": "...",
      "user": "...",
      "products": [
        { /* populated product objects */ }
      ]
    }
  }
}
```

#### Add to Wishlist
```bash
POST /api/wishlist
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "60d5ec49f1b2c72b8c8e4b1a"
}
```

#### Remove from Wishlist
```bash
DELETE /api/wishlist/:productId
Authorization: Bearer <access_token>
```

#### Check Wishlist Status
```bash
GET /api/wishlist/check/:productId
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "isInWishlist": true
  }
}
```

---

## 🏗️ Architecture Decisions

### 1. Embedded vs Referenced Cart Items

**Why Embedded:**
- Cart items are always accessed with cart
- Faster reads (no joins needed)
- Better for frequent operations
- Simpler queries

**Trade-off:**
- Can't query cart items independently (acceptable)
- Slightly larger cart documents

### 2. Price Snapshots

**Why:**
- Product prices change over time
- Cart should show price at time of adding
- Better UX (no surprise price changes)
- Industry standard practice

**Implementation:**
- Store price when item added to cart
- Price snapshot doesn't change even if product price changes
- User sees consistent pricing

### 3. Stock Validation

**Why:**
- Prevent overselling
- Validate before adding/updating cart
- Clear error messages to users

**Implementation:**
- Check stock before adding item
- Check stock before updating quantity
- Return clear error if stock insufficient

### 4. One Cart/Wishlist Per User

**Why:**
- Simpler data model
- Easier to manage
- Better performance (direct lookup by user ID)
- Unique constraint ensures one per user

---

## 🔒 Security Features

- ✅ All routes require authentication
- ✅ Users can only access their own cart/wishlist
- ✅ Stock validation prevents overselling
- ✅ Input validation
- ✅ Error handling

---

## 📊 Database Schema

### Cart Document Structure

```javascript
{
  user: ObjectId (ref: User, unique, indexed),
  items: [{
    product: ObjectId (ref: Product),
    name: String,
    image: String,
    price: Number, // Price snapshot
    quantity: Number
  }],
  totalPrice: Number (calculated),
  totalItems: Number (calculated),
  createdAt: Date,
  updatedAt: Date
}
```

### Wishlist Document Structure

```javascript
{
  user: ObjectId (ref: User, unique, indexed),
  products: [ObjectId (ref: Product)],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Data Flow

### Add to Cart Flow:
1. User clicks "Add to Cart" on product
2. Frontend sends POST `/api/cart/items` with productId
3. Backend validates product exists and is in stock
4. Get or create user's cart
5. Add item (or update quantity if exists)
6. Calculate totals
7. Save cart
8. Return updated cart to frontend
9. Frontend updates cart UI and localStorage (for persistence)

### Add to Wishlist Flow:
1. User clicks heart icon on product
2. Frontend sends POST `/api/wishlist` with productId
3. Backend validates product exists
4. Get or create user's wishlist
5. Check if already in wishlist
6. Add product if not exists
7. Return updated wishlist
8. Frontend updates wishlist UI

---

## 🧪 Testing the APIs

### 1. Login First (Get Access Token)

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Save the accessToken from response
```

### 2. Get Cart

```bash
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer <access_token>"
```

### 3. Add Item to Cart

```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id_from_seed>",
    "quantity": 2
  }'
```

### 4. Update Quantity

```bash
curl -X PUT http://localhost:5000/api/cart/items/<product_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'
```

### 5. Add to Wishlist

```bash
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": "<product_id>"}'
```

---

## 📚 Key Concepts for Interviews

### 1. Explain Cart Implementation

**Answer:**
- One cart per user (one-to-one relationship)
- Embedded cart items for performance
- Price snapshots (store price when added)
- Server-side total calculation for accuracy
- Stock validation before adding/updating
- Automatic cart creation if doesn't exist

### 2. Why Price Snapshots?

**Answer:**
- Product prices change over time
- Cart shows price at time of adding (consistent UX)
- Prevents price confusion during checkout
- Industry standard practice

### 3. Embedded vs Referenced Documents

**Answer:**
- **Embedded (Cart Items):** Always accessed together, faster reads, simpler queries
- **Referenced (Wishlist Products):** Avoid duplication, can populate when needed
- Choose based on access patterns and data size

### 4. Stock Validation Strategy

**Answer:**
- Validate stock before adding to cart
- Validate stock before updating quantity
- Return clear error messages
- Prevents overselling and customer disappointment

---

## ✅ Step 3 Checklist

- ✅ Cart model with embedded items
- ✅ Wishlist model with product references
- ✅ Cart CRUD operations
- ✅ Wishlist add/remove operations
- ✅ Stock validation
- ✅ Price snapshots
- ✅ Automatic total calculation
- ✅ Authentication on all routes
- ✅ Error handling
- ✅ Clean RESTful routes

---

## 🚀 Next Steps (Step 4)

After confirming Step 3 works, we'll proceed to:
- Order model and APIs
- Order placement flow
- Order status management
- Order history (user)
- Order management (admin)
- Stripe payment integration

---

## 💡 Frontend Integration Notes

**For Redux + localStorage:**
- Store cart in Redux state
- Sync with localStorage for persistence
- Sync with backend on login/refresh
- Optimistic updates (update UI immediately, sync in background)

**Cart Persistence Flow:**
1. User adds item → Update Redux state → Update localStorage → Call API
2. On page load → Check localStorage → Load cart → Sync with backend
3. On login → Merge localStorage cart with server cart

---

**Built with ❤️ following industry best practices**







