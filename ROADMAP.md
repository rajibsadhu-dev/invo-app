# Invo — Feature Roadmap

Step-by-step plan for turning Invo from a single-user invoice tool into a
multi-tenant SaaS product with full product catalogue and inventory management.
Each phase is independently shippable.

**Stack:** Express 5 + Prisma (MySQL) + React 19 + RTK Query + shadcn/ui

**Decisions:**
- INR only (no multi-currency)
- Indian GST model (already implemented)
- Nodemailer + SMTP for email (provider-agnostic)
- Manual payment recording now, Razorpay-ready architecture for later
- Public signup (not admin-managed onboarding)
- Product catalogue with full inventory (stock in/out, variants, purchase orders)
- Business type on org setup (free text + suggestions), controls invoice form field visibility
- Product picker on invoice form: search + auto-fill (HSN, rate, unit, GST%), user can still type custom items

---

## Completed (v0.1–v0.8)

- [x] Auth (JWT access + rotating refresh, httpOnly cookie, replay detection)
- [x] User management (superadmin CRUD, self-service profile + password change)
- [x] Organization CRUD + logo upload + ownership guard
- [x] Customer CRUD (org-scoped, paginated)
- [x] Invoice CRUD (line items, auto-numbering, status machine, soft delete)
- [x] Full Indian GST (per-line HSN/SAC + rate, CGST/SGST/IGST, round-off)
- [x] Print template (react-to-print, GST breakdown)
- [x] Payment info fields (received amount, balance due, method, bank details)
- [x] Superadmin org management (view all orgs, assign ownership)
- [x] Security hardening (helmet, CORS, rate limiting, env validation, root superadmin protection)
- [x] Frontend lint 37 → 0

---

## Phase 1 — SaaS Foundation ✅

> Goal: Any business can sign up, create their org, and invite team members.
> **Completed: 2026-09-07**

### 1.1 Public Registration ✅
- [x] Backend: `POST /api/v1/auth/register` — name, email, password, org name
  - Creates User + Organization + OrgMember (owner) in a single transaction
  - Returns access token + sets refresh cookie
- [x] Frontend: `/register` page with form + link from login
- [x] Schema: No migration needed

### 1.2 Email Verification ✅
- [x] Schema: `emailVerifiedAt DateTime?` on User
- [x] Backend: JWT verification token (24h), resend endpoint, verify endpoint
- [x] Frontend: Verification banner + resend button in AppLayout
- [x] Guard: `emailVerified` middleware blocks invoice creation until verified
- [x] Config: SMTP settings in `.env`

### 1.3 Forgot Password ✅
- [x] Backend: forgot-password (1h JWT) + reset-password (revokes all sessions)
- [x] Frontend: `/forgot-password` and `/reset-password` pages
- [x] "Forgot password?" link on login page

### 1.4 Org-Level Roles & Team ✅
- [x] Schema: `OrgMember` join table + `OrgRole` enum (owner, admin, manager, staff, viewer)
- [x] Permission map replacing linear role hierarchy (see 1.4a below)
- [x] Backend: `ownershipGuard` rewritten for OrgMember, `orgRole()` middleware uses permissions
- [x] Frontend: Team page with role management, role badges/icons for all 5 roles
- [x] Backfill: server boot ensures every org owner has an OrgMember row

### 1.4a Permission-Based Access Control ✅
- [x] Permission map: `org:manage`, `org:invite`, `team:manage`, `invoice:create/edit/delete/view`, `customer:create/edit/delete/view`
- [x] Invoice + customer routes guarded per-action (not just membership)
- [x] Staff users scoped to their own invoices (`createdById` on Invoice)
- [x] `createdById` backfill migration sets existing invoices to org owner

### 1.5 Invite Team Members ✅
- [x] Backend: `OrgInvite` model, JWT invite tokens (7d), create/list/revoke invites
- [x] Backend: accept-invite endpoint (adds existing user or directs new user to register)
- [x] Frontend: Invite dialog with searchable role picker, pending invites list
- [x] Frontend: `/accept-invite` page

### 1.6 Org Switcher ✅
- [x] Backend: `GET /auth/me` returns orgMemberships with org details
- [x] Frontend: Org switcher dropdown in sidebar (when user has >1 org)
- [x] AuthBootstrap fetches `/auth/me` on session restore

### 1.7 Advanced Filtering ✅
- [x] Generic query builder (`queryBuilder.ts`) — Neocore-style filter strings
- [x] Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `not like`, `is null`, `is not null`
- [x] Applied to invoice and customer list endpoints
- [x] Frontend: date range + customer combobox filters on invoices page

### 1.8 Reusable Combobox ✅
- [x] `InvoCombobox` (form-bound) — single/multi select, client-side/async search, debounce
- [x] `Combobox` (standalone) — same features, controlled via value/onChange
- [x] Used for customer filter on invoices page

