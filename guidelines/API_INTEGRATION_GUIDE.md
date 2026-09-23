# Backend API Integration Guide

## Overview
The RISE frontend connects to a REST API (default `http://localhost:8081`). Core modules (auth, users, stations, unions, vehicles) have API clients in `components/utils/api/`. All other modules currently use mock data and are documented for backend implementation.

**Complete endpoint specification:** [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) — single source of truth for all 19 API domains (~120 endpoints).

---

## Configuration

### API Base URL
The API base URL is configured via environment variable in `components/utils/api/client.ts`:

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';
```

**To change for production:** set `VITE_API_BASE_URL` in `.env` or your deployment environment.

---

## Authentication Flow

### 1. Login Process
**Component:** `components/LoginPage.tsx`  
**API Endpoint:** `POST /api/auth/login`

**Flow:**
1. User enters username and password
2. Frontend calls `authApi.login(username, password)`
3. Backend validates credentials and returns JWT token + user data
4. Frontend stores token in localStorage as `rise-auth-token`
5. User data stored in AuthContext and localStorage as `rise-auth`
6. User is redirected to dashboard

**Expected Backend Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "USR123",
      "username": "john.doe",
      "email": "john.doe@rise.gov.gh",
      "fullName": "John Mensah Doe",
      "phone": "+233244123456",
      "role": "station_worker",
      "stationId": "STN001",
      "stationName": "Accra Central Station",
      "region": "Greater Accra",
      "district": "Accra",
      "permissions": ["view_dashboard", "manage_trips"]
    }
  }
}
```

### 2. Logout Process
**Component:** `components/Header.tsx`  
**API Endpoint:** `POST /api/auth/logout`

**Flow:**
1. User clicks logout button
2. Frontend calls `authApi.logout()`
3. Backend invalidates the token
4. Frontend clears localStorage (token and user data)
5. User is redirected to login page

---

## Password Reset Flow

### 1. Forgot Password
**Component:** `components/LoginPage.tsx`  
**API Endpoint:** `POST /api/auth/forgot-password`

**Flow:**
1. User clicks "Forgot Password?" link on login page
2. Dialog opens with email input field
3. User enters email address
4. Frontend calls `authApi.forgotPassword(email)`
5. Backend sends password reset email with token link
6. User receives success message (even if email doesn't exist - security)

**Expected Backend Response:**
```json
{
  "success": true,
  "message": "If an account exists for user@rise.gov.gh, you will receive a password reset link shortly."
}
```

### 2. Verify Reset Token
**Component:** `components/ResetPassword.tsx`  
**API Endpoint:** `GET /api/auth/verify-reset-token/:token`

**Flow:**
1. User clicks reset link from email: `http://localhost:3000/reset-password?token=xyz`
2. ResetPassword component extracts token from URL
3. Frontend calls `authApi.verifyResetToken(token)`
4. Backend validates token (not expired, not used, valid user)
5. If valid, show password reset form; if invalid, show error

**Expected Backend Response (Valid):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "user@rise.gov.gh",
    "expiresAt": "2026-02-02T12:00:00Z"
  }
}
```

**Expected Backend Response (Invalid):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "message": "This reset link has expired or is invalid. Please request a new one."
  }
}
```

### 3. Reset Password
**Component:** `components/ResetPassword.tsx`  
**API Endpoint:** `POST /api/auth/reset-password`

**Flow:**
1. User enters new password and confirms
2. Frontend validates password requirements
3. Frontend calls `authApi.resetPassword(token, newPassword)`
4. Backend validates token and updates password
5. Success message shown, redirect to login after 2 seconds

**Expected Backend Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now sign in with your new password."
}
```

---

## API Request Structure

### Authentication Header
All authenticated requests include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Format
All requests use JSON format with Content-Type header:

```
Content-Type: application/json
```

### Response Format
All responses follow this standard structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## API Utility Functions

### Available API Methods

#### Authentication (`authApi`)
```typescript
// Login
authApi.login(username: string, password: string)

// Logout
authApi.logout()

// Forgot Password
authApi.forgotPassword(email: string)

// Verify Reset Token
authApi.verifyResetToken(token: string)

// Reset Password
authApi.resetPassword(token: string, newPassword: string)

