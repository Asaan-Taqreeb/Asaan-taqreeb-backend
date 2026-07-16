# Asaan Taqreeb (Easy Event) - Backend Server

This is the backend API and server engine for the **Asaan Taqreeb** event management ecosystem. It is built as a RESTful web service and WebSocket gateway using **Node.js, Express, and MongoDB**.

---

## 🛠️ Tech Stack & Dependencies

*   **Runtime:** Node.js (v18+)
*   **Web Framework:** [Express](https://expressjs.com/) (REST routing, middleware validation, and request parsing)
*   **Database:** MongoDB via [Mongoose](https://mongoosejs.com/) ODM
*   **Realtime Communication:** [Socket.io](https://socket.io/) (for client-vendor chat rooms, typing indicators, and message delivery)
*   **Authentication:** JSON Web Tokens (`jsonwebtoken`) and password hashing via `bcryptjs`
*   **File Storage:** [Cloudinary Node SDK](https://cloudinary.com/) (for payment receipts and portfolio image uploads)
*   **Background Jobs:** Daily cron intervals for scheduling payment reminders and purging temporary guest accounts.

---

## 📂 Server Structure

*   **`server.js`**: Main entrypoint that boots up MongoDB, launches WebSockets, configures background intervals, and starts the HTTP server.
*   **`src/`**: Primary application source:
    *   **`src/app.js`**: Configures Express middleware (CORS, Morgan, Helmet) and maps modular routes.
    *   **`src/config/`**: Shared settings for MongoDB connection and Socket.io server events.
    *   **`src/modules/`**: Modular logic directories separated by domain:
        *   `auth/`: Registration, Login, password hashing, verification, OTP routing, and account purging.
        *   `services/`: Vendor event packages, salon services, portfolio details.
        *   `booking/`: Scheduling, time-slots validation, pricing, direct payment coordination.
        *   `messages/`: Chat logs, text search, file uploads.
        *   `reviews/`: Vendor client feedback and overall rating scorecards.
    *   **`src/shared/`**: Helper middlewares (error handlers, JWT validation, multer media storage configurations).

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory matching the variables shown below:

```ini
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Cloudinary Integration (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Configuration (Optional: Client Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

---

## 🚀 Running the Server

### 1. Installation
Install all dependencies from `package.json`:
```bash
npm install
```

### 2. Start Development Build (Nodemon Hot-Reloading)
Runs the server with Nodemon to auto-restart on code changes:
```bash
npm run dev
```

### 3. Start Production Build
Runs the standard node process:
```bash
npm start
```

---

## 🧪 Database Utilities
*   **`wipe_db.js`**: Utility script to clean up collection contents during reset phases.
*   **`test_api.js`**: Local helper script to run basic API request validations.