### 1.9 Deliverables Checklist ✅
- [x] Register → auto-login → org created → dashboard
- [x] Email verification blocks invoice creation
- [x] Forgot password → reset → login works
- [x] Org owner can invite by email, set role (5 roles)
- [x] Permission-based access control (not linear hierarchy)
- [x] Staff scoped to own invoices
- [x] User in multiple orgs can switch between them
- [x] Advanced filtering on invoices (date, customer, status)

---

## Phase 2 — Business Type & Product Catalogue

> Goal: Org declares its business type at setup. Users create a product catalogue
> with categories. Invoice form auto-fills from products.

### 2.1 Business Type on Organization
- [ ] **Schema:** Add `businessType String?` to Organization model
- [ ] **Backend:** Accept `businessType` in create/update org payloads
  - No enum constraint — free text stored as-is
- [ ] **Frontend:** Business type field on org create + edit forms
  - Combobox with suggested values + free text input
  - Suggestions: `Trading`, `Manufacturing`, `Services`, `Construction`, `Retail`,
    `Wholesale`, `Import/Export`, `Consulting`, `Freelancing`, `Healthcare`,
    `Education`, `Transportation`, `Agriculture`, `IT & Software`, `Other`
  - Shown during org setup (Phase 1 registration) and editable in org settings

### 2.2 Product Categories
- [ ] **Schema:**
  ```
  model ProductCategory {
    id             Int       @id @default(autoincrement())
    organizationId Int       @map("organization_id")
    name           String
    description    String?
    parentId       Int?      @map("parent_id")  // nested categories
    sortOrder      Int       @default(0) @map("sort_order")
    createdAt      DateTime  @default(now())
    updatedAt      DateTime  @updatedAt

    organization   Organization @relation(fields: [organizationId], references: [id])
    parent         ProductCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
    children       ProductCategory[] @relation("CategoryTree")
    products       Product[]

    @@unique([organizationId, name, parentId])
    @@index([organizationId])
  }
  ```
- [ ] **Backend:** Category module — CRUD
  - `GET /organizations/:orgId/categories` — returns flat list or tree structure
  - `POST /organizations/:orgId/categories` — create (name, description, parentId)
  - `PATCH /organizations/:orgId/categories/:id` — update
  - `DELETE /organizations/:orgId/categories/:id` — refuse if products exist in category
- [ ] **Frontend:** Category management page at `/org/:orgId/products/categories`
  - Tree view or nested list
  - Add/edit/delete with inline forms or dialogs
  - Drag-and-drop reordering (nice to have)

### 2.3 Products (Basic Catalogue)
- [ ] **Schema:**
  ```
  model Product {
    id             Int       @id @default(autoincrement())
    organizationId Int       @map("organization_id")
    categoryId     Int?      @map("category_id")
    name           String
    sku            String?   @db.VarChar(50)
    description    String?   @db.Text
    hsnCode        String?   @map("hsn_code") @db.VarChar(8)
    unit           String?   @db.VarChar(20)   // pcs, kg, m, hr, etc.
    sellingPrice   Decimal   @map("selling_price") @db.Decimal(12, 2)
    purchasePrice  Decimal?  @map("purchase_price") @db.Decimal(12, 2)
    gstRate        Decimal   @default(18) @map("gst_rate") @db.Decimal(4, 2)
    isActive       Boolean   @default(true) @map("is_active")
    hasVariants    Boolean   @default(false) @map("has_variants")
    createdAt      DateTime  @default(now())
    updatedAt      DateTime  @updatedAt

    organization   Organization    @relation(fields: [organizationId], references: [id])
    category       ProductCategory? @relation(fields: [categoryId], references: [id])
    variants       ProductVariant[]
    stockMovements StockMovement[]

    @@unique([organizationId, sku])
    @@index([organizationId, categoryId])
    @@index([organizationId, name])
  }
  ```
- [ ] **Backend:** Product module — CRUD
  - `GET /organizations/:orgId/products` — list with search, category filter, pagination
  - `GET /organizations/:orgId/products/search?q=` — lightweight search for invoice form picker
    - Returns `[{ id, name, sku, hsnCode, unit, sellingPrice, gstRate, hasVariants }]`
    - Searches name + SKU, max 10 results
  - `POST /organizations/:orgId/products` — create
  - `PATCH /organizations/:orgId/products/:id` — update
  - `DELETE /organizations/:orgId/products/:id` — soft delete (set `isActive = false`) if used in invoices, hard delete otherwise
  - `GET /organizations/:orgId/products/:id` — detail with variants