// Get Current User
authApi.getCurrentUser()
```

#### User Management (`userApi`)
See `components/utils/api/users.ts` — full method list in [BACKEND_API_SPEC.md § Users](./BACKEND_API_SPEC.md#2-users).

#### Stations (`stationApi`)
See `components/utils/api/stations.ts` — [BACKEND_API_SPEC.md § Stations](./BACKEND_API_SPEC.md#3-stations).

#### Unions (`unionApi`)
See `components/utils/api/unions.ts` — [BACKEND_API_SPEC.md § Unions](./BACKEND_API_SPEC.md#4-unions).

#### Vehicles (`vehicleApi`)
See `components/utils/api/vehicles.ts` — [BACKEND_API_SPEC.md § Vehicles](./BACKEND_API_SPEC.md#5-vehicles).

#### Modules awaiting backend (mock data today)
Trips, Passengers, Tickets, Drivers, Incidents, Claims, Death Traps, Accidents, Reports, Revenue, Accounts, Ratings/Complaints, Notifications, Dashboard — see [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) sections 6–19.

---

## Token Management

### Storage
- **Token Location:** `localStorage['rise-auth-token']`
- **User Data Location:** `localStorage['rise-auth']`

### Token Lifecycle
1. **Received:** Token stored on successful login
2. **Sent:** Automatically included in all authenticated requests
3. **Cleared:** Removed on logout or authentication error

### Token Expiry Handling
The backend should return a 401 Unauthorized status when the token expires. The frontend will:
1. Clear stored token
2. Clear user data
3. Redirect to login page

**Future Enhancement:** Implement automatic token refresh using refresh tokens.

---

## Error Handling

### Network Errors
If the backend is unreachable, users see:
```
"Network error. Please check your connection."
```

### HTTP Errors
HTTP error responses are handled based on status code:
- **400 Bad Request:** Validation error (show error message)
- **401 Unauthorized:** Invalid credentials or expired token (redirect to login)
- **403 Forbidden:** Insufficient permissions (show error)
- **404 Not Found:** Resource not found (show error)
- **500 Internal Server Error:** Server error (show generic error)

---

## Testing the Integration

### 1. Start Backend Server
Ensure the backend is running on `http://localhost:8081`:
```bash
# Backend should be running and listening on port 8081
curl http://localhost:8081/api/auth/login
```

### 2. Test Login
1. Open browser to `http://localhost:3000`
2. Enter username and password
3. Check browser console for API requests
4. Verify token is stored in localStorage

### 3. Test Forgot Password
1. Click "Forgot Password?" on login page
2. Enter email address
3. Check backend logs for email sending
4. Verify success message appears

### 4. Test Password Reset
1. Get reset token from backend/email
2. Navigate to `http://localhost:3000/reset-password?token=YOUR_TOKEN`
3. Verify token validation occurs
4. Enter new password and submit
5. Verify redirect to login page

### 5. Test Logout
1. Log in to the application
2. Click user menu and select "Logout"
3. Verify API call is made
4. Verify token is cleared from localStorage
5. Verify redirect to login page

---

## CORS Configuration

The backend must allow requests from the frontend origin. Add these CORS headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

For production, replace `http://localhost:3000` with your production domain.

---

## Security Considerations

### 1. Token Storage
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Tokens are automatically included in all authenticated requests
- Clear tokens immediately on logout

### 2. Password Requirements
Frontend enforces these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Backend should enforce the same requirements.

### 3. Rate Limiting
Backend should implement rate limiting:
- Login: 5 attempts per 15 minutes per IP
- Forgot Password: 3 requests per hour per email
- Password Reset: 5 attempts per hour per token

### 4. HTTPS
For production:
- Use HTTPS for all API requests
- Update API_BASE_URL to use https://

---

## Troubleshooting

### Issue: "Network error" message
**Cause:** Backend is not running or not accessible  
**Solution:** 
- Check if backend is running on port 8081
- Verify CORS configuration
- Check firewall settings

### Issue: Login fails with valid credentials
**Cause:** Backend response format doesn't match expected structure  
**Solution:** 
- Check backend response format
- Ensure response includes `success`, `data`, and `token` fields
- Check browser console for detailed error

### Issue: Token not being sent in requests
**Cause:** Token not stored or cleared prematurely  
**Solution:** 
- Check localStorage for `rise-auth-token` key
- Verify token is set after successful login
- Check for any code clearing localStorage

### Issue: Reset password link doesn't work
**Cause:** Token not extracted from URL or routing issue  
**Solution:** 
- Verify URL format: `/reset-password?token=...`
- Check browser console for errors
- Ensure token is not expired in backend

---

## Next Steps

### For Backend Developers
1. Start with [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) — all endpoints, models, permissions, and phases
2. Implement Phase 1 (P0): Auth, Users, Stations, Vehicles, Trips, Passengers, Tickets
3. Implement JWT generation/validation and data scoping by role
4. Set up email service for password reset
5. Configure CORS for frontend origin
6. Test against integrated clients in `components/utils/api/`

### For Frontend Developers
1. Monitor console for API errors during development
2. Update API_BASE_URL when deploying to production
3. Consider implementing token refresh mechanism
4. Add loading states for all API calls
5. Implement proper error boundaries

---

## API Documentation Reference

| Document | Contents |
|----------|----------|
| [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) | **All endpoints** — 19 domains, models, permissions, examples |
| [BACKEND_USER_MANAGEMENT_API.md](./BACKEND_USER_MANAGEMENT_API.md) | Quick reference → Users & Auth |
| [BACKEND_VEHICLE_MANAGEMENT_API.md](./BACKEND_VEHICLE_MANAGEMENT_API.md) | Quick reference → Vehicles & Drivers |
| [BACKEND_UNION_MANAGEMENT_API.md](./BACKEND_UNION_MANAGEMENT_API.md) | Quick reference → Unions |
