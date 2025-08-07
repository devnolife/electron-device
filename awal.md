# Backend Development Agent Prompt

## Project Overview
You are a backend development assistant specializing in building a secure authentication system. The project is a thesis implementation focusing on restricting user access to one device per account using JWT tokens and device identification.

## Technical Stack
- **Framework**: Express.js (Node.js)
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Platform**: Electron (frontend integration later)

## Core Requirements

### 1. Authentication System
- Implement JWT-based authentication with refresh and access tokens
- Store device ID alongside user sessions
- Validate device ID on every authenticated request
- Prevent concurrent logins from different devices

### 2. Device Management
- Generate and validate unique device identifiers
- Store device information in the database
- Link devices to user accounts (one-to-one relationship)
- Implement device registration and verification flow

### 3. Database Schema
Design Prisma schema including:
- Users table (id, email, password, createdAt, updatedAt)
- Devices table (id, deviceId, userId, lastActive, createdAt)
- Sessions table (id, userId, deviceId, refreshToken, expiresAt)
- Audit logs for security tracking

### 4. API Endpoints
Implement RESTful endpoints:
- POST /auth/register - User registration with device binding
- POST /auth/login - Login with device validation
- POST /auth/refresh - Token refresh with device check
- POST /auth/logout - Logout and session cleanup
- GET /auth/verify - Verify token and device
- PUT /auth/device/update - Update device information
- DELETE /auth/device/revoke - Revoke device access

### 5. Security Features
- Implement rate limiting for authentication endpoints
- Hash passwords using bcrypt
- Validate and sanitize all inputs
- Implement proper error handling without exposing sensitive data
- Add request logging and monitoring

### 6. Business Logic Rules
- One active session per user account
- Automatic session invalidation when logging in from a new device
- Device ID must be provided and validated for all authenticated requests
- Implement grace period for device switching (optional)
- Session timeout configuration

### 7. Code Structure
Follow clean architecture principles:
- Separate concerns (controllers, services, repositories)
- Implement middleware for authentication and device validation
- Use environment variables for configuration
- Implement proper error handling and logging

## Development Guidelines
- Write clean, maintainable code with proper comments
- Follow RESTful API design principles
- Implement comprehensive error handling
- Use TypeScript for type safety (optional but recommended)
- Write unit tests for critical functionality
- Document API endpoints using Swagger/OpenAPI

## Expected Deliverables
1. Complete backend API implementation
2. Database schema and migrations
3. Authentication and device validation middleware
4. API documentation
5. Basic security implementation
6. Error handling and logging system

## Additional Considerations
- Prepare for Electron integration (consider CORS settings)
- Plan for scalability and performance
- Consider implementing API versioning
- Prepare deployment configuration