- [ ] **Frontend:** Product pages
  - Product list page at `/org/:orgId/products`
    - Table: name, SKU, category, price, GST%, stock, status
    - Filter by category, search by name/SKU
  - Add/edit product form (dialog or page)
    - Name, SKU, category (dropdown), HSN code, unit, selling price, purchase price, GST rate
    - "This product has variants" toggle
  - Product detail page at `/org/:orgId/products/:id`

### 2.4 Invoice Form — Product Picker Integration
- [ ] **Frontend:** Upgrade invoice line item rows
  - Product search combobox in the description/item column
  - Type to search → dropdown shows matching products (name + SKU)
  - Selecting a product auto-fills: description (product name), HSN, unit, rate, GST%
  - User can override any auto-filled value
  - User can also type a custom description (not from catalogue) — free text still works
  - Store `productId` on InvoiceItem for traceability (optional FK, null for custom items)
- [ ] **Schema:** Add `productId Int?` and `productVariantId Int?` to InvoiceItem
- [ ] **Backend:** Accept `productId` and `productVariantId` in create/update invoice payloads
  - If `productId` is provided, validate it exists and belongs to the org
  - Auto-fill fields from product if not explicitly provided

### 2.5 Deliverables Checklist
- [ ] Org has a business type field (free text + suggestions)
- [ ] Product categories with nesting
- [ ] Full product CRUD with HSN, price, GST rate, unit
- [ ] Product search on invoice form auto-fills line items
- [ ] Custom (non-catalogue) line items still work
- [ ] Products list page with search and category filter

---

## Phase 3 — Product Variants

> Goal: Products like "T-Shirt" have variants (Red-M, Blue-L) each with own
> SKU, price, and stock count.

### 3.1 Variant Attributes
- [ ] **Schema:**
  ```
  model VariantAttribute {
    id             Int       @id @default(autoincrement())
    organizationId Int       @map("organization_id")
    name           String    // "Size", "Color", "Material"
    values         Json      // ["S", "M", "L", "XL"] or ["Red", "Blue", "Green"]
    createdAt      DateTime  @default(now())

    organization   Organization @relation(fields: [organizationId], references: [id])

    @@unique([organizationId, name])
  }
  ```
- [ ] **Backend:** Attribute management
  - `GET /organizations/:orgId/variant-attributes` — list all defined attributes
  - `POST /organizations/:orgId/variant-attributes` — create (name + initial values)
  - `PATCH /organizations/:orgId/variant-attributes/:id` — add/remove values
  - `DELETE /organizations/:orgId/variant-attributes/:id` — refuse if used by any variant
- [ ] **Frontend:** Attribute management (part of product settings or inline on product form)
  - "Manage Attributes" section: add attribute name, add values as tags/chips

### 3.2 Product Variants
- [ ] **Schema:**
  ```
  model ProductVariant {
    id             Int       @id @default(autoincrement())
    productId      Int       @map("product_id")
    sku            String?   @db.VarChar(50)
    name           String    // auto-generated: "Red / M" or editable
    attributes     Json      // { "Color": "Red", "Size": "M" }
    sellingPrice   Decimal?  @map("selling_price") @db.Decimal(12, 2)  // null = use product price
    purchasePrice  Decimal?  @map("purchase_price") @db.Decimal(12, 2)
    stockQuantity  Decimal   @default(0) @map("stock_quantity") @db.Decimal(10, 3)
    lowStockAlert  Decimal?  @map("low_stock_alert") @db.Decimal(10, 3)
    isActive       Boolean   @default(true) @map("is_active")
    createdAt      DateTime  @default(now())
    updatedAt      DateTime  @updatedAt

    product        Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
    stockMovements StockMovement[]

    @@unique([productId, sku])
    @@index([productId])
  }
  ```
- [ ] **Backend:** Variant CRUD (nested under product)
  - `GET /products/:productId/variants` — list variants for a product
  - `POST /products/:productId/variants` — create variant (auto-generate from attribute combos or manual)
  - `PATCH /products/:productId/variants/:variantId` — update price, SKU, stock alert
  - `DELETE /products/:productId/variants/:variantId` — refuse if used in invoices
  - Bulk generate: given selected attributes + values, generate all combinations
    - e.g., Color [Red, Blue] × Size [S, M, L] → 6 variants
- [ ] **Frontend:** Variant management on product form/detail
  - When "has variants" is on:
    - Select which attributes apply to this product
    - Select values for each attribute
    - "Generate Variants" button → creates all combinations
    - Variants table: SKU, name (attributes), price (override or inherit), stock, active toggle
    - Inline edit price and SKU per variant
  - When "has variants" is off:
    - Single stock quantity field on the product itself

### 3.3 Invoice Form — Variant Picker
- [ ] **Frontend:** When a product with variants is selected in the invoice line item:
  - Show a second dropdown: "Select Variant" with the variant options
  - Selecting a variant fills in the variant-specific price (if overridden)
  - Stores `productVariantId` on the line item
