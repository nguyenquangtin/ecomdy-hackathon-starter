# Implementation Log: Job History (Persist & Review Videos)

**Date:** 2026-06-01 · **Branch:** `feature/dashboard-and-jobs` · **Status:** ✅ Done & verified

Implements the plan in [`job-history-feature.md`](./job-history-feature.md). Every video generation is now logged to SQLite and reviewable via a History panel in the app.

## What was built

### Backend (NestJS + Prisma + SQLite)
- **Prisma layer** — `backend/prisma/schema.prisma` with a `VideoJob` model (`id` = Ecomdy `job_id`, `prompt`, `imageUrl`, `status`, `outputUrl`, `error`, timestamps). Deps `@prisma/client` + `prisma`; `postinstall: prisma generate` so the client builds on `install:all`.
- **`PrismaService` + `@Global() PrismaModule`** (`backend/src/prisma/`) — connects on module init; imported in `app.module.ts`.
- **`video.service.ts`** — `generate()` inserts a `pending` row; `getJob()` upserts `status`/`outputUrl`/`error` on each poll; new `listJobs()` returns the 50 most recent. All DB writes are **best-effort** (try/catch + `Logger.warn`) so persistence never breaks the core generate/poll flow.
- **`video.controller.ts`** — added `GET /api/video/jobs`, declared **before** `jobs/:id` so the param route doesn't capture `/jobs`.

### Frontend (React)
- **`frontend/src/job-history.jsx`** (new) — fetches `/api/video/jobs` keyed on a `refreshKey`; renders prompt + status badge + relative time; clicking a `completed` row replays/downloads the video; empty state otherwise.
- **`VideoGenerator.jsx`** — accepts `onJobChange`, fired on new job and on completed/failed.
- **`App.jsx`** — `refresh` counter wires generator → history. **`index.css`** — history list + status-badge styles (tech-bold theme).

## Files changed

| Type | Paths |
|------|-------|
| new | `backend/prisma/schema.prisma`, `backend/prisma/migrations/*`, `backend/src/prisma/{prisma.service,prisma.module}.ts`, `frontend/src/job-history.jsx` |
| modified | `backend/package.json`, `backend/.env.example`, `backend/.gitignore`, `backend/src/app.module.ts`, `backend/src/video/{video.service,video.controller}.ts`, `frontend/src/{App,VideoGenerator}.jsx`, `frontend/src/index.css` |

## Verification

| Check | Result |
|-------|--------|
| Backend `nest build` | ✅ exit 0 |
| Frontend `vite build` | ✅ exit 0 (85 modules) |
| `prisma migrate dev --name init` | ✅ `VideoJob` table + committed migration |
| Runtime route mapping | ✅ `/jobs` before `/jobs/:id`, `PrismaModule` initialized |
| `GET /api/video/jobs` (live) | ✅ returns `[]` (Prisma connected) |

## Setup notes

- Fresh clone needs one-time DB init: `cd backend && npx prisma migrate dev --name init`.
- SQLite file: `backend/prisma/data/jobs.db` (gitignored; Prisma resolves the relative `DATABASE_URL` from the schema dir). Inspect with `npx prisma studio`.
- Migrations are committed; the `.db` file and `.env` are not.

## Notes / decisions

- DB writes best-effort (log-and-continue) — logging must never break generate/poll.
- `getJob` writes on every 3s poll; fine at MVP volume, keeps logic simple.
