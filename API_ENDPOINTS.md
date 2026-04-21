# Asaan Taqreeb Backend API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication Module (/auth)

### 1. Register User
**POST** `/auth/register`
- **Description**: Create a new user account
- **Access**: Public
- **Payload**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "Min6Chars",
  "role": "client"  // optional: "admin" | "vendor" | "client"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT...",
    "refreshToken": "JWT...",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "client"
    }
  }
}
```

### 2. Login
**POST** `/auth/login`
- **Description**: Authenticate user and get tokens
- **Access**: Public
- **Payload**:
```json
{
  "email": "user@example.com",
  "password": "Min6Chars"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT...",
    "refreshToken": "JWT...",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "client"
    }
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh`
- **Description**: Get new access token using refresh token
- **Access**: Public
- **Payload**:
```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT...",
    "refreshToken": "JWT..."
  }
}
```

### 4. Logout
**POST** `/auth/logout`
- **Description**: Logout user and invalidate refresh token
- **Access**: Protected (Bearer token required)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**: None
- **Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Get Current User
**GET** `/auth/me`
- **Description**: Get current user profile
- **Access**: Protected
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "client",
    "phone": "...",
    "profileImage": "..."
  }
}
```

### 6. Update Profile
**PUT** `/auth/me`
- **Description**: Update user profile
- **Access**: Protected
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "name": "Updated Name",
  "phone": "+923001234567",
  "profileImage": "https://res.cloudinary.com/..."
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Updated Name",
    "email": "...",
    "role": "client",
    "phone": "+923001234567",
    "profileImage": "https://res.cloudinary.com/..."
  }
}
```

### 7. Forgot Password
**POST** `/auth/forgot-password`
- **Description**: Generate OTP for password reset
- **Access**: Public
- **Payload**:
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "message": "OTP generated (development mode, check server logs for code)."
  }
}
```

### 8. Verify OTP
**POST** `/auth/verify-otp`
- **Description**: Verify OTP for password reset
- **Access**: Public
- **Payload**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "message": "OTP verified successfully."
  }
}
```

### 9. Reset Password
**POST** `/auth/reset-password`
- **Description**: Reset password with new password
- **Access**: Public
- **Payload**:
```json
{
  "email": "user@example.com",
  "newPassword": "NewPass123"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "message": "Password has been reset successfully."
  }
}
```

## Vendor Module (/vendors)

### 1. Get All Vendors
**GET** `/vendors`
- **Description**: Get list of all vendors (basic info)
- **Access**: Public
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Vendor Name",
      "email": "vendor@example.com",
      "role": "vendor"
    }
  ]
}
```

## Vendor Services Module (/vendor/services)

### 1. Get All Services
**GET** `/vendor/services`
- **Description**: Get all vendor services with populated user info
- **Access**: Public
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "...",
        "email": "...",
        "role": "vendor"
      },
      "category": "BANQUET_HALL",
      "basicInfo": {
        "name": "...",
        "location": "...",
        "landmark": "...",
        "about": "..."
      },
      "capacity": {
        "minGuests": 200,
        "maxGuests": 500
      },
      "images": ["url1", "url2"],
      "packages": [
        {
          "name": "Classic Package",
          "price": 250000,
          "pricePerHead": 1200,
          "guestCount": 200,
          "details": "...",
          "items": ["...", "..."]
        }
      ],
      "optionalServices": [
        {
          "name": "LED Wall",
          "price": 25000,
          "details": null
        }
      ]
    }
  ]
}
```

### 2. Get Service by ID
**GET** `/vendor/services/:id`
- **Description**: Get specific service details
- **Access**: Public
- **Response**: Same as single service object above

### 3. Create Service
**POST** `/vendor/services`
- **Description**: Create new vendor service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "category": "BANQUET_HALL",
  "basicInfo": {
    "name": "Grand Taj Banquet",
    "location": "Shahrah e Faisal, Karachi",
    "landmark": "Near City Mall",
    "about": "..."
  },
  "capacity": {
    "minGuests": 200,
    "maxGuests": 500
  },
  "images": ["url1", "url2"],
  "packages": [
    {
      "name": "Classic Package",
      "price": 250000,
      "pricePerHead": null,
      "guestCount": null,
      "details": "Stage decor, sound system, basic lighting",
      "items": ["Stage Decoration", "Sound System", "Lighting"]
    }
  ],
  "optionalServices": [
    {
      "name": "LED Wall",
      "price": 25000,
      "details": null
    }
  ]
}
```

### 4. Get My Services
**GET** `/vendor/services/me`
- **Description**: Get current vendor's services
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`

### 5. Update Service
**PUT** `/vendor/services/:id`
- **Description**: Update vendor service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "basicInfo": {
    "name": "Updated Name",
    "location": "Updated Location"
  },
  "capacity": {
    "minGuests": 150,
    "maxGuests": 400
  },
  "images": ["newUrl1", "newUrl2"]
}
```

### 6. Delete Service
**DELETE** `/vendor/services/:id`
- **Description**: Delete vendor service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`

### 7. Upload Service Images
**POST** `/vendor/services/:serviceId/images`
- **Description**: Upload images for a service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Body**: `images` (array of files, max 5)

### 8. Delete Service Image
**DELETE** `/vendor/services/:serviceId/images`
- **Description**: Delete specific service image
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "imageUrl": "https://..."
}
```

## Package Management

