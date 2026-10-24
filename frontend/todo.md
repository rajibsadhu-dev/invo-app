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

## Phase 7: Dashboard Analytics (v0.7.0) ✅
- [x] Analytics RTK Query endpoints (summary, revenue-over-time, gst-summary, top-customers, status-breakdown)
- [x] Summary cards: total revenue, this month, outstanding, overdue, invoices, customers, products, low stock
- [x] Revenue over time bar chart (recharts)
- [x] Invoice status breakdown donut chart (recharts)
- [x] Top 5 customers by revenue table
- [x] GST summary page with date range filter, intra/inter-state breakdown
- [x] Dashboard link in org sidebar
- [x] Routes: `/org/:orgId/dashboard`, `/org/:orgId/dashboard/gst`
- [x] `tsc -b`, `npm run lint` (0 errors) clean
- [ ] Not verified in a browser yet

## Phase 8: Hardening + GST (2026-09-06) — see /IMPROVEMENTS.md
- [x] Access token no longer persisted to localStorage (XSS exposure)
- [x] AuthBootstrap restores the session from the httpOnly refresh cookie on load
- [x] Refresh calls serialized (rotation makes parallel refreshes look like a replay)
- [x] Profile edit + change password via /auth/me (was 403 for every non-superadmin)
- [x] Removed the duplicated amount-in-words; shared src/lib/money.ts mirrors the backend
- [x] Per-line HSN/SAC + GST rate in the invoice form
- [x] Live CGST/SGST/IGST/round-off preview matching the server exactly (no clamping)
- [x] GST state code on organization and customer forms
- [x] Invoice detail + print template show the full GST breakdown
- [x] Status dropdown only offers legal transitions; Edit disabled outside draft
- [x] Lint 37 errors → 0 (shared getApiErrorMessage, context/schema splits)
- [ ] `npm run typecheck` is a no-op under project references — change it to `tsc -b`
- [ ] Bundle is 878 kB; route-level code splitting
- [ ] Phase 7 dashboard analytics (unchanged, still pending)

## Phase 9: Product Catalogue (ROADMAP Phase 2)
- [x] Business type combobox (suggestions + free text) on org create/edit + registration
- [x] Category API endpoints (RTK Query)
- [x] Category management page at `/org/:orgId/products/categories` (nested list + dialogs)
- [x] Product API endpoints (RTK Query)
- [x] Product list page at `/org/:orgId/products` (search, category filter, pagination)
- [x] Add/Edit product form (name, SKU, category, HSN, unit, prices, GST rate, variants toggle)
- [x] Product detail page at `/org/:orgId/products/:id`
- [x] Invoice form: product picker in line items with auto-fill (HSN, unit, rate, GST%), custom text still allowed
- [x] `tsc -b`, `npm run lint` (0 errors) and `npm run build` clean
- [x] Fixed pre-existing type errors: `asChild` is a Radix API and did nothing on this
      project's base-ui Button — 9 sites across the auth pages + TeamPage now use `render`
- [x] `npm run typecheck` switched from `tsc --noEmit` (a no-op under project references)
      to `tsc -b`, which is what surfaced those errors
- [ ] Not verified in a browser yet — API paths are covered by the backend smoke test

## Phase 10: Product Variants (ROADMAP Phase 3)
- [x] Variant attribute API endpoints (RTK Query)
- [x] Variant attribute management page at `/org/:orgId/products/attributes` (add/edit/delete, tag-based values)
- [x] "Attributes" button on Products page linking to attribute management
- [x] Product variant API endpoints (RTK Query) — CRUD + bulk generate
- [x] Variant section on product detail page (table, generate dialog, add/edit dialogs)
- [x] Generate dialog: pick attributes + values → cartesian combos preview → bulk create
- [x] Invoice form: variant picker dropdown after selecting a product with variants
- [x] Variant price override applied to line item rate
- [x] `productVariantId` tracked on invoice line items (create + edit)
- [x] Route for variant attributes page added to router
- [x] `tsc -b`, `npm run lint` (0 errors) and `npm run build` clean
- [ ] Not verified in a browser yet

## Phase 11: Inventory Management (ROADMAP Phase 4)
- [x] Inventory API endpoints (RTK Query) — adjust, set, movements, low-stock, summary
- [x] StockSection on product detail page: stock overview (product or variant table) + recent movements + adjust dialog
- [x] Inventory dashboard at `/org/:orgId/inventory` — stat cards, category breakdown, quick links
- [x] Low-stock page at `/org/:orgId/inventory/low-stock` — products/variants below threshold
- [x] Movements page at `/org/:orgId/inventory/movements` — paginated log with type filter
- [x] Product picker on invoice form shows stock quantities
- [x] Sidebar: "Inventory" nav item with Warehouse icon
- [x] Routes registered for all 3 inventory pages
- [x] `tsc -b`, `npm run lint` (0 errors) clean
- [ ] Not verified in a browser yet

## Phase 12: Suppliers & Purchase Orders (ROADMAP Phase 5)
- [x] Supplier types added (`Supplier`, `SupplierPickerHit`, `CreateSupplierPayload`, `UpdateSupplierPayload`)
- [x] Purchase order types added (`POStatus`, `PurchaseOrder`, `PurchaseOrderItem`, payloads)
- [x] Supplier API endpoints (RTK Query) — CRUD + search
- [x] Purchase order API endpoints (RTK Query) — CRUD + receive goods
- [x] Supplier list page at `/org/:orgId/suppliers` (search, pagination, add/edit dialogs, delete)
- [x] Supplier detail page at `/org/:orgId/suppliers/:supplierId` (contact info, GST, recent POs)
- [x] PO list page at `/org/:orgId/purchase-orders` (status tabs, supplier filter, pagination, delete)
- [x] Create PO page at `/org/:orgId/purchase-orders/new` (supplier combobox, product line items with purchasePrice, GST)
- [x] Edit PO page at `/org/:orgId/purchase-orders/:poId/edit` (draft-only editing)
- [x] PO detail page at `/org/:orgId/purchase-orders/:poId` (status actions, items table, receive goods dialog)
- [x] Receive goods dialog: per-item quantity input, "Receive All" shortcut, remaining tracking
- [x] Product picker adapted for PO forms (uses purchasePrice instead of sellingPrice)
- [x] Sidebar: "Suppliers" and "Purchase Orders" nav items
- [x] Routes registered for all supplier and PO pages
- [x] `ProductPickerHit` and `ProductVariantPickerHit` types updated with `purchasePrice`
- [x] `tsc -b`, `npm run lint` (0 errors) clean
- [ ] Not verified in a browser yet
