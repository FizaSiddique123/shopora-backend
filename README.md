# Nykaa E-commerce Backend API

## 🎯 Step 1: Backend Initialization - COMPLETED

This backend is built following industry best practices used at companies like Nykaa, Amazon, and Flipkart.

---

## 📁 Project Structure

```
server/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Business logic handlers
├── middleware/      # Custom middleware (auth, validation)
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── utils/           # Utility functions (error handling)
└── server.js        # Entry point
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/nykaa-ecommerce

JWT_ACCESS_SECRET=your_super_secret_access_token_key
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

**⚠️ Important:** Change JWT secrets in production!

### 3. Start MongoDB

Make sure MongoDB is running on your system:
- **Local:** MongoDB should be running on `mongodb://localhost:27017`
- **Cloud:** Use MongoDB Atlas connection string in `MONGODB_URI`

### 4. Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/me` | Private | Get current user |
| POST | `/logout` | Private | Logout user |

### Request/Response Examples

#### Signup
```json
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### Login
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### Get Current User (Protected)
```json
GET /api/auth/me
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "phone": "9876543210"
    }
  }
}
```

---

## 🔐 Authentication Flow Explained

### JWT Token Strategy

We use **Access Tokens + Refresh Tokens** for security:

1. **Access Token** (15 min expiry)
   - Stored in frontend memory/state
   - Sent in `Authorization: Bearer <token>` header
   - Short-lived for security

2. **Refresh Token** (7 days expiry)
   - Stored in httpOnly cookie
   - Not accessible via JavaScript (XSS protection)
   - Used to get new access tokens

### Why This Approach?

- ✅ **Security:** Short-lived access tokens limit damage if stolen
- ✅ **UX:** Users don't need to re-login frequently
- ✅ **XSS Protection:** httpOnly cookies can't be accessed by malicious scripts

---

## 🏗️ Architecture Decisions

### MVC Pattern
- **Models:** Database schemas (Mongoose)
- **Views:** Not applicable (REST API)
- **Controllers:** Business logic handlers
- **Routes:** API endpoint definitions

### Why This Structure?

1. **Separation of Concerns:** Each layer has a single responsibility
2. **Testability:** Easy to unit test controllers independently
3. **Maintainability:** Changes in routes don't affect business logic
4. **Scalability:** Easy to add new features without refactoring

---

## 🔒 Security Features Implemented

1. ✅ Password hashing with bcrypt (salt rounds: 12)
2. ✅ JWT token-based authentication
3. ✅ httpOnly cookies for refresh tokens
4. ✅ Input validation with express-validator
5. ✅ CORS configuration
6. ✅ Error handling (no sensitive data leakage)

---

## 🧪 Testing the API

Use Postman, Thunder Client, or curl:

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get Current User (replace <token> with actual token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## ✅ What's Completed in Step 1

- ✅ Backend project structure
- ✅ MongoDB connection configuration
- ✅ User model with password hashing
- ✅ JWT token generation (access + refresh)
- ✅ Authentication middleware
- ✅ Signup API endpoint
- ✅ Login API endpoint
- ✅ Get current user endpoint
- ✅ Logout endpoint
- ✅ Error handling middleware
- ✅ Input validation

---

## 🚀 Next Steps

After confirming Step 1 works, we'll proceed to:
- Product model and APIs
- Cart functionality
- Order management
- Admin routes
- File uploads (Cloudinary)

---

## 📚 Key Concepts for Interviews

### Explain JWT Flow:
1. User signs up/logs in
2. Server generates access + refresh tokens
3. Access token sent in response, refresh token in httpOnly cookie
4. Frontend stores access token, sends in Authorization header
5. Middleware verifies token, extracts user info
6. When access token expires, use refresh token to get new one

### Explain Password Security:
- Never store plain text passwords
- Use bcrypt with salt rounds (12) for hashing
- Compare passwords using bcrypt.compare (timing-safe)
- Passwords are hashed in model pre-save hook

### Explain Middleware:
- Functions that run between request and response
- Can modify request/response objects
- Can end request early (authentication failure)
- Execute in order (auth → controller)

---

**Built with ❤️ following industry best practices**







