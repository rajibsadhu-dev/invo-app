# Invo-Frontend — Todo

## Phase 1: Foundation & Auth ✅
- [x] Install dependencies (react-router-dom, redux toolkit, redux-persist, react-hook-form, etc.)
- [x] Setup Redux store + RTK Query base API + redux-persist config
- [x] Create auth slice with persistence (login state, user info → localStorage)
- [x] Create auth API endpoints (RTK Query)
- [x] Create Login page (react-hook-form + zod) — no register page
- [x] Create ProtectedRoute component
- [x] Create app layout (sidebar + topbar + content area)
- [x] Setup react-router with all route definitions
- [x] Create User Management page (superadmin only — create/list/edit/delete users)

## Phase 2: Organization ✅
- [x] Create org API endpoints (RTK Query)
- [x] Create Dashboard page (list orgs as cards)
- [x] Create "Create Organization" dialog
- [x] Create Organization detail page
- [x] Create Edit Organization form
- [x] Breadcrumb for all pages (BreadcrumbContext + useBreadcrumbs hook)
- [x] Profile page + route (/profile — accessible via Topbar dropdown)

## Phase 3: Customer ✅
- [x] Create customer API endpoints (RTK Query)
- [x] Create Customer list page with search + pagination
- [x] Create Add Customer dialog
- [x] Create Edit Customer dialog
- [x] Create Customer detail page
- [x] Org-context sidebar (appears when inside any /org/:orgId/* route)

## Phase 4: Invoice ✅
- [x] Create invoice API endpoints (RTK Query)
- [x] Create Invoice list page with status filter tabs + pagination
- [x] Create Invoice creation form with customer combobox
- [x] Build dynamic line items (useFieldArray — add/remove rows)
- [x] Implement auto-calculation (subtotal, tax, discount, grand total)
- [x] Add price-in-words display (live on form + stored on detail)
- [x] Create Edit Invoice page (pre-populated form)
- [x] Create Invoice detail/preview page (document layout + status change)

## Phase 5: PDF & Polish ✅ (v0.5.0)
- [x] Install react-to-print
- [x] Design professional invoice print template (PrintableInvoice.tsx)
- [x] Add Print / PDF button on invoice detail page
- [x] Redesign Organization detail page (remove useless redirect tabs, clean layout)

## Phase 6: Invoice Fields Polish + Currency + Units (v0.6.0) ✅
- [x] Add ₹ INR symbol to all amount displays (form totals, detail page, print template)
- [x] Add unit field to line items (free text: pcs / kg / m / hr / etc.)
- [x] Show unit in items table on detail page and print template
- [x] Editable invoice date field (date picker, defaults to today)
- [x] Add optional invoice fields to form ("Additional Details" section):
  - [x] Challan No., Vehicle No., Site / Delivery Location
  - [x] Billing address, PO / Reference number
  - [x] Terms & Conditions (text area)
  - [x] Notes / Remarks (text area)
  - [x] Authorized Signatory name
- [x] Add Payment Info section to invoice form + detail:
  - [x] Received amount → auto-show "Balance Due"
  - [x] Payment method (Cash / Bank radio)
  - [x] Bank details (name, account no., IFSC) — shown only when Bank selected
- [x] Redesign print template — simple border style matching reference design
- [x] Update InvoiceDetailPage to show all new fields

## Phase 7: Dashboard Analytics (v0.7.0)
- [ ] Summary cards: total revenue, this month's revenue, total customers, total invoices
- [ ] Revenue over time chart (recharts — line or bar)
- [ ] Invoice status breakdown (pie/donut chart)
- [ ] Top 5 customers by revenue
- [ ] Month-over-month comparison
