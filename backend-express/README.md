# Backend Express Authentication System

## Overview
This is a secure authentication system with device ID restriction built with Express.js, Prisma, and MySQL. The system ensures that each user account can only be active on one device at a time.

## Features
- User registration and authentication
- JWT token-based authentication
- Device ID verification and restriction
- One device per account policy
- Token management and invalidation
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- Comprehensive error handling

## Prerequisites
- Node.js (v14 or higher)
- MySQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="mysql://username:password@localhost:3306/auth_db"
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=24h
   BCRYPT_ROUNDS=10
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user with device ID.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "deviceId": "unique-device-id"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "deviceId": "unique-device-id",
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/auth/login`
Login with username/email and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "deviceId": "unique-device-id"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "deviceId": "unique-device-id",
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/auth/logout`
Logout current session (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### POST `/api/auth/force-logout`
Force logout from all devices (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Force logout successful"
}
```

#### GET `/api/auth/verify`
Verify token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "deviceId": "unique-device-id"
  }
}
```

### User Routes (`/api/user`)

#### GET `/api/user/profile`
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "deviceId": "unique-device-id",
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### PUT `/api/user/device/change`
Change registered device (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "newDeviceId": "new-device-id"
}
```

**Response:**
```json
{
  "message": "Device changed successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "deviceId": "new-device-id"
  }
}
```

#### GET `/api/user/device/info`
Get device information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/user/sessions`
Get active sessions (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

## Database Schema

### User Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `deviceId`: Registered device ID
- `lastLogin`: Last login timestamp
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Token Table
- `id`: Primary key
- `token`: JWT token string
- `userId`: Foreign key to User
- `deviceId`: Device ID associated with token
- `isValid`: Token validity status
- `expiresAt`: Token expiration time
- `createdAt`: Token creation timestamp

## Security Features

1. **Password Hashing**: Uses bcrypt with configurable rounds
2. **JWT Tokens**: Secure token generation with expiration
3. **Device Restriction**: One account per device policy
4. **Rate Limiting**: Prevents brute force attacks
5. **Input Validation**: Comprehensive request validation
6. **SQL Injection Prevention**: Prisma ORM protects against SQL injection
7. **CORS Protection**: Configurable CORS settings
8. **Helmet**: Security headers for production

## Error Handling

The API returns consistent error responses with appropriate HTTP status codes:

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (device mismatch)
- `404`: Not Found
- `409`: Conflict (duplicate entries)
- `500`: Internal Server Error

## Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run db:generate`: Generate Prisma client
- `npm run db:push`: Push schema to database
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open Prisma Studio

### Testing
Use tools like Postman or curl to test the API endpoints. Make sure to include the Authorization header for protected routes.

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a secure JWT secret
3. Configure your production database
4. Set up HTTPS
5. Configure proper CORS settings
6. Set up proper logging

## Integration with Electron

This backend is designed to work with Electron desktop applications. The device ID should be generated using system information available in the Electron main process.

Example device ID generation for Electron:
```javascript
const os = require('os');
const crypto = require('crypto');

function generateDeviceId() {
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const networkInterfaces = os.networkInterfaces();
  
  // Get MAC address
  const macAddress = Object.values(networkInterfaces)
    .flat()
    .find(iface => iface.mac && iface.mac !== '00:00:00:00:00:00')?.mac;
  
  const deviceInfo = `${hostname}-${platform}-${arch}-${macAddress}`;
  return crypto.createHash('sha256').update(deviceInfo).digest('hex');
}
```

## License
This project is licensed under the ISC License.
