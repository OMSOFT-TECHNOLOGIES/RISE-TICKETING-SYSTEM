# Vehicle Management API

> **Superseded by:** [BACKEND_API_SPEC.md § Vehicles & Drivers](./BACKEND_API_SPEC.md#5-vehicles)

This file is retained for discoverability. All vehicle and driver endpoint specifications live in the unified backend spec.

## Quick Reference

| Method | Endpoint |
|--------|----------|
| GET | `/api/vehicles` |
| GET | `/api/vehicles/:id` |
| POST | `/api/vehicles` |
| PUT | `/api/vehicles/:id` |
| DELETE | `/api/vehicles/:id` |
| GET | `/api/vehicles/statistics` |
| POST | `/api/vehicles/:id/assign-driver` |
| PATCH | `/api/vehicles/:id/mileage` |
| POST | `/api/vehicles/:id/maintenance` |
| GET | `/api/drivers` |
| GET | `/api/drivers/:id` |
| POST | `/api/drivers` |
| PUT | `/api/drivers/:id` |
| PATCH | `/api/drivers/:id/status` |
| DELETE | `/api/drivers/:id` |
| GET | `/api/drivers/statistics` |
| GET | `/api/drivers/available` |

**Frontend client:** `components/utils/api/vehicles.ts`

See [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) for models, query parameters, and response schemas.
