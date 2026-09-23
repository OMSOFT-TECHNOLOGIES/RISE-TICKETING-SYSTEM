# Union Management API

> **Superseded by:** [BACKEND_API_SPEC.md § Unions](./BACKEND_API_SPEC.md#4-unions)

This file is retained for discoverability. All union endpoint specifications live in the unified backend spec.

## Quick Reference

| Method | Endpoint |
|--------|----------|
| GET | `/api/unions` |
| GET | `/api/unions/:id` |
| POST | `/api/unions` |
| PUT | `/api/unions/:id` |
| DELETE | `/api/unions/:id` |
| GET | `/api/unions/statistics` |
| GET | `/api/unions?status=active` |

**Frontend client:** `components/utils/api/unions.ts`  
**Permission:** `manage_unions` (super_admin, regional_manager, admin_hrm)

See [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) for models, validation rules, and response schemas.