- [ ] **Backend:** Validate `productVariantId` belongs to the given `productId`

### 3.4 Deliverables Checklist
- [ ] Define org-level variant attributes (Size, Color, etc.) with values
- [ ] Create variants under a product (manual or bulk-generated from attribute combos)
- [ ] Each variant has its own SKU, optional price override, stock count
- [ ] Invoice form shows variant picker for products with variants
- [ ] Variant stock is tracked independently

---

## Phase 4 — Inventory Management

> Goal: Track stock levels, record stock movements, deduct on invoice, receive
> on purchase. Low-stock alerts.

### 4.1 Stock Movement Model
- [ ] **Schema:**
  ```
  model StockMovement {
    id               Int       @id @default(autoincrement())
    organizationId   Int       @map("organization_id")
    productId        Int       @map("product_id")
    productVariantId Int?      @map("product_variant_id")
    type             String    // "sale" | "purchase" | "adjustment" | "return" | "opening"
    quantity         Decimal   @db.Decimal(10, 3)  // positive = in, negative = out
    referenceType    String?   @map("reference_type")  // "invoice" | "purchase_order" | null
    referenceId      Int?      @map("reference_id")
    notes            String?
    createdBy        Int       @map("created_by")
    createdAt        DateTime  @default(now())

    organization     Organization     @relation(fields: [organizationId], references: [id])
    product          Product          @relation(fields: [productId], references: [id])
    variant          ProductVariant?  @relation(fields: [productVariantId], references: [id])
    user             User             @relation(fields: [createdBy], references: [id])

    @@index([organizationId, productId])
    @@index([organizationId, createdAt])
  }
  ```
- [ ] **Product stock field:**
  - Non-variant products: add `stockQuantity Decimal @default(0)` and `lowStockAlert Decimal?` to Product
  - Variant products: stock lives on each ProductVariant (already in Phase 3 schema)

### 4.2 Manual Stock Adjustments
- [ ] **Backend:** Stock adjustment endpoints
  - `POST /organizations/:orgId/products/:id/stock-adjust`
    - Body: `{ quantity, type: "adjustment", notes, variantId? }`
    - Positive = add stock, negative = remove stock
    - Creates StockMovement record
    - Updates `stockQuantity` on Product or ProductVariant
  - `POST /organizations/:orgId/products/:id/stock-set`
    - Body: `{ quantity, notes, variantId? }` — sets absolute stock level
    - Creates an adjustment StockMovement for the difference
- [ ] **Frontend:** Stock adjustment dialog on product detail page
  - "Adjust Stock" button → dialog: quantity (+/-), reason/notes
  - For variant products: select which variant to adjust

