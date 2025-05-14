# LagoTrade Authentication System

This document provides details about the authentication system implementation for LagoTrade.

## Features

- Email/Password Registration with OTP Verification
- Google OAuth Login
- JWT Authentication with Refresh Tokens
- Password Reset with OTP

## Setup Instructions

### Environment Variables

Make sure to set the following environment variables in your `.env` file:

```
# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=support@lagotrade.com
```

### Install Required Packages

```bash
npm install bcryptjs jsonwebtoken google-auth-library nodemailer crypto
```

## API Endpoints Documentation

### Registration and Email Verification

#### Register a New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "userId": "60d21b4667d0d8992e610c85"
}
```

#### Verify Email with OTP

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "userId": "60d21b4667d0d8992e610c85",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "authProvider": "local"
  }
}
```

#### Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "userId": "60d21b4667d0d8992e610c85"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification OTP resent successfully"
}
```

### Login

#### Email/Password Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (if verified):**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "authProvider": "local"
  }
}
```

**Response (if not verified):**
```json
{
  "success": false,
  "message": "Email not verified. A new verification code has been sent.",
  "userId": "60d21b4667d0d8992e610c85"
}
```

#### Google Login/Sign Up

**Endpoint:** `POST /api/auth/google`

**Request Body:**
```json
{
  "idToken": "google_id_token_from_frontend"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "authProvider": "google"
  }
}
```

### Password Reset

#### Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email"
}
```

#### Reset Password with OTP

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Token Management

#### Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Frontend Integration Guide

### Registration Flow

1. Submit user details to `/api/auth/register`
2. Receive `userId` in the response
3. Display OTP input form
4. Submit OTP with userId to `/api/auth/verify-email`
5. Upon successful verification, store the returned tokens and user info

### Login Flow

1. Submit credentials to `/api/auth/login`
2. If user is verified:
   - Store the returned tokens and user info
3. If user is not verified:
   - Display OTP verification form
   - Submit OTP with userId to `/api/auth/verify-email`

### Google Authentication Flow

1. Implement Google Sign-In button using Google's JavaScript library
2. Get the ID token from Google's response
3. Send the ID token to `/api/auth/google`
4. Store the returned tokens and user info

### Token Management

1. Store access token and refresh token securely (HttpOnly cookies or secure local storage)
2. For each API request, include the access token in the Authorization header
3. If an API request returns a 401 error, use the refresh token to get a new access token
4. If refresh token is expired or invalid, redirect to login

## Security Considerations

- All authentication endpoints should be rate-limited to prevent brute force attacks
- OTPs expire after 10 minutes
- Passwords are hashed using bcrypt before storing
- JWTs have a configurable expiry time
- Refresh tokens should be stored securely and invalidated when necessary 