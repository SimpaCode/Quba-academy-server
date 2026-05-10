# express-server

Production-ready Express + TypeScript API server. Designed to run alongside a Next.js frontend, reading the `accessToken` cookie set by Next.js Auth and communicating with the same MongoDB instance.

---

## Stack

| Concern | Library |
|---|---|
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) via cookie |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| Validation | Zod |
| AI streaming | Groq + OpenRouter |
| Security | Helmet, CORS |

---

## Project structure

```
src/
├── config/
│   ├── db.ts              # MongoDB connection (persistent pool)
│   ├── env.ts             # Env var validation — server won't start if vars are missing
│   └── cors.ts            # CORS origin allowlist from env
│
├── middleware/
│   ├── auth.ts            # JWT cookie verification + role guard (requireRole)
│   ├── rateLimiter.ts     # Upstash sliding-window limiters + withRateLimit helper
│   ├── errorHandler.ts    # Global error handler (registered last in app.ts)
│   ├── notFound.ts        # 404 catch-all
│   └── requestLogger.ts   # Coloured request/response logger
│
├── models/
│   ├── User.ts
│   ├── Level.ts
│   ├── UserProgress.ts
│   ├── Settings.ts
│   └── RefreshToken.ts
│
├── routes/
│   ├── index.ts           # Mounts /levels /user /admin /ai
│   ├── levels/            # GET/PATCH level + mission routes
│   ├── user/              # Dashboard, progress, settings, profile, account
│   ├── admin/             # Content CRUD, billing, settings (admin-gated)
│   └── ai/                # POST /ai/explain (streaming)
│
├── services/
│   ├── progressService.ts # Progress logic (get, seed, complete, reset)
│   └── paystackService.ts # Paystack REST wrapper
│
├── utils/
│   ├── response.ts        # sendOk / sendBadRequest / sendServerError etc.
│   ├── asyncHandler.ts    # Wraps async handlers so errors reach errorHandler
│   └── dateUtils.ts       # toLocalDateString, computeLiveStreak
│
├── types/
│   ├── express.d.ts       # Augments Request with req.user
│   ├── mission.ts         # Mission / MissionProgress types
│   └── index.ts           # Shared domain types (UserRole, SubscriptionPlan…)
│
├── app.ts                 # Express app (middleware + routes wired up)
└── server.ts              # Entry point — validates env, connects DB, listens
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env
# Fill in all required values
```

### 3. Run in development

```bash
npm run dev
```

Nodemon watches `src/` and restarts on any `.ts` or `.json` change.

### 4. Build for production

```bash
npm run build       # compiles to dist/
npm start           # runs dist/server.js
```

---

## API reference

All routes are prefixed with `/api`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Liveness check |

### Levels

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/levels` | All | List levels (`?plan=pro\|team`) |
| GET | `/api/levels/:slug` | All | Level detail |
| GET | `/api/levels/:slug/current-mission` | All | First incomplete mission |
| GET | `/api/levels/:slug/missions/:missionId` | All | Mission detail + status |
| GET | `/api/levels/:slug/missions/:missionId/nav` | All | Prev/next + sidebar list |
| PATCH | `/api/levels/:slug/missions/:missionId/complete` | Student | Mark mission complete |

### User

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/user/dashboard` | All | Stats + user summary |
| GET | `/api/user/progress` | All | Full progress map |
| GET | `/api/user/settings` | All | Notification + preference settings |
| PATCH | `/api/user/settings` | All | Update settings |
| PATCH | `/api/user/profile` | All | Update name / avatar / bio |
| DELETE | `/api/user/account` | Student | Permanently delete account |
| POST | `/api/user/reset-progress` | Student | Wipe all progress |

### Admin

All admin routes require `role: admin | super_admin`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/overview` | User + level counts |
| GET | `/api/admin/content` | All levels |
| POST | `/api/admin/content` | Create level |
| GET | `/api/admin/content/:levelId` | Level detail |
| PATCH | `/api/admin/content/:levelId` | Update level |
| DELETE | `/api/admin/content/:levelId` | Delete level |
| POST | `/api/admin/content/:levelId/missions` | Add mission |
| PATCH | `/api/admin/content/:levelId/missions/:missionId` | Update mission |
| DELETE | `/api/admin/content/:levelId/missions/:missionId` | Delete mission |
| GET | `/api/admin/billing` | Subscription breakdown |
| GET | `/api/admin/settings` | App-wide settings |
| PATCH | `/api/admin/settings` | Update app settings |

### AI

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/ai/explain` | All | Streaming AI explanation (20 req/min) |

**Request body:**
```json
{ "topic": "closures", "analogy": "optional existing analogy" }
```

**Response:** `text/plain` chunked stream.

---

## Auth flow

This server **reads** the `accessToken` cookie set by the Next.js server — it never issues or refreshes tokens itself.

```
Browser → Next.js (sets httpOnly accessToken cookie)
Browser → This Express server (cookie sent automatically cross-origin)
Express → verifies JWT → attaches req.user → route handler
```

The `requireRole(roles)` middleware handles verification and role checking.

---

## Rate limiting

Two Upstash sliding-window limiters are configured:

| Limiter | Limit | Used on |
|---|---|---|
| `defaultLimiter` | 60 req / min / IP | Available for global use |
| `strictLimiter` | 20 req / min / IP | `POST /api/ai/explain` |

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are set on every rate-limited response.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 4000) | Server port |
| `NODE_ENV` | No | `development` / `production` / `test` |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | ✅ | Must match the secret used by Next.js to sign JWTs |
| `NEXT_PUBLIC_APP_URL` | ✅ | Primary allowed CORS origin |
| `NEXT_PUBLIC_APP_URL_STAGING` | No | Optional staging CORS origin |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis REST token |
| `GROQ_API_KEY` | ✅ | Groq API key |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key |
| `PAYSTACK_SECRET_KEY` | No | Required only if paystackService is used |
