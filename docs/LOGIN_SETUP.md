# Login Feature Setup

This document explains how to set up and use the login feature in the energy portal frontend.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
BASE_URL=http://localhost:8000

# Encryption
ENCRYPTION_SECRET=your-32-character-encryption-secret-here

# Environment
NODE_ENV=development
```

### Required Environment Variables:

1. **BASE_URL**: The base URL of your authentication API
2. **ENCRYPTION_SECRET**: A 32-character secret key for encrypting/decrypting tokens
3. **NODE_ENV**: Set to "production" in production environment

## Features Implemented

### 1. Server Actions (`lib/actions/auth.ts`)
- `loginAction`: Handles user authentication
- `logoutAction`: Handles user logout
- Input validation using Zod schema
- Token encryption for security
- Cookie management for session persistence

### 2. Schema and Types (`lib/schemas/auth.ts`)
- `loginSchema`: Zod validation schema for login form
- `LoginFormData`: TypeScript type for login form data
- Centralized validation rules

### 3. Login Form (`components/LoginForm/loginForm.tsx`)
- Integrated with server action using `useActionState`
- Real-time form validation
- Error handling and display
- Loading states
- Password visibility toggle
- Responsive design

### 4. Middleware (`middleware.ts`)
- Route protection for authenticated pages
- Automatic redirects for unauthenticated users
- Prevents logged-in users from accessing login page

### 5. Token Management
- **Encryption** (`lib/encrypt.ts`): Tokens are encrypted using JWE (JSON Web Encryption)
- **Decryption** (`lib/decrypt.ts`): Utility for decrypting tokens
- **Storage**: Tokens stored in HTTP-only cookies
- **Security**: Tokens are encrypted with a secret key

## API Integration

The login feature expects the following API response format:

```json
{
  "data": {
    "access_token": "your-access-token",
    "refresh_token": "your-refresh-token"
  }
}
```

## Usage

1. **Login**: Users can log in via `/login` page
2. **Authentication**: Protected routes automatically redirect to login
3. **Session**: Tokens are automatically managed via cookies
4. **Logout**: Users can logout to clear their session

## Security Features

- HTTP-only cookies prevent XSS attacks
- Token encryption prevents token theft
- Automatic session management
- Route protection middleware
- Input validation and sanitization

## Error Handling

The login form handles various error scenarios:
- Network errors
- API errors
- Validation errors
- Authentication failures

All errors are displayed to the user with appropriate messaging. 