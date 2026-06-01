# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MVP starter kit for the Ecomdy AI Hackathon 2026. A thin web app that calls the Ecomdy Marketing API to generate AI video. Intended as a starting point for hackathon ideas, not a production app. The README is written in Vietnamese (audience is hackathon participants).

## Commands

Run from repo root unless noted. The root `package.json` only orchestrates the two sub-projects via `concurrently`.

```bash
npm run install:all   # installs root + backend + frontend deps (run once after clone)
npm run dev           # runs backend (3000) + frontend (5173) together
npm run dev:backend   # NestJS only, watch mode
npm run dev:frontend  # Vite dev server only
```

Per sub-project:
- Backend build: `npm run build --prefix backend` → outputs `backend/dist`, run with `npm run start:prod --prefix backend`
- Frontend build: `npm run build --prefix frontend`

There is **no test suite, linter, or formatter configured** in any package. Do not assume `npm test` exists.

## Required setup before `npm run dev` works

Both `.env` files must exist (copied from `.env.example`):
- `backend/.env` — must contain a real `ECOMDY_API_KEY` (format `wl_live_...`). Without it every API call returns 401.
- `frontend/.env` — `VITE_API_URL=http://localhost:3000`. Vite only exposes vars prefixed `VITE_`.

## Architecture

```
React (Vite, :5173)  →  NestJS proxy (:3000)  →  Ecomdy API (api.ecomdy.co/v1)
   VideoGenerator.jsx     /api/video/*              /video/generate, /jobs/:id
```

The NestJS layer exists for one reason: keep `ECOMDY_API_KEY` server-side so it never ships to the browser. It is a pass-through proxy with light normalization — no database, no business logic. All API surface lives in `backend/src/video/` (controller → service) and the frontend's whole UI is `frontend/src/VideoGenerator.jsx`.

### The async job pattern (the core thing to understand)

Video generation takes 10–60s, so the API is two-phase and the client must poll. Getting this wrong is the most common mistake:

1. `POST /api/video/generate` returns immediately with `{ id, status: "pending" }` — **not** a video URL.
2. Frontend polls `GET /api/video/jobs/:id` every 3s (`setInterval` in `VideoGenerator.jsx`).
3. When `status === "completed"`, the response carries `output_url` (the MP4). `status` can be `pending | processing | completed | failed`.

Always `clearInterval` on completion, failure, and component unmount — the existing code does this; preserve it.

### Backend conventions that matter

- **Env is read at request time, not import time.** `video.service.ts` accesses `process.env.ECOMDY_*` via getters so values are available after `ConfigModule.forRoot({ isGlobal: true })` has loaded `.env`. Do not hoist these into module-level constants — they'll be `undefined`.
- **Response normalization is deliberate.** Ecomdy returns `{ job_id, status: "PENDING" }` (uppercase, `job_id`); the service maps to `{ id, status: "pending" }` (lowercase, `id`) and unwraps `res.data.data ?? res.data`. The frontend depends on this lowercased shape.
- **Body is passed through.** `generate()` forwards the full request body (not just `prompt`) so optional fields like `image_url` and `engine` reach Ecomdy without code changes. Controller only validates that `prompt` is a non-empty string.
- **Errors re-thrown with real status + message** via the `rethrow` helper, surfacing Ecomdy's `error.message` and HTTP status to the client.

### Frontend gotcha

The default Ecomdy engine (Symphony) requires **both** `prompt` and `image_url`. `VideoGenerator.jsx` sends `image_url` and disables the button until both are filled. A job can still come back `failed` with a message like "image_url is required for Symphony" — that error is read from `j.error.message` and shown to the user.

## Extending

The proxy currently exposes only video generate/poll. To add other Ecomdy capabilities (Dubbing, Avatar, TTS, Image-to-Video), add methods to `video.service.ts` + routes in `video.controller.ts` following the same generate/getJob shape, or create a sibling NestJS module. Keep the API key strictly server-side.
