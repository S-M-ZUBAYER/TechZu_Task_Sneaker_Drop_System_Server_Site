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

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MySQL v8.0+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Create database
mysql -u root -p
CREATE DATABASE sneaker_drop_db;
SOURCE schema.sql;
exit;

# 4. Start server
npm run dev
```

**Server runs on:** http://localhost:5000
**Swagger Docs:** http://localhost:5000/api-docs

## 📊 Database Schema

### Users

- Authentication and profile data
- Bcrypt hashed passwords

### Drops

- Product information
- Stock tracking (current & initial)
- Pricing and images

### Reservations

- 60-second temporary holds
- Status tracking (active/expired/completed)
- Automatic expiration

### Purchases

- Completed transactions
- Price at purchase time
- User purchase history

## 🔌 API Endpoints

### Authentication

```
POST   /api/users/register       - Register new user
POST   /api/users/login          - Login
GET    /api/users/profile        - Get profile (protected)
```

### Drops

```
GET    /api/drops                - Get all drops
GET    /api/drops/:id            - Get single drop
POST   /api/drops                - Create drop (protected)
PUT    /api/drops/:id            - Update drop (protected)
DELETE /api/drops/:id            - Delete drop (protected)
```

### Reservations

```
POST   /api/reservations         - Reserve item (protected)
GET    /api/reservations/user    - User reservations (protected)
DELETE /api/reservations/:id     - Cancel reservation (protected)
```

### Purchases

```
POST   /api/purchases            - Complete purchase (protected)
GET    /api/purchases/user       - User purchases (protected)
GET    /api/purchases/drop/:id   - Drop purchases
```

## 🔐 Authentication

JWT-based authentication. Protected routes require:

```javascript
Authorization: Bearer <token>
```

## 📚 Swagger Documentation

Access interactive API docs at:

```
http://localhost:5000/api-docs
```

Features:

- Complete endpoint documentation
- Request/response examples
- Try-it-out functionality
- Schema definitions

## ⚡ Key Features

### 1. Atomic Reservations (Race Condition Prevention)

```javascript
// Uses database transactions with row-level locking
await sequelize.transaction(async (t) => {
  const drop = await Drop.findOne({
    where: { id: dropId },
    lock: t.LOCK.UPDATE, // Prevents concurrent access
    transaction: t,
  });

  if (drop.stock <= 0) throw new Error("Out of stock");

  drop.stock -= 1;
  await drop.save({ transaction: t });
});
```

### 2. Auto Stock Recovery (60-second Expiration)

```javascript
// Cron job runs every 10 seconds
cron.schedule("*/10 * * * * *", async () => {
  // Find expired reservations
  // Return stock to drops
  // Notify clients via WebSocket
});
```

### 3. Real-Time Updates

```javascript
// Socket.IO broadcasts
io.emit("stockUpdate", { dropId, newStock });
io.emit("reservationExpired", { reservationId });
io.emit("purchaseCompleted", { dropId, purchaser });
```

## 🧪 Testing

### Test Race Conditions

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Simulate 100 concurrent requests
ab -n 100 -c 100 -T 'application/json' \
   -H "Authorization: Bearer YOUR_TOKEN" \
   -p reservation.json \
   http://localhost:5000/api/reservations
```

### Test Stock Recovery

```bash
# 1. Create reservation
# 2. Wait 60 seconds
# 3. Check stock returned
```

## 📦 NPM Scripts

```bash
npm start      # Production server
npm run dev    # Development with nodemon
```

## 🌍 Environment Variables

Required in `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_NAME=sneaker_drop_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
RESERVATION_DURATION=60000
```

## 🚀 Deployment

### Railway

1. Create MySQL database
2. Set environment variables
3. Deploy from GitHub

### Heroku

```bash
heroku create
heroku addons:create cleardb:ignite
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

## 🐛 Troubleshooting

**Database connection failed:**

```bash
# Check MySQL is running
sudo service mysql status

# Test connection
mysql -u root -p
```

**Port already in use:**

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request


