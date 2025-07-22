# E-Commerce API Documentation

## Overview
Complete E-commerce API with role-based access control, product management, order processing, cart functionality, and social features.

**Base URL:** `https://e-commerce-api-ads3.onrender.com/`  
**Version:** 1.0.0  
**API Specification:** OpenAPI 2.0

## 🚀 Getting Started Guide

1. **Register**: Use `/api/users/signup` to create a new account (Customer or Seller)
2. **Login**: Use `/api/users/signin` with your credentials to get a JWT token
3. **Authorize**: Include the JWT token in your requests: `Authorization: Bearer <your-jwt-token>`
4. **Explore**: Now you can access all protected endpoints!

## User Roles

- **Customer**: Can browse products, manage cart, place orders, like items
- **Seller**: Can manage own products, view related orders, access analytics
- **Admin**: Full system access and user management

## Authentication

### JWT Token Usage
Include the JWT token in the Authorization header for all protected endpoints:
```
Authorization: Bearer <your-jwt-token>
```

---

# 👥 Users API

## User Registration
Create a new user account (Customer or Seller).

**Endpoint:** `POST /api/users/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "customer",  // "customer", "seller", or "admin"
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f9b1c8e4b0a1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "customer",
      "phone": "+1234567890",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## User Login
Authenticate user and get JWT token.

**Endpoint:** `POST /api/users/signin`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f9b1c8e4b0a1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

## Get User Profile
Get current user's profile information.

**Endpoint:** `GET /api/users/profile`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f9b1c8e4b0a1234567890",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "customer",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z"
    }
  }
}
```

## Get All Users
Get list of all users (Admin only).

**Endpoint:** `GET /api/users/all`  
**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10)
- `role` (string): Filter by role
- `search` (string): Search by name or email

## Get User by ID
Get specific user information.

**Endpoint:** `GET /api/users/{id}`  
**Authentication:** Required

## Update User
Update user information.

**Endpoint:** `PUT /api/users/{id}`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90210",
    "country": "USA"
  }
}
```

## Delete User
Delete user account.

**Endpoint:** `DELETE /api/users/{id}`  
**Authentication:** Required (Admin or Own Account)

---

# 📦 Products API

## Get All Products
Retrieve all products with filtering and pagination.

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 12)
- `category` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort by field (name, price, rating, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "64f9b1c8e4b0a1234567891",
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": 999.99,
        "originalPrice": 1199.99,
        "discount": 17,
        "category": "Electronics",
        "brand": "Apple",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "rating": 4.5,
        "reviewCount": 128,
        "stock": 50,
        "seller": {
          "id": "seller_123",
          "name": "Tech Store",
          "rating": 4.8
        },
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 95,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Add Product
Create a new product (Seller/Admin only).

**Endpoint:** `POST /api/products`  
**Authentication:** Required (Seller/Admin)

**Request Body:**
```json
{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop with RTX graphics",
  "price": 1499.99,
  "originalPrice": 1699.99,
  "category": "Electronics",
  "brand": "ASUS",
  "images": [
    "https://example.com/laptop1.jpg",
    "https://example.com/laptop2.jpg"
  ],
  "specifications": {
    "processor": "Intel i7",
    "ram": "16GB",
    "storage": "1TB SSD",
    "graphics": "RTX 4060"
  },
  "stock": 25,
  "tags": ["gaming", "laptop", "high-performance"]
}
```

## Search Products
Search products by name, description, or tags.

**Endpoint:** `GET /api/products/search`

**Query Parameters:**
- `q` (string): Search query
- `page` (integer): Page number
- `limit` (integer): Items per page

**Example:** `/api/products/search?q=gaming laptop&page=1&limit=10`

## Filter Products
Advanced product filtering.

**Endpoint:** `GET /api/products/filter`

**Query Parameters:**
- `category` (string): Category filter
- `brand` (string): Brand filter
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `rating` (number): Minimum rating
- `inStock` (boolean): Stock availability

## Get My Products
Get products belonging to current seller.

**Endpoint:** `GET /api/products/my/products`  
**Authentication:** Required (Seller)

## Rate Product
Rate and review a product.

**Endpoint:** `POST /api/products/rate`  
**Authentication:** Required

**Request Body:**
```json
{
  "productId": "64f9b1c8e4b0a1234567891",
  "rating": 5,
  "review": "Excellent product! Highly recommended.",
  "title": "Amazing quality"
}
```

## Get Product by ID
Get detailed product information.

**Endpoint:** `GET /api/products/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "64f9b1c8e4b0a1234567891",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with advanced features",
      "price": 999.99,
      "originalPrice": 1199.99,
      "discount": 17,
      "category": "Electronics",
      "brand": "Apple",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "specifications": {
        "storage": "256GB",
        "color": "Space Black",
        "warranty": "1 year"
      },
      "rating": 4.5,
      "reviewCount": 128,
      "reviews": [
        {
          "id": "review_123",
          "user": "John D.",
          "rating": 5,
          "title": "Great phone!",
          "comment": "Love the camera quality",
          "createdAt": "2024-01-10T08:15:00.000Z"
        }
      ],
      "stock": 50,
      "seller": {
        "id": "seller_123",
        "name": "Tech Store",
        "rating": 4.8,
        "totalProducts": 156
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z"
    }
  }
}
```

## Update Product
Update product information (Seller/Admin only).

**Endpoint:** `PUT /api/products/{id}`  
**Authentication:** Required (Product Owner/Admin)

## Delete Product
Delete a product (Seller/Admin only).

**Endpoint:** `DELETE /api/products/{id}`  
**Authentication:** Required (Product Owner/Admin)

---

# 🏷️ Categories API

## Get All Categories
Get list of all product categories.

**Endpoint:** `GET /api/products/categories`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_electronics",
        "name": "Electronics",
        "description": "Electronic devices and gadgets",
        "image": "https://example.com/electronics.jpg",
        "productCount": 245,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "cat_clothing",
        "name": "Clothing",
        "description": "Fashion and apparel",
        "image": "https://example.com/clothing.jpg",
        "productCount": 189,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

## Create Category
Create a new category (Admin only).

**Endpoint:** `POST /api/products/categories`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Home & Garden",
  "description": "Home improvement and garden supplies",
  "image": "https://example.com/home-garden.jpg"
}
```

