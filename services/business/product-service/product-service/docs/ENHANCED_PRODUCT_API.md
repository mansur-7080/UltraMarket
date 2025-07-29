# Enhanced Product API Documentation

## Overview

The Enhanced Product API provides a robust, high-performance interface for managing product data in the UltraMarket platform. This API is built using modern TypeScript patterns, leveraging SQL queries for optimal database performance, and implementing multi-level caching for fast response times.

## Base URL

```
/api/v1/enhanced-products
```

## Authentication

All endpoints that modify data (POST, PUT, DELETE) require authentication using JWT tokens.

- Include an `Authorization` header with value `Bearer YOUR_TOKEN`
- Admin privileges are required for product creation, updates, and deletion

## Endpoints

### Get Products

Retrieves products with advanced filtering, sorting, and pagination capabilities.

**URL**: `GET /api/v1/enhanced-products`  
**Authentication**: Not required  
**Query Parameters**:

| Parameter    | Type    | Description                               |
| ------------ | ------- | ----------------------------------------- |
| page         | Number  | Page number (starting from 1)             |
| limit        | Number  | Number of items per page (max 100)        |
| sortBy       | String  | Field to sort by (e.g., 'name', 'price')  |
| sortOrder    | String  | Sort direction ('asc' or 'desc')          |
| categoryId   | String  | Filter by category UUID                   |
| vendorId     | String  | Filter by vendor UUID                     |
| minPrice     | Number  | Minimum price filter                      |
| maxPrice     | Number  | Maximum price filter                      |
| status       | String  | Filter by product status                  |
| type         | String  | Filter by product type                    |
| isActive     | Boolean | Filter by active status                   |
| isFeatured   | Boolean | Filter featured products                  |
| isBestSeller | Boolean | Filter best sellers                       |
| isNewArrival | Boolean | Filter new arrivals                       |
| isOnSale     | Boolean | Filter products on sale                   |
| tags         | String  | Comma-separated list of tags to filter by |

**Response Example**:

