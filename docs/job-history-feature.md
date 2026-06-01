# Feature Plan: Persist & Review Generated Video Jobs (MVP)

## Context

The starter kit is currently stateless — `backend/src/video/` proxies Ecomdy and the React app shows only the *current* generation. After a refresh or a new generation, previous jobs and their videos are gone. The README lists "Add database (Prisma + SQLite) to store video history" as the first upgrade.

This feature logs every generation by its Ecomdy job ID into a simple SQLite database and adds a **History** panel in the app to review past prompts/statuses and replay generated videos. Scope is deliberately minimal (KISS/YAGNI): one table, one new endpoint, one new component.

**Decisions:** Storage = Prisma + SQLite. Review = History panel inside the existing React app.

## Approach

```
generate ─▶ VideoService.generate() ─▶ Ecomdy   + prisma.create(pending)
poll     ─▶ VideoService.getJob()   ─▶ Ecomdy   + prisma.upsert(status/output_url)
review   ─▶ GET /api/video/jobs     ─▶ prisma.findMany()  ─▶ History panel
```

The proxy stays a pass-through; DB writes are side-effects layered onto the two existing methods. The job ID returned by Ecomdy (`job_id`, normalized to `id`) is the primary key — no separate ID generation.

## Backend Changes (`backend/`)

### 1. Add Prisma
- Deps: `@prisma/client` (dependency), `prisma` (devDependency).
- Add `"postinstall": "prisma generate"` to `backend/package.json` so the client builds after `npm run install:all`.
- `backend/.env` + `.env.example`: add `DATABASE_URL="file:./data/jobs.db"`. Prisma resolves SQLite relative paths from the schema dir, so the file lands at `backend/prisma/data/jobs.db`.
- `backend/.gitignore`: ignore `*.db`, `*.db-journal`. Keep `/prisma/migrations` (commit migrations).

### 2. `backend/prisma/schema.prisma` (new)
```prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model VideoJob {
  id        String   @id            // Ecomdy job_id
  prompt    String
  imageUrl  String?
  status    String                  // pending|processing|completed|failed
  outputUrl String?
  error     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. `backend/src/prisma/prisma.service.ts` + `prisma.module.ts` (new, ~15 lines each)
- `PrismaService extends PrismaClient` with `onModuleInit() { await this.$connect() }`.
- `@Global() PrismaModule` exporting it; import in `app.module.ts`.

### 4. `backend/src/video/video.service.ts` (modify — inject `PrismaService`)
- In `generate()`: after normalizing to `{ id, status }`, `prisma.videoJob.create({ data: { id, prompt: body.prompt, imageUrl: body.image_url, status } })`. Wrap in try/catch so a DB failure never breaks generation (log + continue).
- In `getJob()`: after normalizing, `prisma.videoJob.upsert(...)` keyed on `id`, updating `status`, `outputUrl: d.output_url`, `error: d.error?.message ?? d.error`. Upsert (not update) guards against a missing row after a restart.
- Add `listJobs()` → `prisma.videoJob.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })`.

### 5. `backend/src/video/video.controller.ts` (modify)
- Add `@Get('jobs')` → `this.video.listJobs()`. Declare it **before** `@Get('jobs/:id')` so `/jobs` isn't captured by the `:id` param route.

### 6. `backend/src/video/video.module.ts`
- No change if `PrismaModule` is global; otherwise import it.

**One-time setup:** `cd backend && npx prisma migrate dev --name init` (creates `data/jobs.db` + client + checked-in migration).

## Frontend Changes (`frontend/`)

### 1. `frontend/src/job-history.jsx` (new, < 80 lines)
- `useEffect` on a `refreshKey` prop → `GET ${API}/api/video/jobs`.
- Render a list: prompt (truncated), a status badge, relative time. A `completed` row is clickable → plays `output_url` inline (reuse the `<video>` markup from `VideoGenerator`).
- Empty state: "No videos yet."

### 2. `frontend/src/VideoGenerator.jsx` (modify)
- Accept an `onJobChange` callback prop; call it (a) right after a successful `POST` (new pending job) and (b) on `completed`/`failed` so History reflects status transitions.

### 3. `frontend/src/App.jsx` (modify)
- Hold `const [refresh, setRefresh] = useState(0)`; pass `onJobChange={() => setRefresh(n => n + 1)}` to `VideoGenerator` and `refreshKey={refresh}` to `JobHistory`. Lay them out side-by-side / stacked.

### 4. `frontend/src/index.css` (modify)
- Add `.history`, `.history-item`, `.badge-{status}` styles consistent with the existing tech-bold theme.

## Files Touched

| Type | Path |
|------|------|
| new | `backend/prisma/schema.prisma`, `backend/src/prisma/prisma.service.ts`, `backend/src/prisma/prisma.module.ts`, `frontend/src/job-history.jsx` |
| modify | `backend/package.json`, `backend/.env(.example)`, `backend/.gitignore`, `backend/src/app.module.ts`, `backend/src/video/video.service.ts`, `backend/src/video/video.controller.ts`, `frontend/src/VideoGenerator.jsx`, `frontend/src/App.jsx`, `frontend/src/index.css` |

## Verification (End-to-End)

1. `npm run install:all` then `cd backend && npx prisma migrate dev --name init` — confirms client generates and `data/jobs.db` is created.
2. `npm run dev`; open `http://localhost:5173`.
3. Generate a video → a new **pending** row appears in History immediately, transitions `processing → completed`, and replay works on click.
4. `curl http://localhost:3000/api/video/jobs` → returns the row(s) as JSON with `output_url` populated.
5. `npx prisma studio` (optional) → visually confirm the `VideoJob` table.
6. Refresh the browser → history persists (proves DB, not in-memory state).

## Notes / Decisions

- DB writes are **best-effort** (try/catch, log-and-continue) — logging must never break the core generate/poll flow.
- `getJob` writes on every 3s poll; acceptable at MVP volume, keeps logic simple (no change-detection).
- Migrations are committed; the `.db` file is gitignored.