---

# 🛒 Cart Items API

## Get Cart Items
Get current user's cart items.

**Endpoint:** `GET /api/cartItems`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "cartItems": [
      {
        "id": "cart_item_123",
        "product": {
          "id": "64f9b1c8e4b0a1234567891",
          "name": "iPhone 15 Pro",
          "price": 999.99,
          "image": "https://example.com/image1.jpg",
          "stock": 50
        },
        "quantity": 2,
        "totalPrice": 1999.98,
        "addedAt": "2024-01-20T10:15:00.000Z"
      }
    ],
    "summary": {
      "totalItems": 3,
      "subtotal": 2549.97,
      "tax": 254.99,
      "shipping": 19.99,
      "total": 2824.95
    }
  }
}
```

## Add to Cart
Add product to cart.

**Endpoint:** `POST /api/cartItems`  
**Authentication:** Required

**Request Body:**
```json
{
  "productId": "64f9b1c8e4b0a1234567891",
  "quantity": 2
}
```

## Update Cart Item
Update quantity of cart item.

**Endpoint:** `PUT /api/cartItems/{id}`  
**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 3
}
```

## Remove from Cart
Remove specific item from cart.

**Endpoint:** `DELETE /api/cartItems/{id}`  
**Authentication:** Required

## Clear Cart
Remove all items from cart.

**Endpoint:** `DELETE /api/cartItems`  
**Authentication:** Required

---

# ❤️ Likes API

## Get Likes
Get all likes for products.

**Endpoint:** `GET /api/likes`  
**Authentication:** Required

## Toggle Like
Like or unlike a product.

**Endpoint:** `POST /api/likes`  
**Authentication:** Required

**Request Body:**
```json
{
  "productId": "64f9b1c8e4b0a1234567891"
}
```

## Get My Likes
Get current user's liked products.

**Endpoint:** `GET /api/likes/my-likes`  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "likedProducts": [
      {
        "id": "64f9b1c8e4b0a1234567891",
        "name": "iPhone 15 Pro",
        "price": 999.99,
        "image": "https://example.com/image1.jpg",
        "rating": 4.5,
        "likedAt": "2024-01-18T14:20:00.000Z"
      }
    ],
    "totalLikes": 5
  }
}
```

---

# 📋 Orders API

## Create Order
Place a new order.

**Endpoint:** `POST /api/orders`  
**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "productId": "64f9b1c8e4b0a1234567891",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardToken": "tok_visa_1234"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_64f9b1c8e4b0a123456789a",
      "orderNumber": "ORD-2024-001234",
      "items": [
        {
          "product": {
            "id": "64f9b1c8e4b0a1234567891",
            "name": "iPhone 15 Pro",
            "image": "https://example.com/image1.jpg"
          },
          "quantity": 2,
          "price": 999.99,
          "total": 1999.98
        }
      ],
      "subtotal": 1999.98,
      "tax": 199.99,
      "shipping": 19.99,
      "total": 2219.96,
      "status": "pending",
      "paymentStatus": "paid",
      "shippingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "estimatedDelivery": "2024-01-28T00:00:00.000Z",
      "createdAt": "2024-01-20T15:30:00.000Z"
    }
  }
}
```

