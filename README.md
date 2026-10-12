# GoodHuman

Marketplace for booking live artists. Product name **GoodHuman**, domain **GoodHuman.IO**.

This repository follows `PLAN`. Phase 1 is implemented: monorepo skeleton, auth/roles, artist profiles, public search, travel flag, availability, inquiry chat, and private media with watermarked previews.

## Stack

| Area | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript | Everywhere |
| Web | Next.js App Router (`apps/web`) | Marketing + product |
| Mobile | Expo (`apps/mobile`) | Skeleton in Phase 1; EAS for builds |
| API | **Hono** (`apps/api`) | Picked over NestJS for a smaller surface and fast OpenAPI/HTTP iteration |
| Shared | Zod (`packages/shared`) | Quote/review schemas reserved for later phases |
| Data | PostgreSQL + Prisma | Migrations checked in |
| Jobs | Redis + BullMQ | Watermark worker; upload also falls back to inline processing |
| Storage | S3-compatible interface | Local filesystem adapter for Phase 1 (`STORAGE_DRIVER=local`). Swap to S3/MinIO without changing route code. |
| Payments / AI / OAuth | Not in Phase 1 | Tables for Quote, Booking, DealSheet, Payment exist; no UI yet |

## Monorepo layout

```
apps/web       Next.js
apps/api       Hono HTTP API + worker
apps/mobile    Expo skeleton
packages/shared  Zod schemas / shared types
```

## Local setup

Requirements: Node 22+, pnpm 10, PostgreSQL 16, Redis 7.

```bash
cp .env.example .env
# or use docker compose for postgres/redis/minio:
# docker compose up -d

pnpm install
pnpm --filter @goodhuman/shared build
pnpm --filter @goodhuman/api db:generate
pnpm --filter @goodhuman/api exec prisma migrate dev --name init
pnpm db:seed

# terminal 1
pnpm --filter @goodhuman/api dev
# terminal 2 (optional watermark worker)
pnpm --filter @goodhuman/api dev:worker
# terminal 3
pnpm --filter @goodhuman/web dev
```

Seed accounts:

- Artist: `artist@goodhuman.test` / `password123`
- Booker: `booker@goodhuman.test` / `password123`

OpenAPI: `GET http://localhost:4000/openapi.json`

## Phase 1 acceptance

- Artist signs up and publishes with city, category, one image, travel flag, and an open date.
- Booker searches that city/category and opens the profile.
- Booker sends an inquiry; artist replies in the thread.
- Booker cannot see the artist email on public surfaces.
- Uploaded image public URL is a watermarked preview; original is signed/private only.

```bash
pnpm --filter @goodhuman/api test
```

## Config

Fees, premium price, deposit default, payout delay, and file limits live in `apps/api/src/config.ts` and environment variables. The web UI reads `GET /config` rather than hardcoding magic numbers for product economics.

## Visual direction

Calm tool for artists: off-white ground, near-black ink, single green accent. Act name and next booking are the loudest elements on the artist home.

## Out of scope until later phases

Payments (Stripe Connect), AI document review / deal sheets, event-day checklists, incidents/payout pause, Spotlight ranking rules beyond a flag, social OAuth (manual URLs work now).
