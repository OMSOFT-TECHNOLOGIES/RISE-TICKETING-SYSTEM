# User Management API

> **Superseded by:** [BACKEND_API_SPEC.md § Users & Auth](./BACKEND_API_SPEC.md#2-users)

This file is retained for discoverability. All user and authentication endpoint specifications live in the unified backend spec.

## Quick Reference

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |
| POST | `/api/auth/forgot-password` |
| GET | `/api/auth/verify-reset-token/:token` |
| POST | `/api/auth/reset-password` |
| GET | `/api/users` |
| GET | `/api/users/:id` |
| POST | `/api/users` |
| PUT | `/api/users/:id` |
| PATCH | `/api/users/:id/status` |
| DELETE | `/api/users/:id` |
| GET | `/api/users/managers/active` |
| GET | `/api/users/check-username/:username` |
| GET | `/api/users/check-email/:email` |

**Frontend client:** `components/utils/api/auth.ts`, `components/utils/api/users.ts`

See [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) for models, validation rules, permission matrix, and request/response examples.
