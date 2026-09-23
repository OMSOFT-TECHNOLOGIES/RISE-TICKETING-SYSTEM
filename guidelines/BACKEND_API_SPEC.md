# RISE Backend API Specification

**Project:** Road Incidents Support and Emergency (RISE) — Transport Management System  
**Version:** 2.0  
**Last updated:** September 2026  
**Frontend base URL:** `VITE_API_BASE_URL` (default `http://localhost:8081`)

This document is the **single source of truth** for all REST endpoints expected by the RISE frontend. It covers integrated modules (`components/utils/api/`) and mock-only modules that require backend implementation.

---

## Table of Contents

1. [Conventions](#conventions)
2. [Authentication & Authorization](#authentication--authorization)
3. [Auth Endpoints](#1-auth-endpoints)
4. [Users](#2-users)
5. [Stations](#3-stations)
6. [Unions](#4-unions)
7. [Vehicles](#5-vehicles)
8. [Drivers](#6-drivers)
9. [Trips](#7-trips)
10. [Passengers](#8-passengers)
11. [Tickets](#9-tickets)
12. [Incidents](#10-incidents)
13. [Incident Claims](#11-incident-claims)
14. [Death Traps / Road Hazards](#12-death-traps--road-hazards)
15. [Accident Analysis](#13-accident-analysis)
16. [Reports](#14-reports)
17. [Revenue Analytics](#15-revenue-analytics)
18. [Account Management / Finance](#16-account-management--finance)
19. [Ratings & Complaints](#17-ratings--complaints)
20. [Notifications & Alerts](#18-notifications--alerts)
21. [Dashboard](#19-dashboard)
22. [Integration Status](#integration-status)
23. [Implementation Priorities](#implementation-priorities)

---

## Conventions

### Base URL & Headers

```
Base URL:  http://localhost:8081
Content-Type: application/json
Authorization: Bearer <jwt>   (all authenticated routes)
```

### Response Envelope

All endpoints return this shape (frontend client: `components/utils/api/client.ts`):

**Success:**
```json
{
  "success": true,
  "data": { },
  "message": "Optional human-readable message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": { "field": "reason" }
}
```

HTTP status codes: `200/201` success · `400` validation · `401` unauthenticated · `403` forbidden · `404` not found · `409` conflict · `422` business rule · `500` server error.

### Pagination

List endpoints accept `page` (default `1`) and `limit` (default `20`, max `100`).

**Paginated response:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 142,
      "totalPages": 8
    }
  }
}
```

Collection keys may be entity-specific (`users`, `vehicles`, `trips`, etc.). Frontend `parseListResponse()` accepts either a bare array or `{ [entityKey]: T[] }`.

### Data Scoping (Required)

Backend **must** enforce scope from JWT claims — do not rely on UI filtering alone.

| Scope | Applies to roles | Filter rule |
|-------|------------------|-------------|
| Global | `super_admin`, `admin` | No geographic filter unless query param provided |
| Regional | `regional_manager` | `region = user.region` |
| District | `district_manager`, `district_incident_reporter` | `district = user.district` |
| Station | `station_worker`, `station_manager` | `stationId = user.stationId` |

### File Uploads

Use `multipart/form-data` for:
- Incident evidence (`POST /api/incidents/:id/evidence`)
- Claim medical documents (`POST /api/incident-claims/:id/documents`)
- Death trap images (`POST /api/death-traps/:id/images`)
- Transaction receipts (`POST /api/accounts/transactions/:id/receipt`)

### ID Format

Use prefixed string IDs: `USR001`, `STN001`, `VEH001`, `DRV001`, `TRP001`, `PSG001`, `TKT001`, `INC001`, `CLM001`, `HZD001`, `ACC001`, `TXN001`.

---

## Authentication & Authorization

### JWT Payload (recommended)

```json
{
  "sub": "USR001",
  "role": "station_worker",
  "stationId": "STN001",
  "region": "Greater Accra",
  "district": "Accra Metropolitan",
  "permissions": ["view_dashboard", "manage_trips"],
  "iat": 1700000000,
  "exp": 1700086400
}
```

### Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access (`permissions: ["*"]`) |
| `admin` | Administrative access; cannot manage super admins or unions/claims/death traps |
| `regional_manager` | Regional operations + unions |
| `district_manager` | District operations |
| `admin_operation` | Trips, fleet, incidents |
| `admin_hrm` | HR: drivers, basic users, unions |
| `district_incident_reporter` | Safety reporting: incidents, claims, hazards |
| `station_manager` | Station-scoped leadership: fleet, drivers, staff, trips, passengers, tickets, reports |
| `station_worker` | Station-scoped trips, passengers, tickets |

### Permission Matrix

| Permission | super_admin | admin | regional_mgr | district_mgr | admin_op | admin_hrm | incident_reporter | station_manager | station_worker |
|------------|:-----------:|:-----:|:--------------:|:------------:|:--------:|:---------:|:-----------------:|:---------------:|:--------------:|
| `view_dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `manage_stations` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| `manage_unions` | ✓ | — | ✓ | — | — | ✓ | — | — | — |
| `manage_vehicles` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| `manage_drivers` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — |
| `manage_trips` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ |
| `manage_passengers` | ✓ | ✓ | — | — | — | — | — | ✓ | ✓ |
| `view_tickets` | ✓ | ✓ | — | — | — | — | — | ✓ | ✓ |
| `view_reports` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `view_station_reports` | ✓ | — | — | — | — | — | — | ✓ | ✓ |
| `view_revenue` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `manage_finances` | ✓ | — | — | — | — | — | — | — | — |
| `manage_incidents` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| `manage_claims` | ✓ | — | — | — | — | — | ✓ | — | — |
| `view_death_traps` | ✓ | — | ✓ | ✓ | — | — | ✓ | — | — |
| `create_death_trap_reports` | ✓ | — | — | — | — | — | ✓ | — | — |
| `view_ratings_complaints` | ✓ | ✓ | — | — | — | — | — | — | — |
| `manage_users` | ✓ | — | — | — | — | — | — | — | — |
| `manage_basic_users` | ✓ | ✓ | — | — | — | ✓ | — | ✓ | — |

---

## 1. Auth Endpoints

**Frontend client:** `components/utils/api/auth.ts`  
**Integration:** Partial (profile/password change UI exists but not wired)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Authenticate user |
| POST | `/api/auth/logout` | Required | Invalidate token |
| GET | `/api/auth/me` | Required | Current session user |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| GET | `/api/auth/verify-reset-token/:token` | Public | Validate reset token |
| POST | `/api/auth/reset-password` | Public | Set new password |
| PATCH | `/api/auth/profile` | Required | Update profile *(planned)* |
| POST | `/api/auth/change-password` | Required | Change password *(planned)* |

### POST `/api/auth/login`

**Request:**
```json
{ "username": "worker", "password": "password" }
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "USR001",
      "username": "worker",
      "email": "worker@rise.gov.gh",
      "fullName": "Ama Serwaa",
      "phone": "+233244123456",
      "role": "station_worker",
      "stationId": "STN001",
      "stationName": "Accra Central Station",
      "region": "Greater Accra",
      "district": "Accra Metropolitan",
      "permissions": ["view_dashboard", "manage_trips", "manage_passengers", "view_tickets", "view_station_reports"]
    }
  }
}
```

### POST `/api/auth/forgot-password`

**Request:** `{ "email": "user@rise.gov.gh" }`  
**Response:** Always return success message (do not reveal whether email exists).

### GET `/api/auth/verify-reset-token/:token`

**Response (valid):**
```json
{
  "success": true,
  "data": { "valid": true, "email": "user@rise.gov.gh", "expiresAt": "2026-09-19T12:00:00Z" }
}
```

### POST `/api/auth/reset-password`

**Request:** `{ "token": "abc123", "newPassword": "NewPass123" }`  
**Password rules:** min 8 chars, uppercase, lowercase, number.

### GET `/api/auth/me`

Returns the same `user` object as login (refreshed permissions).

---

## 2. Users

**Frontend client:** `components/utils/api/users.ts`  
**Permission:** `manage_users` (full) or `manage_basic_users` (non-admin targets only)  
**Integration:** Wired

### User Model

```typescript
{
  id: string;
  username: string;          // lowercase, unique, 3–50 chars
  email: string;             // unique, lowercase
  fullName: string;
  phone: string;
  role: UserRole;
  stationId?: string;        // required when role = station_worker or station_manager
  stationName?: string;      // read-only
  region?: string;
  district?: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  createdAt: string;         // ISO 8601
  updatedAt?: string;
  lastLogin?: string;        // ISO 8601 — set on successful login
  lastLogout?: string;       // ISO 8601 — set on logout / session invalidation
  lastSeen?: string;         // ISO 8601 — updated on authenticated requests / heartbeat
  isOnline?: boolean;        // true when an active session exists (derived server-side)
  createdBy?: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (scoped by role) |
| GET | `/api/users/:id` | Get user |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| PATCH | `/api/users/:id/status` | Change status |
| DELETE | `/api/users/:id` | Delete/deactivate user |
| GET | `/api/users/managers/active` | Active users with roles `station_manager`, `regional_manager`, or `district_manager` (for station assignment dropdowns) |
| GET | `/api/users/form-options` | Roles, active stations, regions, and districts for the create-user form (`USER_CREATE` permission) |
| GET | `/api/users/check-username/:username` | `{ available: boolean }` |
| GET | `/api/users/check-email/:email` | `{ available: boolean }` |

### POST `/api/users`

**Request:**
```json
{
  "username": "jane.doe",
  "email": "jane.doe@rise.gov.gh",
  "fullName": "Jane Doe",
  "phone": "+233244987654",
  "role": "station_worker",
  "stationId": "STN001",
  "password": "SecurePass123"
}
```

**Rules:**
- `manage_basic_users` cannot create `admin` or `super_admin`
- `station_worker` and `station_manager` require `stationId`
- `station_manager` may use `manage_basic_users` only for users at the same `stationId` (typically `station_worker` accounts)
- Regional/district roles require `region` (and optionally `district`)

---

## 3. Stations

**Frontend client:** `components/utils/api/stations.ts`  
**Permission:** `manage_stations`  
**Integration:** Wired

### Station Model

```typescript
{
  id: string;
  name: string;
  code: string;              // unique station code
  address: string;
  city: string;
  region: string;
  district: string;
  phone: string;
  email: string;
  capacity: number;
  platformCount: number;
  managerUserId?: string;    // e.g. USR001 (dropdown value)
  managerName?: string;
  unionId?: number;
  unionName?: string;
  coordinates: { lat: number; lng: number };
  facilities: string[];
  operatingHours: { open: string; close: string };  // HH:mm
  status: 'active' | 'inactive' | 'maintenance';
  established: string;       // ISO date
  createdAt: string;
  updatedAt: string;
}
```

### Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/stations` | `page`, `limit`, `region`, `district`, `status`, `search` | List stations |
| GET | `/api/stations/:id` | — | Get station |
| POST | `/api/stations` | — | Create station |
| PUT | `/api/stations/:id` | — | Update station |
| PATCH | `/api/stations/:id/status` | — | `{ "status": "maintenance" }` |
| DELETE | `/api/stations/:id` | — | Delete station |
| GET | `/api/stations/:id/statistics` | `period=daily\|weekly\|monthly` | Station KPIs |
| GET | `/api/stations/check-code/:code` | — | Code availability |

### GET `/api/stations/:id/statistics` Response

```json
{
  "success": true,
  "data": {
    "todayTrips": 12,
    "completedTrips": 9,
    "activeVehicles": 8,
    "activeDrivers": 6,
    "todayRevenue": 5400.00,
    "passengerCount": 342,
    "pendingMaintenance": 2
  }
}
```

---

## 4. Unions

**Frontend client:** `components/utils/api/unions.ts`  
**Permission:** `manage_unions`  
**Integration:** Wired

### Union Model

```typescript
{
  id: string;
  name: string;
  acronym: string;
  description: string;
  region: string;
  established: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/unions` | `region`, `search`, `status`, `page`, `limit` | List unions |
| GET | `/api/unions/:id` | — | Get union |
| POST | `/api/unions` | — | Create union |
| PUT | `/api/unions/:id` | — | Update union |
| DELETE | `/api/unions/:id` | — | Delete union |
| GET | `/api/unions/statistics` | `region` | Aggregate stats |

**Active unions shortcut:** `GET /api/unions?status=active&limit=500` (used by station forms). List/detail readable by `super_admin`, `admin`, `regional_manager`, and `district_manager`.

---

## 5. Vehicles

**Frontend client:** `components/utils/api/vehicles.ts`  
**Permission:** `manage_vehicles`  
**Integration:** Wired

### Vehicle Model

```typescript
{
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: 'bus' | 'trotro' | 'taxi' | 'truck' | 'mini-bus' | 'van' | 'coach';
  capacity: number;
  stationId: string;
  stationName?: string;
  driverId?: string;
  driverName?: string;
  status: 'active' | 'maintenance' | 'inactive' | 'out_of_service' | 'broken_down';
  mileage: number;
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  lastMaintenance: string;
  nextMaintenance: string;
  insuranceExpiry: string;
  roadworthyExpiry: string;
  createdAt: string;
  updatedAt: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List (`status`, `search`, `page`, `limit`, `stationId`) |
| GET | `/api/vehicles/:id` | Get vehicle |
| POST | `/api/vehicles` | Register vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Remove vehicle |
| GET | `/api/vehicles/statistics` | Fleet KPIs |
| POST | `/api/vehicles/:id/assign-driver` | `{ "driverId": "DRV001" }` |
| PATCH | `/api/vehicles/:id/mileage` | `{ "mileage": 45200 }` |
| POST | `/api/vehicles/:id/maintenance` | Record maintenance event |

### POST `/api/vehicles/:id/maintenance`

```json
{
  "type": "scheduled",
  "description": "Oil change and brake inspection",
  "cost": 850.00,
  "performedBy": "AutoCare Ghana",
  "mileageAtService": 45000,
  "nextServiceDate": "2026-12-01"
}
```

---

## 6. Drivers

**Frontend:** `components/DriverManagement.tsx` (mock)  
**Permission:** `manage_drivers`  
**Integration:** Not wired

### Driver Model

```typescript
{
  id: string;
  name: string;
  licenseNumber: string;
  licenseClass: string;
  phone: string;
  email?: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  stationId: string;
  unionId?: string;
  status: 'active' | 'suspended' | 'on_leave' | 'terminated' | 'training';
  licenseExpiry: string;
  medicalCertExpiry: string;
  emergencyContact: { name: string; phone: string; relationship: string };
  currentVehicleId?: string;
  experience?: number;
  rating?: number;
  totalTrips?: number;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List (`stationId`, `status`, `search`, `page`, `limit`) |
| GET | `/api/drivers/:id` | Get driver |
| POST | `/api/drivers` | Register driver |
| PUT | `/api/drivers/:id` | Update driver |
| PATCH | `/api/drivers/:id/status` | `{ "status": "suspended" }` |
| DELETE | `/api/drivers/:id` | Terminate driver |
| GET | `/api/drivers/statistics` | Driver KPIs |
| GET | `/api/drivers/available` | Active drivers for trip assignment (`stationId`) |

---

## 7. Trips

**Frontend:** `components/TripBooking.tsx` (mock)  
**Permission:** `manage_trips` (station-scoped for workers)  
**Integration:** Not wired

### Trip Model

```typescript
{
  id: string;
  vehicleId: string;
  driverId: string;
  fromStationId: string;
  toStationId: string;
  route: string;             // display label e.g. "Accra → Kumasi"
  departureTime: string;       // ISO 8601
  arrivalTime?: string;
  estimatedDuration: number; // minutes
  distance: number;          // km
  baseFare: number;
  tier: 1 | 2 | 3;
  tierPenalty: number;
  totalFare: number;
  capacity: number;
  bookedSeats: number;
  status: 'scheduled' | 'booking' | 'full' | 'on_road' | 'arrived' | 'broken_down' | 'rescheduled' | 'offloaded';
  speedStatus?: string;
  stationId: string;
  createdAt: string;
  createdBy: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List (`stationId`, `status`, `date`, `search`, `page`, `limit`) |
| GET | `/api/trips/:id` | Get trip with passenger summary |
| POST | `/api/trips` | Schedule new trip |
| PUT | `/api/trips/:id` | Update trip |
| PATCH | `/api/trips/:id/status` | Status transition |
| DELETE | `/api/trips/:id` | Cancel trip |
| POST | `/api/trips/:id/book` | Book passenger onto trip |
| GET | `/api/trips/statistics` | Trip KPIs (`stationId`, `period`) |
| GET | `/api/trips/tier-info` | Fare tier calculation (`fare`, `passengerCount`) |

### POST `/api/trips`

```json
{
  "routeFrom": "Accra Central",
  "routeTo": "Kumasi Main",
  "departureDate": "2026-09-20",
  "departureTime": "08:00",
  "vehicleId": "VEH001",
  "driverId": "DRV001",
  "fare": 45.00
}
```

### POST `/api/trips/:id/book`

```json
{
  "passengerName": "Joseph Akwetey",
  "passengerPhone": "+233241234567",
  "passengerEmail": "joseph@email.com",
  "seats": 1,
  "seatPreference": "window",
  "paymentMethod": "cash",
  "notes": ""
}
```

---

## 8. Passengers

**Frontend:** `components/PassengerManagement.tsx` (mock)  
**Permission:** `manage_passengers`  
**Integration:** Not wired

### Passenger Registry Model

```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  idType: string;
  idNumber: string;
  address?: string;
  dateOfBirth?: string;
  gender: string;
  emergencyContact?: string;
  registrationDate: string;
  totalTrips: number;
}
```

### Trip Manifest Entry

Extends registry fields with: `tripId`, `seatNumber`, `ticketId`, `boardingPoint`, `dropoffPoint`, `fare`, `status` (`checked-in` | `boarded` | `no-show`), `bookingDate`.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passengers` | Registry list (`search`, `page`, `limit`) |
| GET | `/api/passengers/:id` | Get passenger |
| POST | `/api/passengers` | Register passenger |
| PUT | `/api/passengers/:id` | Update passenger |
| GET | `/api/trips/:tripId/passengers` | Trip manifest (`status`, `search`) |
| POST | `/api/trips/:tripId/passengers` | Add passenger to trip |
| PATCH | `/api/trips/:tripId/passengers/:id/status` | Check-in / board / no-show |
| GET | `/api/trips/:tripId/passengers/export` | Export manifest (`format=csv\|excel`) |

### POST `/api/trips/:tripId/passengers`

```json
{
  "name": "Mary Osei",
  "phone": "+233269876543",
  "email": "mary.osei@email.com",
  "seatNumber": "B05",
  "boardingPoint": "Circle",
  "dropoffPoint": "Kejetia",
  "fare": 45.00
}
```

---

## 9. Tickets

**Frontend:** `components/PassengerTickets.tsx` (mock)  
**Permission:** `view_tickets` (station-scoped)  
**Integration:** Not wired

### Ticket Model

```typescript
{
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime?: string;
  seatNumber: string;
  fare: number;
  bookingDate: string;
  vehicle: string;
  driver: string;
  status: 'confirmed' | 'pending' | 'used' | 'cancelled';
  qrCode: string;
  token: string;             // public e-ticket access token
  eTicketUrl: string;        // {APP_URL}/e-ticket/{token}
  smsStatus: 'sent' | 'failed' | 'pending';
  smsSentAt?: string;
  stationId: string;
  stationName: string;
  notes?: string;
  rating?: number;
  ratingDate?: string;
  complaint?: ComplaintRef | null;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List (`stationId`, `status`, `search`, `page`, `limit`) |
| GET | `/api/tickets/:id` | Get ticket |
| POST | `/api/tickets/:id/send-sms` | Resend e-ticket URL via SMS |
| PATCH | `/api/tickets/:id/status` | Cancel or mark used |
| GET | `/api/tickets/:id/print` | PDF/QR download |
| POST | `/api/tickets/:id/rating` | `{ "rating": 4 }` |
| POST | `/api/tickets/:id/complaint` | File complaint |
| GET | `/api/tickets/statistics` | Ticket KPIs |

### Automatic E-Ticket + SMS (on passenger booking)

When a passenger is booked via `POST /api/trips/:tripId/passengers` or `POST /api/trips/:id/book`, the backend **must**:

1. Create a ticket record with a unique `token`
2. Generate public URL: `{APP_URL}/e-ticket/{token}`
3. Send SMS to `passengerPhone` with the e-ticket link
4. Return ticket in response with `eTicketUrl`, `smsStatus`, `smsSentAt`

**SMS message template:**
```
RISE Travel: Hi {name}, your e-ticket {ticketId} for {routeFrom} → {routeTo} ({departure}) is ready. View ticket: {eTicketUrl}
```

### POST `/api/tickets/:id/send-sms` (resend)

**Request:**
```json
{
  "phone": "+233241111111",
  "message": "...",
  "eTicketUrl": "https://rise.gov.gh/e-ticket/abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "smsStatus": "sent", "smsSentAt": "2026-09-18T13:00:00Z" }
}
```

### GET `/e-ticket/:token` (public, no auth)

Returns ticket details for passenger mobile view. Frontend route: `ETicketPage`.

---

## 10. Incidents

**Frontend:** `components/IncidentManagement/` (mock)  
**Permission:** `manage_incidents` or role `district_incident_reporter`  
**Integration:** Not wired

### Incident Model

```typescript
{
  id: string;
  title: string;
  description: string;
  type: 'accident' | 'breakdown' | 'theft' | 'violence' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedAt: string;
  reportedBy: string;
  location: string;
  coordinates?: { lat: number; lng: number; address?: string };
  region: string;
  district: string;
  vehicleRegNumber?: string;
  driverName?: string;
  passengersInvolved?: number;
  injuriesReported?: number;
  fatalitiesReported?: number;
  policeReportNumber?: string;
  assignedTo?: string;
  contactNumber?: string;
  contactEmail?: string;
  evidenceFiles?: string[];
  estimatedDamage?: number;
  insuranceClaimNumber?: string;
  weatherConditions?: string;
  roadConditions?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  witnesses?: string[];
  emergencyServices?: string[];
  updatedAt: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List (`search`, `type`, `status`, `severity`, `region`, `district`, `page`, `limit`) |
| GET | `/api/incidents/:id` | Get incident |
| POST | `/api/incidents` | Report incident |
| PUT | `/api/incidents/:id` | Update incident |
| PATCH | `/api/incidents/:id/status` | `{ "status": "investigating", "assignedTo": "USR005" }` |
| DELETE | `/api/incidents/:id` | Delete (admin+) |
| GET | `/api/incidents/statistics` | KPI dashboard |
| GET | `/api/incidents/map` | GeoJSON for map view |
| POST | `/api/incidents/:id/evidence` | Upload evidence (multipart) |

### GET `/api/incidents/statistics`

```json
{
  "success": true,
  "data": {
    "total": 48,
    "reported": 12,
    "investigating": 8,
    "resolved": 24,
    "critical": 3,
    "high": 9
  }
}
```

---

## 11. Incident Claims

**Frontend:** `components/IncidentClaims.tsx` (mock)  
**Permission:** `manage_claims` or `district_incident_reporter`  
**Integration:** Not wired

### Claim Model

```typescript
{
  id: string;
  incidentId: string;
  claimantName: string;
  claimantPhone: string;
  claimantId: string;
  injuryType: 'minor' | 'moderate' | 'severe';
  compensationAmount: number;
  description: string;
  medicalReports: string[];
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentDate?: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incident-claims` | List (`search`, `status`, `incidentId`, `page`, `limit`) |
| GET | `/api/incident-claims/:id` | Get claim |
| POST | `/api/incident-claims` | Submit claim |
| PATCH | `/api/incident-claims/:id/status` | Approve / reject / pay |
| GET | `/api/incident-claims/statistics` | Claim KPIs |
| POST | `/api/incident-claims/:id/documents` | Upload medical reports |

---

## 12. Death Traps / Road Hazards

**Frontend:** `components/DeathTrapReporting/` (mock)  
**Permission:** `view_death_traps`, `create_death_trap_reports`, or `district_incident_reporter`  
**Integration:** Not wired

### Hazard Types

`fatal_pothole` · `faulty_bridge` · `broken_down_vehicle` · `faulty_vehicle` · `material_roadside` · `no_caution_sign` · `zebra_crossing_faded` · `faulty_streetlight`

### Hazard Model

```typescript
{
  id: string;
  type: HazardType;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: string;
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  images?: string[];
  affectedRoutes: string[];
  estimatedRepairCost?: number;
  priorityScore: number;     // computed server-side
  assignedTo?: string;
  resolvedAt?: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/death-traps` | List (`search`, `type`, `severity`, `status`, `region`, `page`, `limit`) |
| GET | `/api/death-traps/:id` | Get hazard |
| POST | `/api/death-traps` | Report hazard |
| PUT | `/api/death-traps/:id` | Update details |
| PATCH | `/api/death-traps/:id/status` | Workflow update |
| GET | `/api/death-traps/statistics` | KPIs |
| POST | `/api/death-traps/:id/images` | Upload images |

**Priority score:** Backend should compute from severity, affected routes, and hazard type (frontend reference: `calculatePriorityScore` in `DeathTrapReporting/constants.ts`).

---

## 13. Accident Analysis

**Frontend:** `components/AccidentAnalysis/` (mock)  
**Permission:** `view_reports` or `manage_incidents` (UI also allows `district_incident_reporter`)  
**Integration:** Not wired

### Accident Model

```typescript
{
  id: string;
  tripId: string;
  date: string;
  location: string;
  severity: 'minor' | 'major' | 'critical';
  vehicleId: string;
  driverId: string;
  driverName: string;
  route: string;
  passengersAboard: number;
  injuries: number;
  fatalities: number;
  description: string;
  cause: string;
  weatherConditions: string;
  roadConditions: string;
  timeOfDay: string;
  reportedBy: string;
  stationId: string;
  status: 'pending' | 'investigated' | 'under_investigation' | 'closed';
  insuranceClaim: 'approved' | 'processing' | 'pending' | 'denied';
  cost: number;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accidents` | Registry list (`search`, `severity`, `status`, `stationId`, `page`, `limit`) |
| GET | `/api/accidents/:id` | Get accident |
| POST | `/api/accidents` | Report accident |
| PUT | `/api/accidents/:id` | Update investigation |
| PATCH | `/api/accidents/:id/status` | Status change |
| GET | `/api/accidents/statistics` | KPIs (`period`) |
| GET | `/api/accidents/analytics/trends` | Monthly trends (`from`, `to`) |
| GET | `/api/accidents/analytics/severity` | Severity distribution |
| GET | `/api/accidents/analytics/causes` | Cause breakdown |
| POST | `/api/accidents/export` | Export registry `{ "format": "csv" }` |
| POST | `/api/accidents/reports/:templateId` | Generate report (`safety`, `monthly`, `vehicle`) |

---

## 14. Reports

**Frontend:** `components/Reports.tsx` (mock)  
**Permission:** `view_reports`  
**Integration:** Not wired

### Report Types

`financial` · `operations` · `passenger` · `performance`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/overview` | Overview KPIs |
| GET | `/api/reports/financial` | Financial tab data |
| GET | `/api/reports/operations` | Operations tab data |
| GET | `/api/reports/performance` | Route performance data |
| POST | `/api/reports/generate` | Export report |
| POST | `/api/reports/email` | Email report to recipients |

**Common query params:** `from`, `to`, `stationId`, `route`

### POST `/api/reports/generate`

```json
{
  "type": "operations",
  "format": "pdf",
  "from": "2026-08-01",
  "to": "2026-08-31",
  "stationId": "STN001",
  "route": "accra-kumasi"
}
```

---

## 15. Revenue Analytics

**Frontend:** `components/Revenue.tsx` (mock)  
**Permission:** `view_revenue`  
**Integration:** Not wired

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revenue/summary` | Period summary (`period`, `from`, `to`, `stationId`) |
| GET | `/api/revenue/by-station` | Station breakdown |
| GET | `/api/revenue/by-route` | Route breakdown |
| GET | `/api/revenue/payment-methods` | Payment method mix |
| GET | `/api/revenue/export` | Export (`format`, `period`) |

### GET `/api/revenue/summary` Response

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "totalRevenue": 245000.00,
    "tripRevenue": 220000.00,
    "penalties": 8500.00,
    "fuelCosts": 42000.00,
    "maintenanceCosts": 18500.00,
    "profit": 184500.00,
    "tripCount": 1240,
    "avgFarePerTrip": 177.42
  }
}
```

---

## 16. Account Management / Finance

**Frontend:** `components/AccountManagement/` (mock)  
**Permission:** `view_revenue`, `manage_finances` (super_admin)  
**Integration:** Not wired

### Transaction Model

```typescript
{
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  source?: string;
  recipient?: string;
  date: string;
  status: 'completed' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  receipt?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}
```

**Expense categories:** Salary, Claims, Gadgets, Stationary, Public Sensitization, Incident Resolution, Monitoring  
**Revenue categories:** Station Fees, Union Dues, District Allocations, Regional Grants, Licensing Fees, Fines and Penalties, Other Revenue

### Revenue Source Model

```typescript
{
  id: string;
  name: string;
  type: 'station' | 'union' | 'district' | 'region';
  region: string;
  district?: string;
  contactPerson: string;
  phone: string;
  totalContribution: number;
  monthlyTarget: number;
  status: 'active' | 'inactive';
  lastPayment: string;
  createdAt: string;
}
```

### Budget Model

```typescript
{
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  period: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'exceeded' | 'completed';
  approvedBy: string;
  createdAt: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/statistics` | Financial KPIs (`period`) |
| GET | `/api/accounts/transactions` | List transactions |
| POST | `/api/accounts/transactions` | Create transaction |
| PATCH | `/api/accounts/transactions/:id/status` | Approve/reject |
| GET | `/api/accounts/revenue-sources` | List revenue sources |
| POST | `/api/accounts/revenue-sources` | Create source |
| PUT | `/api/accounts/revenue-sources/:id` | Update source |
| GET | `/api/accounts/budgets` | List budgets |
| POST | `/api/accounts/budgets` | Create budget |
| GET | `/api/accounts/analytics/trends` | Monthly revenue/expense/profit (`year`) |
| GET | `/api/accounts/analytics/expense-breakdown` | By category (`period`) |
| POST | `/api/accounts/reports/export` | Export `{ "format", "tab" }` |

---

## 17. Ratings & Complaints

**Frontend:** `components/RatingsComplaints/` (mock)  
**Permission:** `view_ratings_complaints` or `view_reports`  
**Integration:** Not wired

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ratings` | List ratings (`search`, `stationId`, `page`, `limit`) |
| GET | `/api/complaints` | List complaints (`search`, `status`, `priority`, `category`, `stationId`) |
| GET | `/api/complaints/:id` | Get complaint |
| PATCH | `/api/complaints/:id/respond` | `{ "response": "...", "status": "resolved" }` |
| GET | `/api/feedback/statistics` | KPIs |
| GET | `/api/feedback/analytics/rating-trends` | Monthly avg rating |
| GET | `/api/feedback/analytics/rating-distribution` | Star distribution |
| GET | `/api/feedback/analytics/complaint-categories` | Category breakdown |
| POST | `/api/feedback/export` | `{ "type": "ratings", "format": "csv" }` |

**Complaint categories:** vehicle_condition, driver_behavior, delay, trip_cancellation, customer_service, pricing, safety, other

---

## 18. Notifications & Alerts

**Frontend:** `components/NotificationSystem.tsx` (client-side mock)  
**Permission:** Authenticated  
**Integration:** Not wired

### Notification Model

```typescript
{
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'maintenance' | 'complaint' | 'payment' | 'system' | 'info';
  read: boolean;
  timestamp: string;
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | User notifications (`unreadOnly`, `type`, `page`, `limit`) |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all read |
| GET | `/api/alerts` | System-wide alerts |
| POST | `/api/alerts/:id/dismiss` | Dismiss alert |

**Optional:** WebSocket at `/ws/notifications` for real-time booking, maintenance, and complaint events.

---

## 19. Dashboard

**Frontend:** `components/Dashboard.tsx` (mock)  
**Permission:** `view_dashboard` / `view_station_reports`  
**Integration:** Not wired

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/admin` | Admin/regional KPIs (`period=daily\|monthly\|yearly`) |
| GET | `/api/dashboard/station` | Station worker KPIs (`stationId`, `period`) |
| GET | `/api/dashboard/charts/trips-revenue` | Time-series chart data |
| GET | `/api/dashboard/charts/regions` | Regional distribution |
| GET | `/api/dashboard/activities` | Recent activity feed (`limit`, `stationId`) |
| GET | `/api/dashboard/user-activity` | **Super admin only** — online users, last seen, login/logout |

### GET `/api/dashboard/user-activity`

**Permission:** `super_admin` only

Returns session visibility for all users. Backend should update `lastLogin` on login, `lastLogout` on logout, and `lastSeen` on authenticated API calls or a session heartbeat. `isOnline` should be `true` when a valid session/token exists (or last seen within a configurable window, e.g. 5 minutes).

```json
{
  "success": true,
  "data": {
    "activeUsers": 8,
    "totalTracked": 156,
    "users": [
      {
        "id": "USR001",
        "fullName": "Jane Doe",
        "username": "jane.doe",
        "role": "admin",
        "status": "active",
        "isOnline": true,
        "lastSeen": "2026-09-18T14:30:00.000Z",
        "lastLogin": "2026-09-18T08:00:00.000Z",
        "lastLogout": "2026-09-17T18:00:00.000Z"
      }
    ]
  }
}
```

**Fallback:** `GET /api/users` may include `lastLogin`, `lastLogout`, `lastSeen`, and `isOnline` on each user when the dedicated dashboard endpoint is unavailable.

### GET `/api/dashboard/admin` Response

```json
{
  "success": true,
  "data": {
    "totalUsers": 156,
    "totalStations": 24,
    "totalVehicles": 89,
    "totalTrips": 1240,
    "monthlyRevenue": 245000,
    "activeIncidents": 7
  }
}
```

### GET `/api/dashboard/station` Response

```json
{
  "success": true,
  "data": {
    "stationVehicles": 8,
    "todayTrips": 12,
    "completedTrips": 9,
    "stationRevenue": 5400,
    "activeDrivers": 6,
    "pendingMaintenance": 2
  }
}
```

---

## Integration Status

| Domain | API Client | UI Wired | Priority |
|--------|:----------:|:--------:|:--------:|
| Auth | ✓ | Partial | P0 |
| Users | ✓ | ✓ | P0 |
| Stations | ✓ | ✓ | P0 |
| Unions | ✓ | ✓ | P1 |
| Vehicles | ✓ | ✓ | P0 |
| Drivers | — | Mock | P1 |
| Trips | — | Mock | P0 |
| Passengers | — | Mock | P0 |
| Tickets | — | Mock | P0 |
| Incidents | — | Mock | P1 |
| Incident Claims | — | Mock | P2 |
| Death Traps | — | Mock | P1 |
| Accidents | — | Mock | P2 |
| Reports | — | Mock | P2 |
| Revenue | — | Mock | P2 |
| Accounts | — | Mock | P3 |
| Ratings/Complaints | — | Mock | P2 |
| Notifications | — | Mock | P2 |
| Dashboard | — | Mock | P1 |

---

## Implementation Priorities

### Phase 1 — Core Operations (P0)
Auth, Users, Stations, Vehicles, Trips, Passengers, Tickets

### Phase 2 — Safety & Fleet (P1)
Drivers, Incidents, Death Traps, Dashboard, Unions

### Phase 3 — Analytics & Feedback (P2)
Accidents, Reports, Revenue, Ratings/Complaints, Incident Claims, Notifications

### Phase 4 — Finance (P3)
Account Management (transactions, budgets, revenue sources)

---

## Security Requirements

1. **JWT expiry:** Access token 8h; refresh token 7d (recommended).
2. **Rate limiting:** Login 5/15min/IP · Forgot password 3/hour/email · Reset 5/hour/token.
3. **CORS:** Allow frontend origin (`http://localhost:5173` dev, production domain in prod).
4. **HTTPS:** Required in production.
5. **Input validation:** Mirror frontend rules; reject unknown enum values.
6. **Audit log:** Record create/update/delete on users, incidents, claims, and financial transactions.

---

## Related Documents

- [API Integration Guide](./API_INTEGRATION_GUIDE.md) — frontend wiring and testing
- Legacy domain docs (superseded by this file):
  - [BACKEND_USER_MANAGEMENT_API.md](./BACKEND_USER_MANAGEMENT_API.md)
  - [BACKEND_VEHICLE_MANAGEMENT_API.md](./BACKEND_VEHICLE_MANAGEMENT_API.md)
  - [BACKEND_UNION_MANAGEMENT_API.md](./BACKEND_UNION_MANAGEMENT_API.md)
