# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invoice management system ("Invo") with a monorepo structure: Express 5 backend + React 19 frontend. No top-level package.json — each app is managed independently.

## Commands

### Backend (`cd backend`)
- **Dev server:** `npm run dev` (ts-node-dev with path aliases, auto-restart, port 9000)
- **Build:** `npm run build` (tsc)
- **Lint:** `npm run lint:check` / `npm run lint:fix`
- **Prisma generate:** `npm run prisma:generate`
- **Prisma migrate:** `npm run prisma:migrate`
- **Prisma studio:** `npm run prisma:studio` (GUI for browsing DB)
- **No test runner configured yet**

### Frontend (`cd frontend`)
- **Dev server:** `npm run dev` (Vite)
- **Build:** `npm run build` (tsc + vite build)
- **Lint:** `npm run lint`
- **Format:** `npm run format` (prettier)
- **Typecheck:** `npm run typecheck`
- **Add shadcn component:** `npx shadcn@latest add <component>`

## Architecture

### Backend
Express 5 + Prisma (MySQL) + TypeScript. Uses `@/*` path aliases (mapped to `./src/*` via tsconfig-paths).

**Database:** MySQL via Prisma ORM. Schema at `prisma/schema.prisma`. Tables: users, refresh_tokens, organizations, customers, invoices, invoice_items. UUIDs for primary keys. Password hashing is done explicitly with bcrypt in the service layer (no ORM hooks).

**Module pattern** — each domain lives in `src/app/modules/<module>/` with a consistent file set:
- `<module>.interface.ts` — TypeScript types
- `<module>.validation.ts` — Zod schemas
- `<module>.service.ts` — Business logic (uses Prisma client from `src/lib/prisma.ts`)
- `<module>.controller.ts` — Request handlers (use `catchAsync` wrapper)
- `<module>.route.ts` — Express routes

**Current modules:** auth, user

**Key layers:**
- `src/app.ts` — Express app setup, mounts routes at `/api/v1`
- `src/server.ts` — Prisma `$connect()` + superadmin seed on boot
- `src/lib/prisma.ts` — singleton Prisma client instance
- `src/config/index.ts` — env config object
- `src/app/middlewares/` — auth guard (JWT), validateRequest (Zod), globalErrorHandler, notFoundHandler
- `src/app/errors/ApiError.ts` — custom error class for throwing HTTP errors
- `src/app/errors/handlePrismaError.ts` — translates Prisma error codes (P2002, P2025, P2003) to API responses
- `src/shared/sendResponse.ts` — standardized JSON response wrapper
- `src/shared/catchAsync.ts` — async error wrapper for controllers

**Auth:** JWT access + refresh tokens. Roles: `superadmin`, `user`. No public registration — superadmin creates users. Superadmin is auto-seeded from `.env` on first boot.

**Planned modules:** organization, customer, invoice (see `backend/workplan.md`)

### Frontend
React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui (base-nova style). Uses `@/*` path aliases.

Currently scaffolded with minimal components. Planned stack includes Redux Toolkit + RTK Query, React Hook Form + Zod, react-router-dom (see `frontend/workplan.md`).

## Environment

Backend requires a `.env` file — copy `.env.example`. Needs MySQL running locally (default: `mysql://rajib:1234@localhost:3306/invoice_management`). Run `npm run prisma:migrate` after setup to create tables.
