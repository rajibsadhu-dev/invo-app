# Phase 1 — SaaS Foundation: Changes Summary

**Completed:** 2026-09-07

This document covers all architectural and feature changes made during Phase 1 completion.

---

## 1. OrgRole Expansion (5 Roles)

**Files changed:**
- `backend/prisma/schema.prisma` — `OrgRole` enum: `owner | admin | manager | staff | viewer`
- `backend/src/app/modules/organization/team.validation.ts` — role enum updated
- `backend/src/app/modules/organization/invite.validation.ts` — role enum updated
- `frontend/src/types/index.ts` — `OrgRole` type updated
- `frontend/src/pages/org/TeamPage.tsx` — 5-role icons, badges, invite defaults to `staff`

**Before:** 3 roles (owner, admin, member)
**After:** 5 roles (owner, admin, manager, staff, viewer) — each with distinct permission sets.

---

## 2. Permission-Based Access Control

**Files changed:**
- `backend/src/app/middlewares/orgRole.ts` — complete rewrite

**What changed:**
- Replaced linear role hierarchy with a permission map (`ROLE_PERMISSIONS`)
- Each `OrgRole` maps to a `Set<OrgPermission>`
- 11 permissions: `org:manage`, `org:invite`, `team:manage`, `invoice:create/edit/delete/view`, `customer:create/edit/delete/view`
- `orgRole()` middleware now accepts permission strings instead of role names
- Exported `hasPermission(role, permission)` utility

**Permission matrix:**

| Permission | owner | admin | manager | staff | viewer |
|------------|-------|-------|---------|-------|--------|
| org:manage | x | x | | | |
| org:invite | x | x | x | | |
| team:manage | x | x | | | |
| invoice:create | x | x | x | x | |
| invoice:edit | x | x | x | x | |
| invoice:delete | x | x | x | | |
| invoice:view | x | x | x | x | x |
| customer:create | x | x | x | x | |
| customer:edit | x | x | x | x | |
| customer:delete | x | x | x | | |
| customer:view | x | x | x | x | x |

---

## 3. Per-Action Route Guards

**Files changed:**
- `backend/src/app/modules/invoice/invoice.route.ts` — per-action permission guards
- `backend/src/app/modules/customer/customer.route.ts` — per-action permission guards
- `backend/src/app/modules/organization/organization.route.ts` — updated to use permission strings

**What changed:**
- Each route now specifies exactly which permission it requires (e.g., `orgRole("invoice:create")`)
- Removed blanket `ownershipGuard` from invoice/customer sub-router mounts
- Organization routes use `org:manage`, `team:manage`, `org:invite` as appropriate

---

## 4. Staff Invoice Scoping (createdById)

**Files changed:**
- `backend/prisma/schema.prisma` — added `createdById` on Invoice, `createdInvoices` on User
- `backend/prisma/migrations/20260907000200_invoice_created_by/migration.sql` — migration (adds column, backfills from org owner, FK + index)
- `backend/src/app/modules/invoice/invoice.service.ts` — staff scoping logic
- `backend/src/app/modules/invoice/invoice.controller.ts` — passes role/userId through
- `backend/src/app/modules/invoice/invoice.interface.ts` — added `orgRole`, `userId` to query type

**What changed:**
- Invoice model has `createdById Int?` linking to the user who created it
- `createInvoice` sets `createdById` from the authenticated user
- Staff users (`role === "staff"`) only see invoices they created
- `getInvoices`, `getInvoiceById`, `updateInvoice`, `deleteInvoice` all enforce staff scoping
- Backfill migration sets existing invoices' `createdById` to the org owner

> **Note:** Migration `20260907000200_invoice_created_by` must be applied via `npx prisma migrate deploy` from the `backend/` directory.

---

## 5. Email Verification Guard

**Files changed:**
- `backend/src/app/middlewares/emailVerified.ts` — new middleware
- `backend/src/app/modules/invoice/invoice.route.ts` — guard applied to `POST /`

