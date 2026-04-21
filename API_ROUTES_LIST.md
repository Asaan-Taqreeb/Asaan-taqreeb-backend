# Complete API Routes List with Payloads

## AUTH ROUTES (/auth)

### POST /auth/register
```json
{
  "name": "User Name",
  "email": "user@example.com", 
  "password": "Min6Chars",
  "role": "client" // optional: admin | vendor | client
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "Min6Chars"
}
```

### POST /auth/refresh
```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

### POST /auth/logout
Headers: Authorization: Bearer <token>
Body: None

### GET /auth/me
Headers: Authorization: Bearer <token>
Body: None

### PUT /auth/me
Headers: Authorization: Bearer <token>
```json
{
  "name": "Updated Name",
  "phone": "+923001234567",
  "profileImage": "https://res.cloudinary.com/..."
}
```

### POST /auth/forgot-password
```json
{
  "email": "user@example.com"
}
```

### POST /auth/verify-otp
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /auth/reset-password
```json
{
  "email": "user@example.com",
  "newPassword": "NewPass123"
}
```

## VENDOR ROUTES (/vendors)

### GET /vendors
Body: None

## VENDOR SERVICES ROUTES (/vendor/services)

### GET /vendor/services
Body: None

### GET /vendor/services/:id
Body: None

### POST /vendor/services
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "category": "BANQUET_HALL", // BANQUET_HALL | CATERING | PHOTOGRAPHY | PARLOR_SALON
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

### GET /vendor/services/me
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

### PUT /vendor/services/:id
Headers: Authorization: Bearer <token> (Vendor only)
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

### DELETE /vendor/services/:id
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

### POST /vendor/services/:serviceId/images
Headers: Authorization: Bearer <token> (Vendor only)
Content-Type: multipart/form-data
Body: images (array of files, max 5)

### DELETE /vendor/services/:serviceId/images
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "imageUrl": "https://..."
}
```

## PACKAGE MANAGEMENT (/vendor/services/:serviceId/packages)

### POST /vendor/services/:serviceId/packages
Headers: Authorization: Bearer <token> (Vendor only)
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

### PUT /vendor/services/:serviceId/packages/:packageId
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "name": "Updated Package",
  "price": 600000,
  "pricePerHead": 1800,
  "guestCount": 350,
  "details": "Updated details",
  "items": ["Updated Item 1", "Updated Item 2"]
}
```

### DELETE /vendor/services/:serviceId/packages/:packageId
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

## OPTIONAL SERVICES MANAGEMENT (/vendor/services/:serviceId/optional-services)

### POST /vendor/services/:serviceId/optional-services
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "name": "Live Music",
  "price": 50000,
  "details": "Live band for 3 hours"
}
```

### PUT /vendor/services/:serviceId/optional-services/:addonId
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "name": "Updated Service",
  "price": 60000,
  "details": "Updated description"
}
```

### DELETE /vendor/services/:serviceId/optional-services/:addonId
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

## VENDOR AVAILABILITY ROUTES (/vendor/availability)

### GET /vendor/availability/:vendorId?from=2026-03-01&to=2026-03-31
Body: None

### PUT /vendor/availability/:date
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "timeSlot": {
    "from": "10:00",
    "to": "17:00"
  },
  "reason": "Maintenance"
}
```

### DELETE /vendor/availability/:date
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

## BOOKING ROUTES (/bookings)

### POST /bookings
Headers: Authorization: Bearer <token> (Client only)
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

### GET /bookings/me
Headers: Authorization: Bearer <token> (Client only)
Body: None

### GET /bookings/vendor/me
Headers: Authorization: Bearer <token> (Vendor only)
Body: None

### PATCH /bookings/:id/status
Headers: Authorization: Bearer <token> (Vendor only)
```json
{
  "status": "APPROVED", // PENDING | CONFIRMED | APPROVED | REJECTED | CANCELLED
  "rejectionReason": "Date not available" // optional, only for REJECTED status
}
```

## MESSAGES ROUTES (/messages)

### GET /messages/:chatId
Headers: Authorization: Bearer <token>
Body: None

### POST /messages
Headers: Authorization: Bearer <token>
```json
{
  "chatId": "booking123",
  "receiverId": "vendorUserId",
  "text": "Hello, I want to book your service"
}
```

### PATCH /messages/:chatId/read
Headers: Authorization: Bearer <token>
Body: None

### GET /messages/count/unread
Headers: Authorization: Bearer <token>
Body: None

## HEALTH CHECK

### GET /health
Body: None

---
**Total Routes: 32 endpoints**
**Authentication Required: 23 endpoints**
**Public Access: 9 endpoints**
