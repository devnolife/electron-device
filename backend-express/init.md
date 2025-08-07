# Backend Authentication System with Device ID Restriction

## Project Overview
Build a secure authentication system that restricts user access to a single device using JWT tokens, device IDs, and traditional login credentials. This backend will eventually integrate with an Electron desktop application.

## Technical Stack
- **Runtime**: Node.js (JavaScript - no TypeScript)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing

## Core Requirements

### 1. Authentication Features
- User registration with username/email and password
- Login system that captures and validates device ID
- JWT token generation with device ID embedded
- Token validation middleware
- Logout functionality that invalidates tokens
- Device ID verification on each authenticated request

### 2. Device Restriction Logic
- One account can only be active on one device at a time
- Store device ID in database linked to user account
- Reject login attempts from different devices
- Option to "force logout" from other devices
- Track device information (OS, hardware ID, etc.)

### 3. Database Schema
```prisma
model User {
  id          Int       @id @default(autoincrement())
  username    String    @unique
  email       String    @unique
  password    String
  deviceId    String?
  lastLogin   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  tokens      Token[]
}

model Token {
  id          Int       @id @default(autoincrement())
  token       String    @unique
  userId      Int
  user        User      @relation(fields: [userId], references: [id])
  deviceId    String
  isValid     Boolean   @default(true)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}
```

### 4. API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with device ID
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/force-logout` - Force logout from all devices
- `GET /api/auth/verify` - Verify token validity
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/device/change` - Request device change

### 5. Security Considerations
- Implement rate limiting for login attempts
- Use HTTPS in production
- Secure JWT secret key storage
- Token expiration handling
- Refresh token mechanism
- Input validation and sanitization
- SQL injection prevention (handled by Prisma)

### 6. Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for development
- Generic error messages for production
- Device mismatch specific errors

### 7. Project Structure
```
backend-express/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── deviceMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── tokenService.js
│   │   └── deviceService.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── validators.js
│   └── app.js
├── prisma/
│   └── schema.prisma
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Implementation Guidelines

1. **Start with basic authentication**: Implement registration and login without device restrictions
2. **Add device ID validation**: Integrate device ID checking after basic auth works
3. **Implement token management**: Create, validate, and revoke tokens
4. **Add security layers**: Rate limiting, input validation, etc.
5. **Test thoroughly**: Unit tests, integration tests, and security tests
6. **Document API**: Use tools like Swagger or Postman collections

## Expected Outcomes
- Users can only access their account from one device
- Attempting to login from a different device will fail with appropriate error
- System maintains security while providing good user experience
- Backend is ready for Electron app integration