**What changed:**
- New `emailVerified` middleware checks `emailVerifiedAt` on the authenticated user
- Returns 403 if email is not verified
- Applied to invoice creation route — unverified users cannot create invoices

---

## 6. Generic Query Builder (Neocore-Style Filters)

**Files changed:**
- `backend/src/helpers/queryBuilder.ts` — new file

**What it does:**
- Parses Neocore-style filter strings into Prisma `where` clauses
- Supported operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `not like`, `is null`, `is not null`
- Supports sorting via `-field` (DESC) or `field` (ASC)
- Pagination with max page size of 100
- Configurable `allowedFields` and `allowedSortFields` per resource
- `baseWhere` for injecting scoping conditions (e.g., staff filter)
- All filters ANDed together, flat fields only

**Exports:**
- `buildQuery(opts: QueryOptions): QueryResult` — main builder
- `paginationMeta(total, page, limit)` — pagination metadata helper

---

## 7. Invoice & Customer Services Refactored

**Files changed:**
- `backend/src/app/modules/invoice/invoice.service.ts` — uses `buildQuery()`
- `backend/src/app/modules/invoice/invoice.interface.ts` — `IInvoiceQuery` updated
- `backend/src/app/modules/invoice/invoice.controller.ts` — passes new query params
- `backend/src/app/modules/customer/customer.service.ts` — uses `buildQuery()`
- `backend/src/app/modules/customer/customer.interface.ts` — `ICustomerQuery` updated
- `backend/src/app/modules/customer/customer.controller.ts` — passes new query params

**What changed:**
- Both services now use the generic `buildQuery()` instead of hand-written where clauses
- Filter/sort/pagination handled uniformly
- Frontend API layers translate friendly params (status, customerId, dates) into `filter[]` strings

---

## 8. Date & Customer Filters on Invoices Page

**Files changed:**
- `frontend/src/features/invoice/invoiceApi.ts` — `buildInvoiceParams()` translates to filter strings
- `frontend/src/pages/invoices/InvoicesPage.tsx` — filter UI

**What changed:**
- Two date inputs (From Date, To Date) filter by `invoiceDate`
- Searchable customer combobox filters by `customerId`
- "Clear" button resets all filters
- All filter changes reset pagination to page 1
- Date column now shows `invoiceDate` instead of `createdAt`

---

## 9. Reusable Combobox Components

**Files changed:**
- `frontend/src/components/ui/combobox.tsx` — new standalone combobox
- `frontend/src/components/form/InvoCombobox.tsx` — upgraded form-bound combobox

**Features (both components):**
- Single select and multi-select modes
- Client-side filtering (default)
- Async search with configurable debounce (300ms default)
- Loading state indicator
- Click-outside to close
- Tag display with remove button for multi-select

**Standalone (`Combobox`):** Controlled via `value` + `onChange` props, discriminated union types for single vs multi.

**Form-bound (`InvoCombobox`):** Integrates with react-hook-form via `FieldWrapper`, shows validation errors.

---

## 10. Frontend API Layer Updates

**Files changed:**
- `frontend/src/features/invoice/invoiceApi.ts` — `buildInvoiceParams()`, updated `InvoiceListParams`
- `frontend/src/features/customer/customerApi.ts` — `buildCustomerParams()`, updated `CustomerListParams`

**What changed:**
- Both API slices now translate friendly query params into `filter[]` strings for the backend
- `InvoiceListParams` supports: `status`, `customerId`, `fromDate`, `toDate`, `filter[]`, `sort`
- `CustomerListParams` supports: `filter[]`, `sort` (replaced `sortBy`/`sortOrder`)

---

## Team Page Updates

**Files changed:**
- `frontend/src/pages/org/TeamPage.tsx`

**What changed:**
- Added icons for all 5 roles (Shield, ShieldCheck, Users, Briefcase, Eye)
- Role badge variants for each role
- Split permissions: `canManageTeam` (owner/admin) vs `canInvite` (owner/admin/manager)
- Invite dialog defaults to "staff" role
- Role select shows admin/manager/staff/viewer options
