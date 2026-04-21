# Asaan-taqreeb Backend API Documentation

## Base URL
```
/api/v1
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. AUTH Module (/auth)

### 1.1 Register (Signup)
- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "Min6Chars",
  "role": "client"
}
```
- **Rules:**
  - name: required, nonempty
  - email: required, valid email, unique
  - password: min length 6
  - role: optional (admin | vendor | client)

### 1.2 Login
- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "Min6Chars"
}
```
- **Response:**
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

### 1.3 Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Access:** Public
- **Body:**
```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

### 1.4 Logout
- **Endpoint:** `POST /auth/logout`
- **Access:** Protected
- **Body:** none

### 1.5 Get Current User
- **Endpoint:** `GET /auth/me`
- **Access:** Protected
- **Body:** none

### 1.6 Update Profile
- **Endpoint:** `PUT /auth/me`
- **Access:** Protected
- **Body:**
```json
{
  "name": "Updated Name",
  "phone": "+923001234567",
  "profileImage": "https://res.cloudinary.com/..."
}
```

### 1.7 Forgot Password (OTP Generate)
- **Endpoint:** `POST /auth/forgot-password`
- **Access:** Public
- **Body:**
```json
{
  "email": "user@example.com"
}
```

### 1.8 Verify OTP
- **Endpoint:** `POST /auth/verify-otp`
- **Access:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 1.9 Reset Password
- **Endpoint:** `POST /auth/reset-password`
- **Access:** Public
- **Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "NewPass123"
}
```

---

## 2. VENDOR Module (/vendors, /vendor/services, /vendor/availability)

### 2.1 Get All Vendors
- **Endpoint:** `GET /vendors`
- **Access:** Public
- **Response:** Array of vendors (name, email, role)

### 2.2 Vendor Services

#### Get All Services
- **Endpoint:** `GET /vendor/services`
- **Access:** Public
- **Response:** Array of services with populated vendor info and images

#### Get My Services
- **Endpoint:** `GET /vendor/services/me`
- **Access:** Protected (Vendor only)

#### Get Single Service
- **Endpoint:** `GET /vendor/services/:id`
- **Access:** Public

#### Create Service
- **Endpoint:** `POST /vendor/services`
- **Access:** Protected (Vendor only)
- **Body:**
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
      "details": "...",
      "items": ["Stage Decoration", "Sound System"]
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
- **Rules:**
  - category: BANQUET_HALL | CATERING | PHOTOGRAPHY | PARLOR_SALON
  - basicInfo.name, location: required
  - BANQUET_HALL: capacity required
  - CATERING: packages array required (min 1)
  - Unique constraint: one service per vendor per category

#### Update Service
- **Endpoint:** `PUT /vendor/services/:id`
- **Access:** Protected (Vendor only, must own service)
- **Body:** (partial update)
```json
{
  "basicInfo": { "name": "...", "location": "..." },
  "capacity": { "minGuests": 200, "maxGuests": 500 },
  "images": ["url1", "url2"]
}
```

#### Delete Service
- **Endpoint:** `DELETE /vendor/services/:id`
- **Access:** Protected (Vendor only, must own service)

### 2.3 Package Management

#### Add Package
- **Endpoint:** `POST /vendor/services/:serviceId/packages`
- **Access:** Protected (Vendor only)
- **Body:**
```json
{
  "name": "Package Name",
  "price": 250000,
  "pricePerHead": 1200,
  "guestCount": 200,
  "details": "...",
  "items": ["item1", "item2"]
}
```

#### Update Package
- **Endpoint:** `PUT /vendor/services/:serviceId/packages/:packageId`
- **Access:** Protected (Vendor only)
- **Body:** (same as add)

#### Delete Package
- **Endpoint:** `DELETE /vendor/services/:serviceId/packages/:packageId`
- **Access:** Protected (Vendor only)

### 2.4 Optional Services (Add-ons)

#### Add Optional Service
- **Endpoint:** `POST /vendor/services/:serviceId/optional-services`
- **Access:** Protected (Vendor only)
- **Body:**
```json
{
  "name": "LED Wall",
  "price": 25000,
  "details": "..."
}
```

#### Update Optional Service
- **Endpoint:** `PUT /vendor/services/:serviceId/optional-services/:addonId`
- **Access:** Protected (Vendor only)
- **Body:** (same as add)

#### Delete Optional Service
- **Endpoint:** `DELETE /vendor/services/:serviceId/optional-services/:addonId`
- **Access:** Protected (Vendor only)

### 2.5 Vendor Availability / Calendar

#### Get Vendor Availability
- **Endpoint:** `GET /vendor/availability/:vendorId?from=2026-03-01&to=2026-03-31`
- **Access:** Public
- **Query:** from, to (ISO date strings)
- **Response:** Array of blocked/booked dates with time slots

#### Block Date/Time Slot
- **Endpoint:** `PUT /vendor/availability/:date`
- **Access:** Protected (Vendor only)
- **Body:**
```json
{
  "timeSlot": {
    "from": "10:00",
    "to": "17:00"
  },
  "reason": "Maintenance"
}
```

#### Unblock Date/Time Slot
- **Endpoint:** `DELETE /vendor/availability/:date`
- **Access:** Protected (Vendor only)
- **Body:**
```json
{
  "timeSlot": {
    "from": "10:00",
    "to": "17:00"
  }
}
```

---

## 3. BOOKING Module (/bookings)

### 3.1 Create Booking
- **Endpoint:** `POST /bookings`
- **Access:** Protected (Client only)
- **Body:**
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
  "specialRequests": "Need premium lighting",
  "selectedAddons": ["LED Wall"]
}
```
- **Rules:**
  - serviceId: required, must exist
  - category: must match service category
  - packageName: must match service package
  - guestCount: >= 1, within capacity for halls
  - **CONFLICT VALIDATION:** Date + time slot must be available (no overlap with bookings or blocked slots)

