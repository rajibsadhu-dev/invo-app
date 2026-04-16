# Invo-Frontend — Work Plan

## Tech Stack
React 19 · Vite · TypeScript · TailwindCSS v4 · shadcn v4 · Redux Toolkit + RTK Query · React Hook Form + Zod · react-to-print

---

## Phase 1 — Foundation & Auth ✅
- Install `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `redux-persist`, `react-hook-form`, `@hookform/resolvers`
- Setup Redux store + RTK Query base API + redux-persist config
- Auth slice with persistence (user state, tokens → localStorage)
- Login page with form validation (no register page — superadmin creates users)
- Protected route wrapper
- App layout skeleton (sidebar + topbar + content)

## Phase 2 — Organization Module ✅
- Dashboard page: list user's organizations (cards)
- Create Organization dialog (form)
- Organization detail page (info + logo upload + next invoice number)
- Edit Organization form
- Breadcrumb system (BreadcrumbContext + useBreadcrumbs hook)
- Profile page accessible via Topbar dropdown

## Phase 3 — Customer Module ✅
- Customer list page with search & pagination
- Add/Edit customer dialogs with react-hook-form + zod
- Customer detail page (info + invoices placeholder)
- Org-context sidebar: appears when navigating inside any `/org/:orgId/*` route,
  showing Overview / Customers / Invoices nav items for the active organization

## Phase 4 — Invoice Module ✅
- Invoice list page with status filters & pagination
- Invoice creation form:
  - Select customer
  - Dynamic line items (add/remove rows)
  - Auto-calculate subtotal, tax, discount, total
  - Price in words display
- Edit invoice page
- Invoice detail/preview page with inline status change

## Phase 5 — PDF & Polish ✅ (v0.5.0)
- Install `react-to-print`
- Professional print template (PrintableInvoice component)
  - Blue accent design, company logo, items table, grand total box, amount in words
- Print / PDF button on invoice detail page
- Organization detail page redesigned (removed useless tabs, clean overview layout)

---

## Phase 6 — Invoice Fields Polish + Currency + Units (v0.6.0) ✅

### Currency & Units
- ₹ INR symbol on all amount fields (form, detail, print template)
- Quantity unit per line item — free text (pcs / kg / m / hr / ltr / etc.)
- Unit shown in items table (screen + print)
- Editable invoice date (defaults to today, stored separately from createdAt)

### Optional Invoice Fields
"Additional Details" section on the invoice form — all optional, show on print only when filled:
- Challan No., Vehicle No., Site / Delivery Location (for transport/construction type invoices)
- Billing address (if different from customer address)
- PO / Reference number
- Terms & Conditions (text area)
- Notes / Remarks (text area)
- Authorized Signatory name

> RS decision: No "invoice types" needed. All extra fields are optional — they print only when filled in. This handles different business types flexibly.

### Payment Info Section
Shown at bottom of invoice form and on the detail/print view:
- Received amount (partial payment tracking → shows "Balance Due" automatically)
- Payment method: Cash / Bank (radio)
- If Bank: bank name, account number, IFSC

### Print Template
- Redesigned to match reference style — simple black borders, no colors
- Two-column header: company info (left) | invoice details box (right) with Invoice No., Challan No., Date, Vehicle No., Site Location
- Simple bordered items table with unit column
- Totals: Sub Total, GST/Tax, Discount, Total, Received, Balance
- Terms & conditions (left) | Authorized Signatory (right)

---

## Phase 7 — Dashboard Analytics (v0.7.0)
Scope: per-organization view, shown when inside an org context.

- Summary cards: total revenue (paid invoices), this month's revenue, total customers, total invoices
- Revenue over time chart (line/bar — recharts)
- Invoice status breakdown (pie/donut chart)
- Top 5 customers by revenue
- Month-over-month comparison

---

## Phase 8 — Superadmin Organization Management (v0.8.0) ✅

### New RTK Query Endpoints (`features/admin/adminOrgApi.ts`)
- `getAllOrganizations(search?)` — `GET /admin/organizations?search=`
- `adminCreateOrganization(payload)` — `POST /admin/organizations`
- `assignOrganization({ orgId, userId })` — `PATCH /admin/organizations/:id/assign`

### New Page: `/admin/organizations` (superadmin only)
Route protected by `SuperadminRoute` wrapper.

**Table view** — each row shows:
- Org name
- Owner name + email
- Phone, address (truncated)
- Created date
- Actions column: Edit button, Delete button (with confirmation dialog)

**Toolbar:**
- Search input (filters by org name or owner email — hits `?search=` query param)
- "Create Organization" button → opens `AdminCreateOrgDialog`

**`AdminCreateOrgDialog`:**
- Same fields as regular create form (name, address, phone, email, registerNumber, gstNumber, invoicePrefix)
- No owner picker — superadmin is always the owner on creation
- On success: invalidates org list

**Click row → navigate to `/org/:orgId`** (existing org detail page — ownershipGuard bypassed for superadmin on backend)

### "Assign to User" on Org Detail Page (`/org/:orgId`)
- Shown only when `user.role === 'superadmin'`
- Button: "Assign to User" in the org detail header (next to Edit/Delete)
- Opens `AssignOrgDialog`:
  - Dropdown listing all users (fetched from existing `useGetUsersQuery`)
  - Shows name + email per option
  - Submit calls `assignOrganization({ orgId, userId })`
  - On success: toast + refetch org detail (new owner shown)

### Sidebar Update
- Under superadmin nav section, add "All Organizations" link → `/admin/organizations`
- Only rendered when `user.role === 'superadmin'`

---

## Future / V2 — To Discuss

These are ideas that may be added post-v1. Not planned for implementation yet.

- **Items / Products catalogue** — pre-saved products with default price and unit, searchable when adding line items
- **Expense tracking** — record org-level expenses (category, amount, date, note). Not payroll — just simple expense entries.
- **Income vs Expense summary** — simple money-in / money-out view per org (revenue from paid invoices vs logged expenses)
- **Customer statement** — per-customer view: total invoiced, total paid, outstanding balance
- **Multi-currency support** — beyond INR
- **Email invoice** — send invoice PDF directly from the app

---

## Page Routes
| Route | Page |
|-------|------|
| `/login` | Login |
| `/` | Dashboard (static / analytics when org selected) |
| `/organizations` | Organization list |
| `/org/:orgId` | Organization overview |
| `/org/:orgId/customers` | Customer list |
| `/org/:orgId/customers/:id` | Customer detail |
| `/org/:orgId/invoices` | Invoice list |
| `/org/:orgId/invoices/new` | Create invoice |
| `/org/:orgId/invoices/:id` | Invoice preview |
| `/org/:orgId/invoices/:id/edit` | Edit invoice |
| `/users` | User management (superadmin) |
| `/admin/organizations` | All organizations — superadmin only |
