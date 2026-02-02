# 🚀 Sneaker Drop System - Backend API

High-performance Node.js backend with real-time WebSocket updates, atomic reservations, and comprehensive Swagger documentation.

## 📦 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server for real-time updates
- **MySQL** - Relational database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Node-Cron** - Scheduled tasks
- **Swagger** - API documentation
- **Express Validator** - Request validation

## 🗂️ Project Structure

```
sneaker-drop-backend/
├── config/
│   └── database.js              # Sequelize configuration
├── models/
│   ├── index.js                 # Models export
│   ├── User.js                  # User model
│   ├── Drop.js                  # Drop model
│   ├── Reservation.js           # Reservation model
│   └── Purchase.js              # Purchase model
├── routes/
│   ├── userRoutes.js            # Auth routes
│   ├── dropRoutes.js            # Drop CRUD
│   ├── reservationRoutes.js     # Reservations
│   └── purchaseRoutes.js        # Purchases
├── controllers/
│   ├── userController.js
│   ├── dropController.js
│   ├── reservationController.js
│   └── purchaseController.js
├── middleware/
│   ├── auth.js                  # JWT middleware
│   ├── errorHandler.js          # Error handler
│   └── validators.js            # Validators
├── utils/
│   ├── cronJobs.js              # Expiration cron
│   └── socketHandlers.js        # Socket events
├── docs/
│   └── swagger.js               # Swagger config
├── index.js                     # Entry point
├── schema.sql                   # DB schema
├── package.json
├── .env
└── README.md
```