## Get My Orders
Get current user's orders.

**Endpoint:** `GET /api/orders/my-orders`  
**Authentication:** Required

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by order status

## Get Seller Orders
Get orders for seller's products.

**Endpoint:** `GET /api/orders/seller-orders`  
**Authentication:** Required (Seller)

## Get All Orders
Get all orders (Admin only).

**Endpoint:** `GET /api/orders/all`  
**Authentication:** Required (Admin)

## Get Order Analytics
Get order statistics and analytics.

**Endpoint:** `GET /api/orders/analytics`  
**Authentication:** Required (Seller/Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalOrders": 1247,
      "totalRevenue": 156890.45,
      "averageOrderValue": 125.67,
      "monthlyGrowth": 12.5,
      "topSellingProducts": [
        {
          "productId": "64f9b1c8e4b0a1234567891",
          "name": "iPhone 15 Pro",
          "totalSold": 85,
          "revenue": 84999.15
        }
      ],
      "ordersByStatus": {
        "pending": 23,
        "processing": 45,
        "shipped": 189,
        "delivered": 967,
        "cancelled": 23
      },
      "revenueByMonth": [
        {
          "month": "2024-01",
          "revenue": 45678.90,
          "orders": 365
        }
      ]
    }
  }
}
```

## Get Order by ID
Get specific order details.

**Endpoint:** `GET /api/orders/{id}`  
**Authentication:** Required

## Update Order Status
Update order status (Seller/Admin only).

**Endpoint:** `PUT /api/orders/{id}/status`  
**Authentication:** Required (Seller/Admin)

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "notes": "Package shipped via FedEx"
}
```

## Cancel Order
Cancel an order.

**Endpoint:** `PUT /api/orders/{id}/cancel`  
**Authentication:** Required

**Request Body:**
```json
{
  "reason": "Changed mind",
  "refundRequested": true
}
```

---

# 📊 Data Models

## User Model
```json
{
  "id": "string",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "role": "customer|seller|admin",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "isActive": "boolean",
  "emailVerified": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Product Model
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "originalPrice": "number",
  "discount": "number",
  "category": "string",
  "brand": "string",
  "images": ["string"],
  "specifications": "object",
  "tags": ["string"],
  "rating": "number",
  "reviewCount": "number",
  "stock": "number",
  "sellerId": "string",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Order Model
```json
{
  "id": "string",
  "orderNumber": "string",
  "userId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "price": "number",
      "total": "number"
    }
  ],
  "subtotal": "number",
  "tax": "number",
  "shipping": "number",
  "total": "number",
  "status": "pending|processing|shipped|delivered|cancelled",
  "paymentStatus": "pending|paid|failed|refunded",
  "paymentMethod": "string",
  "shippingAddress": "object",
  "trackingNumber": "string",
  "notes": "string",
  "estimatedDelivery": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

# 🔧 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `USER_NOT_FOUND` | User not found | The requested user doesn't exist |
| `INVALID_CREDENTIALS` | Invalid email or password | Login credentials are incorrect |
| `UNAUTHORIZED` | Authorization required | Valid JWT token required |
| `FORBIDDEN` | Access denied | Insufficient permissions |
| `PRODUCT_NOT_FOUND` | Product not found | The requested product doesn't exist |
| `INSUFFICIENT_STOCK` | Not enough stock | Requested quantity exceeds available stock |
| `CART_EMPTY` | Cart is empty | Cannot create order with empty cart |
| `ORDER_NOT_FOUND` | Order not found | The requested order doesn't exist |
| `INVALID_ORDER_STATUS` | Invalid status transition | Cannot change order to this status |
| `VALIDATION_ERROR` | Validation failed | Request data doesn't meet requirements |

---

# 🚀 Rate Limits

- **Authentication endpoints**: 5 requests per minute
- **Product browsing**: 100 requests per minute  
- **Cart operations**: 50 requests per minute
- **Order operations**: 20 requests per minute
- **Admin operations**: 200 requests per minute

---

# 📞 Support

For API support and documentation updates:
- **GitHub**: [https://github.com/ParthA164/e-commerce-api](https://github.com/ParthA164/e-commerce-api)
- **Live API**: [https://e-commerce-api-ads3.onrender.com/](https://e-commerce-api-ads3.onrender.com/)
  
