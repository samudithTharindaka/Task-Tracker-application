# Newnop — Task Tracker Application

[![CI](https://github.com/samudithTharindaka/Task-Tracker-application/actions/workflows/ci.yml/badge.svg)](https://github.com/samudithTharindaka/Task-Tracker-application/actions/workflows/ci.yml)

**Live app:** https://task-tracker-application-topaz.vercel.app/
**Live API:** https://task-tracker-application-a9i4.onrender.com

## Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Known Limitations / Incomplete Items](#known-limitations--incomplete-items)

## Overview

Newnop is a full-stack task management app: a drag-and-drop Kanban board, a filterable/paginated list view, a project-scoped dashboard with charts, and an OpenAI-backed AI assistant that can search and manage tasks in natural language — all with real-time updates over Socket.IO and role-based access control (regular users only ever see and manage their own tasks/projects; admins see and manage everyone's). The backend is an Express/Prisma/PostgreSQL REST API; the frontend is a React/TypeScript SPA.

## Setup Instructions

### Backend setup

```bash
cd backend
cp .env.example .env   # fill in the values described below
npm install             # postinstall runs `prisma generate` automatically
npx prisma migrate dev  # applies the schema to DATABASE_URL
npm run seed             # optional — creates demo admin/user accounts + sample tasks
npm run dev               # http://localhost:4000 (health check at /health)
```

Environment variables (`backend/.env`, see `backend/.env.example`):

| Variable              | Required | Notes                                                                                   |
| --------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | yes      | Postgres connection string the app queries against (pooled connection in production).     |
| `DIRECT_URL`          | yes      | Used only by the Prisma CLI (`generate`/`migrate`) — a direct, non-pooled connection.      |
| `JWT_ACCESS_SECRET`   | yes      | Signs short-lived access tokens.                                                           |
| `JWT_REFRESH_SECRET`  | yes      | Signs longer-lived refresh tokens.                                                         |
| `JWT_ACCESS_EXPIRY`   | yes      | e.g. `15m`.                                                                                 |
| `JWT_REFRESH_EXPIRY`  | yes      | e.g. `7d`.                                                                                  |
| `PORT`                | no       | Defaults to `4000`.                                                                         |
| `OPENAI_API_KEY`      | no       | Enables the AI assistant. If unset, `POST /api/ai/chat` returns `503` — nothing else breaks. |
| `OPENAI_MODEL`        | no       | Defaults to `gpt-4o-mini`.                                                                  |

### Frontend setup

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:5173
```

### Database setup

Any Postgres instance works. Two supported paths:

- **Supabase (recommended, matches production)** — create a project, then take the **pooled connection string** (Supavisor, port `6543`) for `DATABASE_URL` and the **direct connection string** (port `5432`) for `DIRECT_URL`. The pooled connection is required on hosts without outbound IPv6 (Render, Vercel); the direct one is only used by the Prisma CLI for migrations.
- **Local Docker Postgres** — `docker compose up -d postgres` starts a local Postgres on `5432` matching `backend/.env.example`'s defaults exactly, so no env changes are needed for pure local development.

### Quickest path: `docker compose up`

```bash
docker compose up --build
```

One command, no manual env/migration steps — this builds and runs Postgres **and** the backend together. The backend image's entrypoint runs `npx prisma migrate deploy` automatically before starting, using the dev credentials already baked into `docker-compose.yml`. Backend is live at `http://localhost:4000` once it's up. Seed demo data with `docker compose exec backend npm run seed` if you want sample accounts/tasks.

This satisfies the backend + database half of "minimal setup" in one command. `docker-compose.yml` doesn't include a frontend service (a plain SPA has no server-side reason to run in Docker for local dev), so pair it with a plain `cd frontend && npm install && npm run dev`, or use the script below to get both at once.

### Native dev mode: `dev.sh` / `dev.bat`

```bash
./dev.sh          # macOS/Linux/Git Bash
# or double-click dev.bat on Windows (auto-locates Git Bash)
```

Starts local Postgres (Docker), then both the backend and frontend dev servers together, with output piped to `logs/backend.log` and `logs/frontend.log` (`tail -f` either one live). `Ctrl+C` stops backend + frontend; Postgres is left running for fast restarts (`docker compose down` to stop it fully). This is the actual one-command path to a fully running app (API + UI + DB) for day-to-day development.

## Design Decisions

### Architecture overview

A monorepo with two independent apps — `backend/` (Express API) and `frontend/` (React SPA) — no shared workspace tooling, kept deliberately simple for the project's size.

The backend follows a consistent **Routes → Controller → Service** layering inside every feature module under `backend/src/modules/{auth,tasks,projects,ai,users}/`:

- **`*.routes.js`** — wires `authenticate` (and any query/pagination) middleware, delegates to the controller.
- **`*.controller.js`** — validates the request with zod, calls the service, maps the result to an HTTP response, forwards errors to `next()`.
- **`*.service.js`** — the actual business logic and every Prisma call. Ownership/role checks live here — not in the controller — so they can't be bypassed by any other code path that calls the service directly (the AI module's tools do exactly that, reusing `tasksService`/`projectsService` rather than re-implementing access control).

The frontend composes page components (`pages/`) from smaller feature components (`components/tasks/`, `components/ai/`, etc.); all server state lives in Zustand stores (`store/`), each backed by a matching `lib/api/*.ts` module that owns the actual `axios` calls and validates every response with zod before it reaches the store.

### Why Prisma + Postgres/Supabase

Prisma's typed client and migration history give one source of truth for the schema across dev, CI, and production, and its client mocks cleanly with `jest-mock-extended`'s `mockDeep()`, which is what let the entire backend test suite run without a real database anywhere in CI. Postgres via Supabase specifically because it's a free managed instance available immediately, with a connection pooler (Supavisor) — required once the backend moved to a host (Render) without reliable outbound IPv6, since Supabase's direct connection is IPv6-only. See the `DATABASE_URL` (pooled) vs `DIRECT_URL` (direct, migrations only) split in `schema.prisma`.

### Why OData-style query conventions, not full OData compliance

`GET /api/tasks` supports a `$filter` grammar (`field eq 'value'`, combinable with `and`) and `$orderby`, deliberately **not** the full OData spec — no `$expand`, no `ne`/`gt`/`lt` operators, no nested logical grouping. The feature set only ever needed "filter by status/owner/project/label" and "sort by one or two fields"; implementing the whole spec would be a large surface area for capability nobody uses yet. The `$`-prefixed convention was kept because it reads unambiguously as a query modifier, but the parser (`backend/src/utils/odata-parser.util.js`) is a small hand-rolled implementation rather than a spec-compliant library — trading spec completeness for something easy to read, test, and extend field-by-field (adding `label` as a filterable field was a one-line change to `FILTERABLE_FIELDS`).

### RBAC approach

Ownership is enforced **server-side, in the service layer**, never trusted from the client. Two mechanisms:

1. **`isOwnerOrAdmin(user, resourceOwnerId)`** (`users.service.js`) — every single-record read/update/delete (`getTaskById`, `updateTask`, `deleteTask`, `getProjectById`, …) fetches the record first, then checks the caller's id against its `ownerId` (or admin role) before doing anything else with it.
2. **`odata-query.middleware.js`** forcibly overwrites `where.ownerId = req.user.id` on the `GET /api/tasks` list endpoint whenever the caller is a `USER` — a regular user can never see or filter by another user's `ownerId`, no matter what `$filter` they send. `ADMIN` is unrestricted.

Both the AI assistant's tools and the real-time layer call these exact same service functions rather than re-implementing the checks — there's exactly one place per resource that decides access.

### Real-time approach

Socket.IO, authenticated at the handshake with the same JWT access token used for REST calls (`backend/src/sockets/index.js`). Each connection joins a `user:<id>` room; `ADMIN` connections additionally join an `admins` room. Every task mutation calls `emitTaskEvent(event, task)`, which broadcasts to `user:<task.ownerId>` and `admins` — so the task's owner and every admin get the live update, and nobody else does. The frontend (`hooks/useRealtimeTasks.ts`) applies incoming events into the Zustand task store, keeping the Board/List views live without polling.

### Auth approach

JWT access + refresh tokens, no third-party OAuth. `POST /api/auth/login` returns a short-lived access token (15m default) and a longer-lived refresh token (7d default). The frontend's axios interceptor (`lib/api/client.ts`) automatically retries a single 401 by exchanging the refresh token for a new access token, and logs the user out if that also fails. Passwords are hashed with bcrypt (10 salt rounds); registration always creates a `USER`-role account — role is never accepted from the client.

### Validation approach (Zod)

Two independent layers. The **backend** validates every request body/params with zod in the controller layer, before a request ever reaches a service function — this is the actual security boundary, not a UX nicety. The **frontend** separately validates every API *response* with zod (`lib/api/schemas.ts`, `types/task.ts`, `types/user.ts`) — TypeScript types are compile-time only and give zero runtime guarantee that a response actually matches what the code assumes, so a mismatch now throws a clear `ZodError` (surfaced to the user as "Unexpected response from the server", logged in full to the console) instead of silently propagating malformed data into the UI.

### Logging approach (Pino)

Structured, field-object logging only — `logger.info({ userId, taskId }, 'Task created')`, never string concatenation (`backend/src/config/logger.js`). Pretty-printed in local dev, plain JSON in production (for log aggregators), silent by default in tests. Business events (task/project create/update/delete, login success/failure, 403 rejections) are logged at `info`/`warn` from inside the service/middleware layer where they actually happen. `error.middleware.js` only logs at `error` level for genuinely unexpected 500+ failures — every expected 4xx (validation, not-found, forbidden, conflict) returns before reaching that line, so `error`-level logs are reserved for things that actually need attention. No password, token, or other secret is ever logged.

## Assumptions

- A task always belongs to exactly one project — there's no "no project" state. The frontend auto-creates a default "My Board" project for a brand-new user with zero projects.
- `TaskStatus` is a fixed 4-value enum (`TODO`, `IN_PROGRESS`, `TEST`, `DONE`) at the database level. `label` is a fixed 6-value set (`Development`, `QA`, `UI/UX`, `Planing`, `Other`, `Dev Ops`) but stored as a plain string, not a DB enum, and validated at the application layer instead — two of the values contain characters (`/`, a space) that Prisma enum identifiers can't represent without per-value mapping.
- Pagination defaults to 20 items/page (max 100) via 1-indexed `page`/`limit` query params; the List page's own selector defaults to 10/page with 10/25/50/100 options.
- A task's owner never changes after creation — there's no "reassign task" concept. `ownerId` is set once from the authenticated creator; the update schema has no `ownerId` field at all.
- Registration always creates a `USER` — there's no self-service path to `ADMIN`. The two demo accounts (`alice@example.com` / `admin@example.com`, both `Password123!`, from `backend/prisma/seed.js`) are surfaced directly on the login page for reviewers.
- The AI assistant is scoped to this app's own tasks/projects only. It can search, create, and update tasks via OpenAI function calling, but a delete always requires explicit human confirmation in the UI — the model is never allowed to delete anything directly.

## Future Improvements

- Rate limiting on `/api/auth/*` (and generally) — none currently.
- Refresh-token rotation/blacklisting — a valid refresh token works until its natural expiry, with no server-side revocation.
- More granular permissions (e.g. inviting a specific collaborator to a project) rather than the current single-owner + admin-sees-everything model.
- Full OData compliance (comparison operators, nested `$filter` grouping, `$expand`) if querying needs actually grow past the current small grammar.
- Frontend automated tests — currently only the backend has a test suite.
- Code-splitting the frontend bundle (currently one large chunk; flagged by the Vite build's own size warning).
- A friendlier degraded mode for the AI assistant when the configured OpenAI key has no quota left, instead of surfacing a raw `502`.

## API Documentation

Postman collection + environment live in `backend/postman/`:

- **`TaskTracker.postman_collection.json`** — every endpoint (Auth, Tasks, Projects including rename/delete, AI Chat), a dedicated **Validation Errors (Zod)** folder exercising every Zod schema in the app (register/login/refresh, project create, task create/update, AI chat) and asserting the exact `{error: {code: 'VALIDATION_ERROR', details: [...]}}` shape `error.middleware.js` returns, an Error Scenarios folder for non-validation errors (401/404/409), and a Cleanup folder.
- **`TaskTracker.postman_environment.json`** — `baseUrl`, seeded demo credentials, and token/id variables the collection's test scripts populate automatically as you run it.

Import both into Postman, select the environment, and run the collection top-to-bottom (Register → Login populate the tokens every later request needs). Verified end-to-end via `newman` — 35/35 requests, 57/57 assertions passing.

The backend also serves live OpenAPI/Swagger docs whenever it's running: `/api-docs` (UI) and `/api-docs.json` (raw spec) — e.g. https://task-tracker-application-a9i4.onrender.com/api-docs.

## Testing

Backend only (see [Future Improvements](#future-improvements)):

```bash
cd backend
npm test               # run the full suite once
npm run test:watch     # watch mode
npm run test:coverage  # with a coverage report
```

119 tests across 13 suites:

- **`tests/unit/`** — services, middleware, and utils in isolation. Prisma, the OpenAI client, and the logger are all fully mocked (manual `__mocks__/*.js` files using `jest-mock-extended`'s `mockDeep()`) — no real database or network call anywhere in the suite.
- **`tests/integration/`** — full HTTP request/response cycles via `supertest` against the real Express `app`, still with Prisma mocked, covering auth guards, request validation, ownership/role enforcement (403s), and pagination.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`), two parallel jobs on every push/PR to `main`:

- **Backend** — install → lint (`eslint`) → test (`jest`, 119/119 must pass).
- **Frontend** — install → lint (`oxlint`) → build (`tsc -b && vite build` — a type error fails CI the same as a broken test would).

Both jobs share a `concurrency` group that cancels a superseded run when new commits land on the same branch. There's no frontend test step since there's currently no frontend test suite.

## Deployment

- **Backend** — Docker image (`backend/Dockerfile`) on **Render**: https://task-tracker-application-a9i4.onrender.com. The container's entrypoint runs `npx prisma migrate deploy` before starting the server, so schema changes ship with every deploy. Database is Supabase Postgres via the pooled connection (`DATABASE_URL`); `DIRECT_URL` (direct connection) is used only by the Prisma CLI for the migration step.
- **Frontend** — **Vercel**: https://task-tracker-application-topaz.vercel.app/, built with `VITE_API_URL` pointed at the Render backend above.
- Render's free tier spins the backend container down after inactivity — the first request after idle can take several seconds to cold-start. The login page shows a "the server is spinning up" notice specifically if login takes longer than 2 seconds, to explain that delay rather than leaving the user staring at a silent spinner.

## Known Limitations / Incomplete Items

- **Calendar page is a placeholder.** `frontend/src/pages/calendar/CalendarPage.tsx` renders a real month grid but doesn't plot tasks onto it — the page says so directly in the UI. To complete it: decide what "on the calendar" means for a task (due date only, or a range?), then render task chips into the matching day cells the same way `HomePage`'s in-progress table already pulls from the task store.
- **No refresh-token revocation** — see Future Improvements. A stolen/leaked refresh token remains valid until its 7-day expiry.
- **No rate limiting** anywhere, including login — brute-force attempts aren't throttled server-side.
- **Single-owner permission model** — no way to share a project with a specific other user short of that user being a full `ADMIN` who sees everything. A real "invite collaborator" feature would need a join table and a rework of every `isOwnerOrAdmin` call site.
- **No frontend automated tests** — manual/browser-driven verification only so far (backend has 119 automated tests).
- **AI assistant needs a live, funded OpenAI key.** An unset key cleanly returns `503`; a configured key with an exhausted quota returns `502` from the provider, surfaced to the user as a plain error toast rather than a friendlier degraded mode.
- **Comments and non-owner task "assignee" avatar identity are still partially mocked** on the frontend (`lib/mock/taskExtrasStore.ts`) — the backend has no comments table or multi-assignee concept yet; only a single real `ownerId` per task.