### 4.3 Stock Deduction on Invoice
- [ ] **Backend:** When invoice is created/updated with `productId` items:
  - On create (status `draft`): no stock deduction yet
  - On status change to `sent` or `paid`: deduct stock for each line item
  - On status change to `cancelled`: reverse the deduction (add stock back)
  - Create StockMovement records (type: `sale`, referenceType: `invoice`)
  - Configurable per org: `deductStockOn` — `"sent"` or `"created"` (default: `"sent"`)
  - Warn (don't block) if stock would go negative — some businesses allow negative stock
- [ ] **Frontend:** Stock indicators on invoice form
  - Show available stock next to quantity input when a product is selected
  - Warning icon if quantity exceeds available stock

### 4.4 Stock Movement History
- [ ] **Backend:** `GET /organizations/:orgId/stock-movements`
  - Filterable by product, variant, type, date range
  - Paginated, sorted by date desc
  - `GET /organizations/:orgId/products/:id/stock-movements` — for a specific product
- [ ] **Frontend:** Stock movement history
  - On product detail page: table showing all movements (date, type, qty, reference, notes, by)
  - Org-level stock report page: `/org/:orgId/inventory/movements`
    - Full movement log with filters

### 4.5 Low-Stock Alerts
- [ ] **Backend:** `GET /organizations/:orgId/inventory/low-stock`
  - Returns products/variants where `stockQuantity <= lowStockAlert`
  - Include: product name, variant, current stock, alert threshold
- [ ] **Frontend:**
  - Low-stock badge count in sidebar nav
  - Low-stock list page at `/org/:orgId/inventory/low-stock`
  - Dashboard card: "X products low on stock" (integrates with Phase 6 dashboard)

### 4.6 Inventory Summary
- [ ] **Backend:** `GET /organizations/:orgId/inventory/summary`
  - Total products, total stock value (quantity × purchase price), low stock count
  - By category: product count, stock value per category
- [ ] **Frontend:** Inventory summary on product list page or dashboard
  - Total stock value, product counts by category, low-stock warnings

### 4.7 Deliverables Checklist
- [ ] Stock quantity tracked per product and per variant
- [ ] Manual stock adjustments with movement history
- [ ] Invoice creation deducts stock (configurable trigger: on sent or on create)
- [ ] Cancellation reverses stock deduction
- [ ] Low-stock alerts with configurable threshold
- [ ] Full stock movement audit trail
- [ ] Inventory summary with stock valuation

---

## Phase 5 — Suppliers & Purchase Orders

> Goal: Manage suppliers, create purchase orders, receive goods into inventory.

### 5.1 Supplier Model
- [ ] **Schema:**
  ```
  model Supplier {
    id             Int       @id @default(autoincrement())
    organizationId Int       @map("organization_id")
    name           String
    email          String?
    phone          String?
    address        String?   @db.Text
    gstNumber      String?   @map("gst_number") @db.VarChar(15)
    stateCode      String?   @map("state_code") @db.VarChar(2)
    contactPerson  String?   @map("contact_person")
    notes          String?   @db.Text
    isActive       Boolean   @default(true) @map("is_active")
    createdAt      DateTime  @default(now())
    updatedAt      DateTime  @updatedAt

    organization   Organization    @relation(fields: [organizationId], references: [id])
    purchaseOrders PurchaseOrder[]

    @@index([organizationId, name])
  }
  ```
- [ ] **Backend:** Supplier module — full CRUD
  - `GET /organizations/:orgId/suppliers` — list with search, pagination
  - Standard CRUD endpoints
  - Refuse delete if purchase orders exist (soft delete via `isActive`)
- [ ] **Frontend:** Supplier pages
  - Supplier list at `/org/:orgId/suppliers`
  - Add/edit supplier dialog
  - Supplier detail page with purchase history
  - Sidebar: add "Suppliers" nav item

### 5.2 Purchase Orders
- [ ] **Schema:**
  ```
  model PurchaseOrder {
    id               Int       @id @default(autoincrement())
    organizationId   Int       @map("organization_id")
    supplierId       Int       @map("supplier_id")
    poNumber         String    @map("po_number")  // PO-0001
    poDate           DateTime  @default(now()) @map("po_date")
    expectedDate     DateTime? @map("expected_date")
    status           String    @default("draft")  // draft | ordered | partially_received | received | cancelled
    subtotal         Decimal   @db.Decimal(12, 2)
    taxTotal         Decimal   @default(0) @map("tax_total") @db.Decimal(12, 2)
    grandTotal       Decimal   @map("grand_total") @db.Decimal(12, 2)
    notes            String?   @db.Text
    deletedAt        DateTime? @map("deleted_at")
    createdAt        DateTime  @default(now())
    updatedAt        DateTime  @updatedAt

    organization     Organization @relation(fields: [organizationId], references: [id])
    supplier         Supplier     @relation(fields: [supplierId], references: [id])
    items            PurchaseOrderItem[]

    @@index([organizationId, status])
    @@index([supplierId])
  }

  model PurchaseOrderItem {
    id               Int     @id @default(autoincrement())
    purchaseOrderId  Int     @map("purchase_order_id")
    productId        Int     @map("product_id")
    productVariantId Int?    @map("product_variant_id")
    description      String
    quantity         Decimal @db.Decimal(10, 3)
    receivedQuantity Decimal @default(0) @map("received_quantity") @db.Decimal(10, 3)
    rate             Decimal @db.Decimal(12, 2)
    amount           Decimal @db.Decimal(12, 2)
    gstRate          Decimal @default(0) @map("gst_rate") @db.Decimal(4, 2)

    purchaseOrder    PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
    product          Product       @relation(fields: [productId], references: [id])
    variant          ProductVariant? @relation(fields: [productVariantId], references: [id])

    @@index([purchaseOrderId])
  }
  ```
- [ ] **Backend:** Purchase order module
  - CRUD with status machine: draft → ordered → partially_received → received, anything → cancelled
  - Auto-number: PO-0001 per org (org gets `poPrefix` and `nextPoNumber`)
  - GST calculation on purchase items (same engine as invoices)
  - `POST /purchase-orders/:id/receive` — receive goods
    - Body: `[{ itemId, receivedQuantity }]`
    - Creates StockMovement records (type: `purchase`, referenceType: `purchase_order`)
    - Updates `receivedQuantity` on each PO item
    - Updates product/variant stock
    - Auto-transitions status based on received vs ordered quantities
  - Partial receiving supported — receive some items now, rest later
- [ ] **Frontend:** Purchase order pages
  - PO list at `/org/:orgId/purchase-orders`
  - Create/edit PO form: select supplier, add product items (product picker), quantities, rates
  - PO detail page: status, items with received vs ordered, "Receive" button
  - Receive dialog: check off items and enter received quantities
  - PO print template

### 5.3 Purchase Cost Tracking
- [ ] Track `purchasePrice` on Product (already in Phase 2 schema)
- [ ] PO item rate updates `purchasePrice` on the product (optional: latest or weighted average)
- [ ] Inventory valuation report: stock value based on purchase price
- [ ] Profit margin indicators: selling price vs purchase price per product

### 5.4 Deliverables Checklist
- [ ] Supplier CRUD with contact details and GST
- [ ] Purchase order creation with product items
- [ ] PO status machine: draft → ordered → received
- [ ] Receive goods → stock increases automatically
- [ ] Partial receiving supported
- [ ] Purchase price tracked per product
- [ ] Stock movement audit trail includes purchase references

---

## Phase 6 — Smart Invoice Form & Dashboard

> Goal: Business type controls which invoice fields are visible. Dashboard shows
> actionable analytics.

### 6.1 Business-Type Field Visibility Rules
- [ ] **Define field groups by business type:**
  ```
  Trading:        challanNo ✓, vehicleNo ✓, siteLocation ✗, billingAddress ✓
  Manufacturing:  challanNo ✓, vehicleNo ✓, siteLocation ✗, billingAddress ✓
  Services:       challanNo ✗, vehicleNo ✗, siteLocation ✗, billingAddress ✓
  Construction:   challanNo ✓, vehicleNo ✓, siteLocation ✓, billingAddress ✓
  Retail:         challanNo ✗, vehicleNo ✗, siteLocation ✗, billingAddress ✗
  Wholesale:      challanNo ✓, vehicleNo ✓, siteLocation ✗, billingAddress ✓
  Transport:      challanNo ✓, vehicleNo ✓, siteLocation ✓, billingAddress ✗
  Consulting:     challanNo ✗, vehicleNo ✗, siteLocation ✗, billingAddress ✓
  Freelancing:    challanNo ✗, vehicleNo ✗, siteLocation ✗, billingAddress ✗
  Default (other): all fields visible (user hides what they don't need)
  ```
- [ ] **Backend:** Store visibility rules as a JSON config on Organization
  - `invoiceFieldConfig Json?` — allows per-org override beyond the business type default
  - API: `GET /organizations/:orgId/invoice-field-config`, `PATCH` to customize
- [ ] **Frontend:** Invoice form respects field visibility
  - On form load: check org's `businessType` → apply visibility rules
  - Hidden fields are not rendered (not just `display: none`)
  - Org settings page: "Customize Invoice Fields" — toggle individual fields on/off
  - Overrides persist as `invoiceFieldConfig` on the org

### 6.2 Dashboard Analytics API
- [ ] New module: `analytics` under `/api/v1/organizations/:orgId/analytics`
- [ ] `GET /summary` — aggregated counts and totals
  - Total revenue (sum of `grandTotal` where status = `paid`, `deletedAt` is null)
  - This month's revenue
  - Total outstanding (sum of `balanceDue` where status = `sent`)
  - Total overdue (outstanding past due — fallback to invoice date + 30d)
  - Invoice counts by status
  - Total active customers
  - Total products, low-stock count
- [ ] `GET /revenue-over-time?months=12` — monthly revenue for the last N months
- [ ] `GET /gst-summary?from=&to=` — GST filing helper
  - Groups by GST rate slab: count, taxable value, CGST, SGST, IGST
  - Separates intra-state vs inter-state (useful for GSTR-1)
- [ ] `GET /top-customers?limit=10` — top customers by paid revenue
- [ ] `GET /status-breakdown` — invoice counts + amounts by status
- [ ] All endpoints: org-scoped, ownership-guarded, date range filter (`?from=&to=`)

### 6.3 Frontend Dashboard
- [ ] Install `recharts` for charts
- [ ] Summary cards: Revenue, This Month, Outstanding, Overdue, Low Stock
- [ ] Revenue chart: bar chart showing last 12 months
- [ ] Invoice status: donut/pie chart with counts
- [ ] Top customers: table with revenue + outstanding
- [ ] GST summary: table grouped by rate slab
- [ ] Inventory snapshot: stock value, low-stock products
- [ ] Date range picker for filtering
- [ ] Empty states for new orgs

### 6.4 Deliverables Checklist
- [ ] Invoice form hides irrelevant fields based on business type
- [ ] Org can customize field visibility in settings
- [ ] Dashboard shows revenue, outstanding, overdue, stock data
- [ ] Charts render with real data
- [ ] GST summary useful for GSTR-1 filing

---

## Phase 7 — PDF Generation & Email

> Goal: Generate invoice PDFs server-side, email them to customers directly.

### 7.1 Email Service Setup
- [ ] **Backend:** `src/helpers/mailer.ts` — Nodemailer transport configured from env
  - `sendMail({ to, subject, html, attachments })` wrapper
  - Connection verification on boot (warns but doesn't block if SMTP unavailable)
  - Reuses the SMTP config from Phase 1.2
- [ ] **Email templates:** HTML templates for each email type
  - Invoice sent (with PDF attachment)
  - Payment received confirmation
  - Payment reminder
  - Verification email, password reset, invite (from Phase 1)
- [ ] Store email log: `EmailLog` model (to, subject, type, status, sentAt, invoiceId?)

### 7.2 Server-Side PDF Generation
- [ ] **Backend:** `src/helpers/pdfGenerator.ts`
  - Puppeteer: render the existing PrintableInvoice HTML to PDF (pixel-perfect match)
- [ ] `GET /api/v1/organizations/:orgId/invoices/:invoiceId/pdf`
  - Generates PDF on demand, returns as `application/pdf`
  - Caches until invoice is modified
- [ ] PDF stored temporarily, cleaned up periodically

### 7.3 Send Invoice via Email
- [ ] `POST /api/v1/organizations/:orgId/invoices/:invoiceId/send`
  - Generates PDF, sends to customer email
  - Optionally accepts `{ to, cc, subject, message }` overrides
  - Auto-transitions status from `draft` → `sent`
  - Logs in EmailLog
- [ ] **Frontend:** "Send Invoice" button on invoice detail
  - Dialog: pre-filled to/subject, optional message
  - "Resend" for already-sent invoices

### 7.4 Org Email Settings
- [ ] **Schema:** Add SMTP fields to Organization (optional — falls back to system SMTP)
- [ ] **Frontend:** Email settings section on org settings page
  - SMTP config form + "Test Connection" button

### 7.5 Deliverables Checklist
- [ ] PDF download from invoice detail page
- [ ] PDF matches print template
- [ ] Email sends with PDF attachment
- [ ] Status auto-transitions to "sent"
- [ ] Org-level SMTP overrides system SMTP

---

## Phase 8 — Estimates / Quotations

> Goal: Create quotes that convert to invoices with one click.

### 8.1 Schema
- [ ] `Estimate` model (mirrors Invoice — same financial + GST fields)
  - Own number sequence: `estimatePrefix` + `nextEstimateNumber` on Organization
  - Status: `draft` → `sent` → `accepted` / `rejected` / `expired`
  - `validUntil DateTime?` — estimates past this date auto-expire
  - `convertedToInvoiceId Int?` — links to the invoice if converted
- [ ] `EstimateItem` model (mirrors InvoiceItem, includes `productId`, `productVariantId`)

### 8.2 Backend Module
- [ ] Estimate module — full CRUD following invoice pattern
  - Same GST calculation engine
  - Same status machine and edit freeze logic
  - `POST /estimates/:id/convert` — accepted → new invoice, items copied, linked

### 8.3 Frontend Pages
- [ ] Estimate list, create/edit form, detail page
- [ ] Reuse `InvoiceFormFields` with estimate-specific fields (validity period)
- [ ] "Convert to Invoice" button (only when accepted)
- [ ] PDF + email (reuses Phase 7 pipeline)
- [ ] Sidebar: "Estimates" nav item

### 8.4 Deliverables Checklist
- [ ] Full estimate CRUD with GST
- [ ] Status machine with auto-expiry
- [ ] One-click convert to invoice
- [ ] PDF and email for estimates
- [ ] Cross-linked in the UI

---

## Phase 9 — Payments & Reminders

> Goal: Track partial payments, manage overdue invoices, send automated reminders.

### 9.1 Payment Model & Recording
- [ ] `Payment` model: invoiceId, amount, date, method, reference, notes, createdBy
- [ ] `POST /invoices/:id/payments` — record payment (validates ≤ balance)
- [ ] Auto-update `receivedAmount`, auto-mark `paid` when balance = 0
- [ ] Payment history on invoice detail page
- [ ] Void payment support

### 9.2 Payment Terms & Due Dates
- [ ] Add `dueDate DateTime?` and `paymentTerms String?` to Invoice
- [ ] Terms: `due_on_receipt`, `net_15`, `net_30`, `net_60`, `custom`
- [ ] Due date auto-calculated, shown on detail + print template
- [ ] Default terms configurable per org
- [ ] Overdue badges on invoice list

### 9.3 Automated Reminders
- [ ] `ReminderConfig` per org: before-due days, on-due, after-due intervals, enabled toggle
- [ ] Daily cron scans invoices, sends reminder emails (Phase 7)
- [ ] Tracks last reminder to avoid duplicates
- [ ] Frontend: reminder settings on org settings page

### 9.4 Aging Report
- [ ] `GET /analytics/aging` — Current, 1–30, 31–60, 61–90, 90+ day buckets
- [ ] Frontend: aging report page with drill-down to filtered invoices

### 9.5 Credit Notes
- [ ] `CreditNote` model: org-scoped, linked to invoice, own numbering (CN-0001)
- [ ] Create, issue, apply — reduces balance due
- [ ] Credit note list, detail, print template

### 9.6 Gateway-Ready Architecture
- [ ] Payment model shaped for Razorpay responses (method, referenceNumber)
- [ ] Placeholder webhook endpoint
- [ ] Invoice `paymentLink` field for future use

### 9.7 Deliverables Checklist
- [ ] Partial payments with auto-paid transition
- [ ] Due dates from payment terms
- [ ] Overdue indicators
- [ ] Automated email reminders
- [ ] Aging report
- [ ] Credit notes
- [ ] Razorpay-ready data model

---

## Phase 10 — Recurring Invoices

> Goal: Auto-generate invoices on a schedule for subscription clients.

### 10.1 Schema
- [ ] `RecurringTemplate`: org, customer, frequency, start/end date, next run, auto-send, status, items (JSON), discount, terms
- [ ] `RecurringInvoiceLog`: links template to generated invoice

### 10.2 Backend
- [ ] Template CRUD with pause/resume/end
- [ ] Daily cron: generate draft invoices from active templates where `nextRunDate ≤ today`
  - Apply current GST rates
  - Auto-increment invoice number
  - If `autoSend`: email via Phase 7
  - Advance `nextRunDate`, check `endDate`
- [ ] Error handling: log, skip, retry next run

### 10.3 Frontend
- [ ] Template list at `/org/:orgId/recurring`
- [ ] Create/edit form (customer, frequency, items, auto-send toggle)
- [ ] Template detail with generation history
- [ ] "Generate Now" button
- [ ] Dashboard card: active templates + next generation date

### 10.4 Deliverables Checklist
- [ ] Recurring template CRUD
- [ ] Cron auto-generates invoices
- [ ] Auto-send works
- [ ] Pause/resume/end
- [ ] Generation history
- [ ] GST recalculated per generation

---

## Backlog (Not Scheduled)

### System-Level Management Roles

> Platform-level roles separate from org-level roles. These control access to the
> admin panel and system-wide operations (user management, org oversight, support tools).

**Proposed roles:**

| Role | Scope | Permissions |
|------|-------|-------------|
| **superadmin** | Full platform | Everything — system config, role assignment, data access, destructive ops |
| **admin** | Platform management | Manage users, view/manage all orgs, impersonate, but no system config changes |
| **support** | Read + limited write | View users/orgs, reset passwords, unlock accounts, read-only on billing/invoices |
| **user** | Tenant only | Normal user — accesses only their own orgs via org-level roles |

**Implementation notes:**
- Stored as `systemRole` on the User model (default: `user`)
- Admin panel routes guarded by `systemRole` middleware (separate from `orgRole`)
- `superadmin` is the only role that can assign/revoke other system roles
- `admin` can do everything `support` can, plus create/suspend orgs and users
- `support` is read-heavy: search users, view org details, trigger password resets, view invoices (no edit)
- Audit log (backlog item) should capture all system-role actions

**Dependencies:** Audit log (for accountability), Admin panel UI (Phase TBD)

---

- [ ] **Expense tracking** — org-level expenses (category, amount, date, vendor); P&L view
- [ ] **Customer statement** — per-customer: total invoiced, paid, outstanding, history
- [ ] **Multi-currency** — exchange rates, currency per invoice, multi-currency reports
- [ ] **Razorpay integration** — payment links, webhook, UPI QR on invoice
- [ ] **Bulk operations** — bulk status update, bulk PDF download, bulk email send
- [ ] **Audit log** — who did what (invoice created, status changed, stock adjusted)
- [ ] **Custom invoice templates** — multiple layouts per org, customizable branding
- [ ] **Mobile app** — React Native or PWA for on-site invoicing
- [ ] **WhatsApp integration** — send PDF via WhatsApp Business API
- [ ] **E-invoicing (GST)** — generate IRN via NIC portal (mandatory above threshold)
- [ ] **TDS tracking** — TDS deducted by customers, payment reconciliation
- [ ] **Barcode/QR scanning** — scan product barcode to add to invoice
- [ ] **Multi-warehouse** — stock per warehouse/location

---

## Technical Debt (Fix Alongside Features)

- [ ] `npm run typecheck` — change to `tsc -b` (currently no-op under project references)
- [ ] Frontend bundle splitting — route-level lazy loading (currently 878 kB single chunk)
- [ ] Backend ESLint config
- [ ] Test suite — Vitest + Supertest for backend, Vitest + Testing Library for frontend
- [ ] Structured logging (pino) replacing console.log
- [ ] Graceful shutdown (drain connections on SIGTERM)
- [ ] Line item diff on update (currently delete-all + recreate)
- [ ] `JWT_EXPIRES_IN` — set to 15m (currently 1d, was compensating for broken refresh)