### 1. Add Package
**POST** `/vendor/services/:serviceId/packages`
- **Description**: Add package to service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "name": "Premium Package",
  "price": 500000,
  "pricePerHead": 1500,
  "guestCount": 300,
  "details": "Premium services included",
  "items": ["Item 1", "Item 2"]
}
```

### 2. Update Package
**PUT** `/vendor/services/:serviceId/packages/:packageId`
- **Description**: Update specific package
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**: Same as add package

### 3. Delete Package
**DELETE** `/vendor/services/:serviceId/packages/:packageId`
- **Description**: Delete specific package
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`

## Optional Services Management

### 1. Add Optional Service
**POST** `/vendor/services/:serviceId/optional-services`
- **Description**: Add optional service/addon
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "name": "Live Music",
  "price": 50000,
  "details": "Live band for 3 hours"
}
```

### 2. Update Optional Service
**PUT** `/vendor/services/:serviceId/optional-services/:addonId`
- **Description**: Update optional service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**: Same as add optional service

### 3. Delete Optional Service
**DELETE** `/vendor/services/:serviceId/optional-services/:addonId`
- **Description**: Delete optional service
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`

## Vendor Availability Module (/vendor/availability)

### 1. Get Vendor Availability
**GET** `/vendor/availability/:vendorId?from=2026-03-01&to=2026-03-31`
- **Description**: Get vendor's blocked/booked dates
- **Access**: Public
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "vendor": "...",
      "date": "2026-03-05",
      "timeSlot": {
        "from": "10:00",
        "to": "17:00"
      },
      "reason": "Maintenance",
      "type": "BLOCKED"
    }
  ]
}
```

### 2. Block Availability
**PUT** `/vendor/availability/:date`
- **Description**: Block specific date/time slot
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "timeSlot": {
    "from": "10:00",
    "to": "17:00"
  },
  "reason": "Maintenance"
}
```

### 3. Unblock Availability
**DELETE** `/vendor/availability/:date`
- **Description**: Unblock specific date/time slot
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`

## Booking Module (/bookings)

### 1. Create Booking
**POST** `/bookings`
- **Description**: Create new booking
- **Access**: Protected (Client only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload** (Banquet Hall example):
```json
{
  "serviceId": "69a97938af2c9d4438416574",
  "category": "BANQUET_HALL",
  "packageName": "Classic Package",
  "guestCount": 500,
  "date": "2026-03-05",
  "timeSlot": {
    "from": "10:00",
    "to": "17:00"
  },
  "location": "Shahrah e Faisal, Karachi",
  "specialRequests": "Need premium stage lighting and extra chairs.",
  "selectedAddons": ["LED Wall"]
}
```

### 2. Get My Bookings
**GET** `/bookings/me`
- **Description**: Get current client's bookings
- **Access**: Protected (Client only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "client": "...",
      "vendor": "...",
      "service": {
        "_id": "...",
        "category": "BANQUET_HALL",
        "basicInfo": {
          "name": "Grand Taj Banquet",
          "location": "Shahrah e Faisal, Karachi"
        }
      },
      "vendor": {
        "name": "Vendor Name",
        "email": "vendor@example.com"
      },
      "category": "BANQUET_HALL",
      "selectedPackage": {
        "name": "Classic Package",
        "price": 250000,
        "guestCount": 500,
        "pricePerHead": null,
        "details": "...",
        "items": ["Stage Decoration", "Sound System", "Lighting"]
      },
      "guestCount": 500,
      "date": "2026-03-05",
      "timeSlot": {
        "from": "10:00",
        "to": "17:00"
      },
      "location": "Shahrah e Faisal, Karachi",
      "specialRequests": "...",
      "optionalAddons": [
        {
          "name": "LED Wall",
          "price": 25000
        }
      ],
      "pricing": {
        "totalAmount": 250000,
        "advanceAmount": 125000
      },
      "status": "PENDING"
    }
  ]
}
```

### 3. Get Vendor Bookings
**GET** `/bookings/vendor/me`
- **Description**: Get bookings for vendor's services
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Same structure as client bookings but with client info populated

### 4. Update Booking Status
**PATCH** `/bookings/:id/status`
- **Description**: Update booking status (approve/reject/cancel)
- **Access**: Protected (Vendor only)
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "status": "APPROVED",
  "rejectionReason": "Date not available"
}
```

## Messages Module (/messages)

### 1. Get Chat History
**GET** `/messages/:chatId`
- **Description**: Get chat history between users
- **Access**: Protected (Participants only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "chatId": "booking123",
      "senderId": {
        "_id": "...",
        "name": "Client Name",
        "email": "client@example.com"
      },
      "receiverId": {
        "_id": "...",
        "name": "Vendor Name",
        "email": "vendor@example.com"
      },
      "text": "Hello, I want to book your service",
      "isRead": false,
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

### 2. Send Message
**POST** `/messages`
- **Description**: Send message to another user
- **Access**: Protected
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
```json
{
  "chatId": "booking123",
  "receiverId": "vendorUserId",
  "text": "Hello, I want to book your service"
}
```

### 3. Mark Chat as Read
**PATCH** `/messages/:chatId/read`
- **Description**: Mark all messages in chat as read
- **Access**: Protected
- **Headers**: `Authorization: Bearer <token>`

### 4. Get Unread Count
**GET** `/messages/count/unread`
- **Description**: Get count of unread messages for current user
- **Access**: Protected
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

## Error Response Format
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Image Upload
- Images are uploaded to Supabase Storage
- Supported formats: JPEG, PNG, GIF, WebP, SVG
- Max file size: 5MB per image
- Max images per service: 5
- Images are stored in `services/` folder
