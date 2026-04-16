# Invo-Backend — Todo

## Phase 1: Auth & User Management ✅
- [x] Create User model + interface (with `superadmin` / `user` roles)
- [x] Create auth validation schemas (Zod)
- [x] Create auth service (login, token logic — no public register)
- [x] Create auth controller
- [x] Create auth routes (login, refresh, logout, me)
- [x] Create `auth` middleware (JWT verification)
- [x] Create `superadmin` guard middleware (combined into auth middleware)
- [x] Create user management service (CRUD — superadmin only)
- [x] Create user management controller + routes
- [x] Add `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD` to `.env` / `.env.example`
- [x] Create seed function (auto-seeds superadmin on first server boot if not exists)
- [x] Register auth + user routes in main router

## Phase 2: Organization ✅
- [x] Create Organization interface + types
- [x] Create organization validation schemas (Zod)
- [x] Create organization service (CRUD)
- [x] Create organization controller
- [x] Create organization routes
- [x] Create ownership guard middleware
- [x] Add logo upload endpoint (multer → uploads/logos/)
- [x] Serve uploads as static files (/uploads)
- [x] Register organization routes in main router

## Phase 3: Customer ✅
- [x] Create Customer interface + types
- [x] Create customer validation schemas
- [x] Create customer service (CRUD + search + pagination)
- [x] Create customer controller
- [x] Create customer routes (nested under org: /organizations/:id/customers)
- [x] Mounted customer routes inside org router (ownership verified once)

## Phase 4: Invoice ✅
- [x] Create Invoice + InvoiceItem interface + types
- [x] Create invoice validation schemas
- [x] Create amount-in-words utility (src/helpers/amountInWords.ts)
- [x] Create invoice service (CRUD + totals calculation + auto invoice number in transaction)
- [x] Create invoice controller
- [x] Create invoice routes (nested under org: /organizations/:id/invoices)
- [x] Mounted invoice routes inside org router (ownership verified once)

## Phase 5: Invoice Schema Extension (v0.6.0) ✅
- [x] Add new optional fields to `invoices` table (Prisma migration):
  - [x] `invoiceDate`, `challanNo`, `vehicleNo`, `siteLocation`
  - [x] `billingAddress`, `referenceNumber`
  - [x] `termsAndConditions`, `notes`, `authorizedSignatory`
  - [x] `receivedAmount`, `paymentMethod` (enum: cash | bank)
  - [x] `bankName`, `bankAccount`, `bankIfsc`
- [x] Add `unit` field to `invoice_items` table
- [x] Update invoice interface + types
- [x] Update invoice Zod validation schemas
- [x] Update invoice service (createInvoice + updateInvoice) to handle new fields
- [x] Add `balanceDue` (grandTotal − receivedAmount) to invoice response
- [x] Run Prisma migration

## Phase 6: Dashboard Analytics API (v0.7.0)
- [ ] Create analytics routes under `/api/v1/organizations/:id/analytics`
- [ ] GET /summary — total revenue, this month revenue, customer count, invoice count
- [ ] GET /revenue-over-time — monthly revenue for last N months
- [ ] GET /top-customers — top 5 customers by paid invoice revenue
- [ ] GET /status-breakdown — invoice count by status