```json
{
  "success": true,
  "products": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Professional Gaming Laptop",
      "description": "High-performance gaming laptop with the latest GPU",
      "shortDescription": "Ultimate gaming performance",
      "price": 1299.99,
      "sku": "GMLPT-1001",
      "images": ["image1.jpg", "image2.jpg"],
      "categoryId": "123e4567-e89b-12d3-a456-426614174111",
      "categoryName": "Laptops",
      "brand": "TechPro",
      "slug": "professional-gaming-laptop",
      "createdAt": "2023-04-12T10:20:30Z",
      "updatedAt": "2023-05-15T14:25:16Z"
    }
    // More products...
  ],
  "totalCount": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Get Product by ID

Retrieves detailed information about a specific product using its unique identifier.

**URL**: `GET /api/v1/enhanced-products/:id`  
**Authentication**: Not required  
**URL Parameters**:

- `id`: Product UUID

**Response Example**:

```json
{
  "success": true,
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Professional Gaming Laptop",
    "description": "High-performance gaming laptop with the latest GPU and advanced cooling system for extended gaming sessions. Features RGB keyboard and premium audio.",
    "shortDescription": "Ultimate gaming performance",
    "sku": "GMLPT-1001",
    "price": 1299.99,
    "comparePrice": 1499.99,
    "costPrice": 950.0,
    "currency": "USD",
    "categoryId": "123e4567-e89b-12d3-a456-426614174111",
    "categoryName": "Laptops",
    "barcode": "1234567890123",
    "brand": "TechPro",
    "model": "GamerX Pro",
    "weight": 2.5,
    "dimensions": {
      "length": 36.5,
      "width": 25.5,
      "height": 2.3
    },
    "status": "IN_STOCK",
    "type": "PHYSICAL",
    "vendorId": "123e4567-e89b-12d3-a456-426614174222",
    "attributes": {
      "color": "Black",
      "processor": "Intel Core i7-12700H",
      "memory": "16GB DDR5",
      "storage": "1TB NVMe SSD",
      "graphics": "NVIDIA RTX 3080"
    },
    "specifications": {
      "display": "15.6-inch 165Hz QHD",
      "battery": "80Wh, 6-cell",
      "ports": ["3x USB 3.2", "1x USB-C", "HDMI 2.1", "Ethernet"],
      "os": "Windows 11 Pro"
    },
    "warranty": "2-year limited warranty",
    "returnPolicy": "30-day money-back guarantee",
    "shippingInfo": "Free shipping within continental US",
    "tags": ["gaming", "laptop", "high-performance", "RGB"],
    "slug": "professional-gaming-laptop",
    "isActive": true,
    "isFeatured": true,
    "isBestSeller": true,
    "isNewArrival": false,
    "isOnSale": true,
    "salePercentage": 13,
    "saleStartDate": "2023-04-01T00:00:00Z",
    "saleEndDate": "2023-06-30T23:59:59Z",
    "metaTitle": "TechPro GamerX Pro Gaming Laptop | UltraMarket",
    "metaDescription": "Shop the TechPro GamerX Pro, the ultimate gaming laptop with RTX 3080 graphics and 165Hz display for an immersive gaming experience.",
    "metaKeywords": [
      "gaming laptop",
      "TechPro",
      "RTX 3080",
      "high performance"
    ],
    "publishedAt": "2023-04-12T10:20:30Z",
    "createdAt": "2023-04-12T10:20:30Z",
    "updatedAt": "2023-05-15T14:25:16Z"
  }
}
```

### Get Product by Slug

Retrieves detailed information about a specific product using its slug (URL-friendly name).

**URL**: `GET /api/v1/enhanced-products/slug/:slug`  
**Authentication**: Not required  
**URL Parameters**:

- `slug`: Product slug string

**Response**: Same format as Get Product by ID

### Search Products

Searches products based on a query string with advanced filtering capabilities.

**URL**: `GET /api/v1/enhanced-products/search`  
**Authentication**: Not required  
**Query Parameters**:

| Parameter  | Type   | Description                        |
| ---------- | ------ | ---------------------------------- |
| query      | String | Search query (required)            |
| page       | Number | Page number (starting from 1)      |
| limit      | Number | Number of items per page (max 100) |
| sortBy     | String | Field to sort by                   |
| sortOrder  | String | Sort direction ('asc' or 'desc')   |
| categoryId | String | Filter by category UUID            |
| minPrice   | Number | Minimum price filter               |
| maxPrice   | Number | Maximum price filter               |

**Response**: Same format as Get Products endpoint

### Create Product

Creates a new product in the system.

**URL**: `POST /api/v1/enhanced-products`  
**Authentication**: Required (Admin)  
**Request Body**:

| Field            | Type     | Description                      | Required |
| ---------------- | -------- | -------------------------------- | -------- |
| name             | String   | Product name                     | Yes      |
| description      | String   | Detailed product description     | No       |
| shortDescription | String   | Brief product description        | No       |
| sku              | String   | Stock keeping unit               | Yes      |
| price            | Number   | Product price                    | Yes      |
| categoryId       | String   | Category UUID                    | Yes      |
| barcode          | String   | Product barcode                  | No       |
| brand            | String   | Product brand                    | No       |
| model            | String   | Product model                    | No       |
| weight           | Number   | Product weight                   | No       |
| dimensions       | Object   | Product dimensions (l/w/h)       | No       |
| comparePrice     | Number   | Original/compare-at price        | No       |
| costPrice        | Number   | Cost price                       | No       |
| currency         | String   | Currency code (e.g., "USD")      | No       |
| status           | String   | Product status                   | No       |
| type             | String   | Product type                     | No       |
| vendorId         | String   | Vendor UUID                      | No       |
| attributes       | Object   | Product attributes               | No       |
| specifications   | Object   | Product specifications           | No       |
| warranty         | String   | Warranty information             | No       |
| returnPolicy     | String   | Return policy                    | No       |
| shippingInfo     | String   | Shipping information             | No       |
| tags             | String[] | Product tags                     | No       |
| slug             | String   | URL-friendly name                | No       |
| isActive         | Boolean  | Whether product is active        | No       |
| isFeatured       | Boolean  | Whether product is featured      | No       |
| isBestSeller     | Boolean  | Whether product is a best seller | No       |
| isNewArrival     | Boolean  | Whether product is a new arrival | No       |
| isOnSale         | Boolean  | Whether product is on sale       | No       |
| salePercentage   | Number   | Sale discount percentage         | No       |
| saleStartDate    | Date     | Sale start date                  | No       |
| saleEndDate      | Date     | Sale end date                    | No       |
| metaTitle        | String   | SEO meta title                   | No       |
| metaDescription  | String   | SEO meta description             | No       |
| metaKeywords     | String[] | SEO meta keywords                | No       |
| publishedAt      | Date     | Publication date                 | No       |

**Response Example**:

```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Professional Gaming Laptop",
    "sku": "GMLPT-1001",
    "price": 1299.99,
    // Other product fields...
    "createdAt": "2023-06-15T10:20:30Z",
    "updatedAt": "2023-06-15T10:20:30Z"
  }
}
```

### Update Product

Updates an existing product.

**URL**: `PUT /api/v1/enhanced-products/:id`  
**Authentication**: Required (Admin)  
**URL Parameters**:

- `id`: Product UUID

**Request Body**: Same fields as Create Product, all optional

**Response Example**:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Professional Gaming Laptop - 2023 Edition",
    // Updated and existing fields
    "updatedAt": "2023-06-16T14:25:16Z"
  }
}
```

### Delete Product

Deletes a product from the system.

**URL**: `DELETE /api/v1/enhanced-products/:id`  
**Authentication**: Required (Admin)  
**URL Parameters**:

- `id`: Product UUID

**Response Example**:

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "code": "PRODUCT_NOT_FOUND",
  "message": "The requested product could not be found"
}
```

Common error codes:

| Code                  | Status | Description                        |
| --------------------- | ------ | ---------------------------------- |
| VALIDATION_ERROR      | 400    | Invalid request parameters or body |
| UNAUTHORIZED          | 401    | Authentication required            |
| FORBIDDEN             | 403    | Insufficient permissions           |
| PRODUCT_NOT_FOUND     | 404    | Product not found                  |
| CATEGORY_NOT_FOUND    | 404    | Category not found                 |
| INTERNAL_SERVER_ERROR | 500    | Server error                       |
| DATABASE_ERROR        | 500    | Database operation error           |

## Rate Limiting

The Enhanced Product API implements rate limiting to protect the service.

- Standard endpoints: 1000 requests per 15-minute window per IP address
- Authentication endpoints: 10 requests per 15-minute window per IP address

When rate limit is exceeded, the API returns a 429 Too Many Requests response.