### 3.2 Get My Bookings (Client)
- **Endpoint:** `GET /bookings/me`
- **Access:** Protected (Client only)
- **Response:** Array of client's bookings

### 3.3 Get Vendor's Bookings
- **Endpoint:** `GET /bookings/vendor/me`
- **Access:** Protected (Vendor only)
- **Response:** Array of bookings for vendor's services

### 3.4 Update Booking Status
- **Endpoint:** `PATCH /bookings/:id/status`
- **Access:** Protected (Vendor only, must own service)
- **Body:**
```json
{
  "status": "APPROVED",
  "rejectionReason": "Optional reason if rejecting"
}
```
- **Status Values:** PENDING | CONFIRMED | APPROVED | REJECTED | CANCELLED
- **Effect:** When approved/confirmed, time slot automatically blocked in vendor availability

---

## 4. MESSAGING Module (/messages)

### 4.1 Get Chat History
- **Endpoint:** `GET /messages/:chatId`
- **Access:** Protected (must be participant)
- **Query:** None
- **Response:** Array of messages (sorted by date)
- **Effect:** Automatically marks all received messages as read

### 4.2 Send Message
- **Endpoint:** `POST /messages`
- **Access:** Protected
- **Body:**
```json
{
  "chatId": "unique_chat_identifier",
  "receiverId": "receiver_user_id",
  "text": "Message text",
  "bookingId": "optional_booking_id"
}
```

### 4.3 Mark Chat as Read
- **Endpoint:** `PATCH /messages/:chatId/read`
- **Access:** Protected

### 4.4 Get Unread Count
- **Endpoint:** `GET /messages/count/unread`
- **Access:** Protected
- **Response:** 
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized (no token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (e.g., duplicate service, booking conflict)
- 422: Validation Error
- 500: Server Error

---

## Key Implementation Notes

### Unique Constraints
- User email must be unique
- One active vendor service per (vendor, category) combination

### Conflict Validation
- Booking creation checks for overlapping time slots on the same vendor/date
- Both blocked availability and confirmed bookings are checked

### Automatic Actions
- When booking is approved/confirmed, time slot is automatically blocked in vendor availability
- When chat history is retrieved, unread messages are automatically marked as read

### Authorization
- Client: Can only create bookings, view own bookings, send messages
- Vendor: Can create services, manage packages, view own services and bookings, update booking status
- Admin: (Available for future implementation)

---

## Database Models

### User
- _id, name, email, password, role, isActive, phone, profileImage, refreshToken, timestamps

### VendorService
- _id, user, category, basicInfo, capacity, packages, optionalServices, images, timestamps
- Unique index: (user, category)

### Booking
- _id, client, vendor, service, category, selectedPackage, guestCount, date, timeSlot, location, specialRequests, optionalAddons, pricing, status, rejectionReason, timestamps

### VendorAvailability
- _id, vendor, date, timeSlot, reason, type (BLOCKED | BOOKED), timestamps
- Index: (vendor, date)

### Message
- _id, chatId, senderId, receiverId, bookingId, text, isRead, timestamps
- Index: (chatId), (createdAt)
