# Invo-Backend — Work Plan

## Tech Stack
Express 5 · Prisma (MySQL) · TypeScript · JWT (access + refresh) · bcrypt · Zod · Multer

---

## Phase 1 — Auth & User Management ✅
- User model (`name`, `email`, `password`, `phone`, `role: superadmin | user`)
- Auth service: login, refresh token, logout (no public registration)
- JWT middleware (`auth` guard + `superadmin` guard)
- User management service (superadmin-only CRUD for creating/managing users)
- Seed script to create initial superadmin account
- Zod validation schemas
- Routes: `POST /login`, `POST /refresh-token`, `POST /logout`, `GET /me`
- User routes (superadmin): full CRUD under `/api/v1/users`
- Superadmin seed: `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `.env` → auto-seed on first server start if no superadmin exists in DB

## Phase 2 — Organization Module ✅
- Organization model (`name`, `owner`, `address`, `phone`, `email`, `logo`, `registerNumber`, `gstNumber`, `invoicePrefix`, `nextInvoiceNumber`)
- CRUD service + controller
- Ownership guard middleware (only owner can access)
- Logo upload via multer → `uploads/logos/`
- Routes: full CRUD under `/api/v1/organizations`

## Phase 3 — Customer Module ✅
- Customer model (`organization`, `name`, `email`, `phone`, `address`, `gstNumber`)
- CRUD service + controller (org-scoped)
- Search & pagination support
- Routes: full CRUD under `/api/v1/organizations/:id/customers`

## Phase 4 — Invoice Module ✅
- Invoice model with line items (`description`, `quantity`, `rate`, `amount`)
- Auto-increment invoice number per org (e.g., `INV-001`) — atomic via `$transaction`
- Totals calculation: subtotal, tax, discount, grand total
- Amount-in-words utility (`src/helpers/amountInWords.ts`)
- Status management: `draft` / `sent` / `paid` / `cancelled`
- Routes: full CRUD under `/api/v1/organizations/:id/invoices`

---

## Phase 5 — Invoice Schema Extension (v0.6.0) ✅

Add optional fields to the `invoices` table and `invoice_items` table via Prisma migration:

### Invoice new fields
- `billingAddress` — String? (separate from customer address)
- `referenceNumber` — String? (PO number / challan no. etc.)
- `termsAndConditions` — String? (long text)
- `notes` — String? (remarks)
- `authorizedSignatory` — String? (name to print on invoice)
- `receivedAmount` — Decimal(12,2)? (defaults to 0 — partial payment tracking)
- `paymentMethod` — Enum: `cash` | `bank` | null
- `bankName` — String? (shown when paymentMethod = bank)
- `bankAccount` — String? (account number)
- `bankIfsc` — String? (IFSC code)

### Invoice item new field
- `unit` — String? (pcs / kg / m / hr / set / box / ltr / nos — free text, not enum, for flexibility)

### Service / validation updates
- Update `createInvoice` and `updateInvoice` to accept + persist new fields
- Add `balanceDue` computed field in the response (grandTotal − receivedAmount)
- Zod schemas updated with optional new fields

---

## Phase 6 — Dashboard Analytics API (v0.7.0)

New endpoints under `/api/v1/organizations/:id/analytics`:

- `GET /summary` — total revenue (paid invoices), this month revenue, total customers, total invoices count
- `GET /revenue-over-time` — monthly revenue for last N months (grouped by month)
- `GET /top-customers` — top 5 customers by paid invoice revenue
- `GET /status-breakdown` — count of invoices by status

All queries are org-scoped and ownership-guarded.

---

## Phase 7 — Superadmin Organization Management (v0.8.0) ✅

### Ownership Guard — Superadmin Bypass
- Modify `ownershipGuard` middleware: if `req.user.role === 'superadmin'`, skip ownership check and call `next()` immediately
- This gives superadmin transparent access to all existing org/customer/invoice routes with zero route duplication

### New Admin Routes — `/api/v1/admin/organizations`
All routes protected by existing `superadmin` guard middleware.

- `GET /api/v1/admin/organizations`
  - Returns all organizations (no owner filter)
  - Include owner info: `owner { id, name, email }` via Prisma `include`
  - Supports optional search by org name or owner email (query param `?search=`)
  - Ordered by `createdAt` desc

- `POST /api/v1/admin/organizations`
  - Creates org with `ownerId = req.user.id` (superadmin is owner)
  - Same payload as regular create (name, address, phone, email, registerNumber, gstNumber, invoicePrefix)
  - Reuses existing `createOrganization` service

- `PATCH /api/v1/admin/organizations/:id/assign`
  - Transfers org ownership to another user
  - Body: `{ userId: number }`
  - Validates target user exists (throws 404 if not)
  - Updates `ownerId` on the org record
  - New service method: `assignOrganization(orgId, userId)`

### Module Updates
- `organization.service.ts` — add `getAllOrganizations(search?)` and `assignOrganization(orgId, userId)` methods
- `organization.controller.ts` — add `getAllOrganizations` and `assignOrganization` handlers
- `organization.route.ts` — add new admin router, mount at `/api/v1/admin`
- `organization.validation.ts` — add `assignOrgSchema` (`{ userId: z.number().int().positive() }`)

---

## Future / V2 — To Discuss

Not planned for implementation yet. Pending decision on scope.

- **Products / Items catalogue** — pre-saved products per org with default price and unit
- **Expense tracking** — simple org-level expense entries (category, amount, date, description)
- **Customer statement** — aggregated view: total invoiced, total paid, outstanding balance per customer (may be computed from existing invoice data, not a new table)
- **Email invoice** — send invoice as PDF attachment via email (needs SMTP config)

---

## Module Pattern (Per Module)
```
src/app/modules/<module>/
  ├── <module>.interface.ts    — TypeScript types
  ├── <module>.validation.ts   — Zod schemas
  ├── <module>.service.ts      — Business logic (Prisma queries)
  ├── <module>.controller.ts   — Request handlers
  └── <module>.route.ts        — Express routes
```

Database models are defined centrally in `prisma/schema.prisma`.
