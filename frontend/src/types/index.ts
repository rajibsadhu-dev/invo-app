export type ApiResponse<T> = {
  statusCode: number
  success: boolean
  message: string
  data: T
}

export type UserRole = "superadmin" | "user"

export type UserOrgMembership = {
  id: number
  organizationId: number
  role: OrgRole
  organization: {
    id: number
    name: string
    logo?: string | null
  }
}

export type User = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: UserRole
  emailVerifiedAt?: string | null
  orgMemberships?: UserOrgMembership[]
  createdAt: string
  updatedAt: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  orgName: string
  businessType?: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginData = {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    name: string
    email: string
    role: UserRole
    emailVerifiedAt?: string | null
  }
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole
}

/** Self-service profile edit — deliberately cannot carry `role` or `password`. */
export type UpdateMePayload = {
  name?: string
  email?: string
  phone?: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type UpdateUserPayload = {
  name?: string
  email?: string
  password?: string
  phone?: string
  role?: UserRole
}

// ─── Organization ─────────────────────────────────────────────────────────────

export type Organization = {
  id: number
  name: string
  ownerId: number
  address?: string | null
  phone?: string | null
  email?: string | null
  logo?: string | null
  registerNumber?: string | null
  gstNumber?: string | null
  stateCode?: string | null
  /** Free text — what the business does. Drives invoice-form field visibility later. */
  businessType?: string | null
  invoicePrefix: string
  nextInvoiceNumber: number
  deductStockOn: "sent" | "created"
  createdAt: string
  updatedAt: string
}

export type CreateOrgPayload = {
  name: string
  address?: string
  phone?: string
  email?: string
  registerNumber?: string
  gstNumber?: string
  stateCode?: string
  businessType?: string
  invoicePrefix?: string
}

export type UpdateOrgPayload = Partial<CreateOrgPayload> & {
  nextInvoiceNumber?: number
}

export type OrganizationWithOwner = Organization & {
  owner: { id: number; name: string; email: string }
}

export type OrgRole = "owner" | "admin" | "manager" | "staff" | "viewer"

export type OrgMember = {
  id: number
  organizationId: number
  userId: number
  role: OrgRole
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    email: string
    phone?: string | null
  }
}

export type OrgInvite = {
  id: number
  organizationId: number
  email: string
  role: OrgRole
  expiresAt: string
  invitedById: number
  createdAt: string
  invitedBy: {
    id: number
    name: string
    email: string
  }
}

export type InviteInfo = {
  email: string
  role: OrgRole
  orgName: string
  invitedBy: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  statusCode: number
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type Customer = {
  id: number
  organizationId: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  gstNumber?: string | null
  stateCode?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCustomerPayload = {
  name: string
  email?: string
  phone?: string
  address?: string
  gstNumber?: string
  stateCode?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled"
export type PaymentMethod = "cash" | "bank" | "upi"

export type InvoiceItem = {
  id: number
  invoiceId: number
  /** Set when the line came from the catalogue; null for a hand-typed line. */
  productId?: number | null
  /** Set when the line came from a specific variant. */
  productVariantId?: number | null
  description: string
  hsnCode?: string | null
  unit?: string | null
  quantity: string
  rate: string
  amount: string
  discount: string
  taxableValue: string
  gstRate: string
  cgst: string
  sgst: string
  igst: string
}

export type Invoice = {
  id: number
  organizationId: number
  customerId: number
  invoiceNumber: string
  invoiceDate: string
  subtotal: string
  // Total GST = cgstTotal + sgstTotal + igstTotal. Pre-GST invoices keep their flat tax here.
  tax: string
  discount: string
  taxableValue: string
  cgstTotal: string
  sgstTotal: string
  igstTotal: string
  roundOff: string
  placeOfSupply?: string | null
  isIntraState: boolean
  grandTotal: string
  receivedAmount: string
  balanceDue: string
  status: InvoiceStatus
  amountInWords?: string | null
  // Reference fields
  challanNo?: string | null
  vehicleNo?: string | null
  siteLocation?: string | null
  billingAddress?: string | null
  referenceNumber?: string | null
  // Payment
  paymentMethod?: PaymentMethod | null
  bankName?: string | null
  bankAccount?: string | null
  bankIfsc?: string | null
  transactionNumber?: string | null
  // Footer
  termsAndConditions?: string | null
  notes?: string | null
  authorizedSignatory?: string | null
  verificationToken?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  customer?: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; gstNumber?: string | null; stateCode?: string | null }
  items?: InvoiceItem[]
}

export type InvoiceItemPayload = {
  productId?: number | null
  productVariantId?: number | null
  description: string
  hsnCode?: string | null
  unit?: string | null
  quantity: number
  rate: number
  gstRate?: number
}

export type CreateInvoicePayload = {
  customerId: number
  invoiceDate?: string
  items: InvoiceItemPayload[]
  discount?: number
  receivedAmount?: number
  challanNo?: string | null
  vehicleNo?: string | null
  siteLocation?: string | null
  billingAddress?: string | null
  referenceNumber?: string | null
  paymentMethod?: PaymentMethod | null
  bankName?: string | null
  bankAccount?: string | null
  bankIfsc?: string | null
  transactionNumber?: string | null
  termsAndConditions?: string | null
  notes?: string | null
  authorizedSignatory?: string | null
}

export type UpdateInvoicePayload = Partial<CreateInvoicePayload> & {
  status?: InvoiceStatus
}

// ─── Product Catalogue ────────────────────────────────────────────────────────

export type ProductCategory = {
  id: number
  organizationId: number
  name: string
  description?: string | null
  parentId?: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { products: number; children?: number }
}

/** What `GET /categories?tree=true` returns: the same rows, nested. */
export type ProductCategoryNode = ProductCategory & {
  children: ProductCategoryNode[]
}

export type ProductCategoryDetail = ProductCategory & {
  parent?: { id: number; name: string } | null
  children?: { id: number; name: string }[]
}

export type CreateCategoryPayload = {
  name: string
  description?: string | null
  parentId?: number | null
  sortOrder?: number
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

/** Decimal columns arrive as strings, the same as invoice money fields. */
export type Product = {
  id: number
  organizationId: number
  categoryId?: number | null
  name: string
  sku?: string | null
  description?: string | null
  hsnCode?: string | null
  unit?: string | null
  sellingPrice: string
  purchasePrice?: string | null
  gstRate: string
  stockQuantity: string
  lowStockAlert?: string | null
  isActive: boolean
  hasVariants: boolean
  createdAt: string
  updatedAt: string
  category?: { id: number; name: string } | null
  variants?: ProductVariant[]
  _count?: { invoiceItems: number; variants?: number }
}

/** Trimmed shape returned by the invoice-form picker endpoint. */
export type ProductPickerHit = {
  id: number
  name: string
  sku?: string | null
  hsnCode?: string | null
  unit?: string | null
  sellingPrice: string
  purchasePrice?: string | null
  gstRate: string
  stockQuantity: string
  hasVariants: boolean
  variants?: ProductVariantPickerHit[]
}

// ─── Variant Attributes ──────────────────────────────────────────────────────

export type VariantAttribute = {
  id: number
  organizationId: number
  name: string
  values: string[]
  createdAt: string
  updatedAt: string
}

export type CreateVariantAttributePayload = {
  name: string
  values: string[]
}

export type UpdateVariantAttributePayload = {
  name?: string
  values?: string[]
}

// ─── Product Variants ────────────────────────────────────────────────────────

export type ProductVariant = {
  id: number
  productId: number
  sku?: string | null
  name: string
  attributes: Record<string, string>
  sellingPrice?: string | null
  purchasePrice?: string | null
  stockQuantity: string
  lowStockAlert?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { invoiceItems: number }
}

export type ProductVariantPickerHit = {
  id: number
  name: string
  sku?: string | null
  sellingPrice?: string | null
  purchasePrice?: string | null
  attributes: Record<string, string>
  stockQuantity: string
}

export type CreateVariantPayload = {
  sku?: string | null
  name: string
  attributes: Record<string, string>
  sellingPrice?: number | null
  purchasePrice?: number | null
  isActive?: boolean
}

export type UpdateVariantPayload = {
  sku?: string | null
  name?: string
  sellingPrice?: number | null
  purchasePrice?: number | null
  isActive?: boolean
}

export type BulkGenerateVariantsPayload = {
  attributes: Record<string, string[]>
}

export type BulkGenerateResult = {
  created: number
  skipped: number
}

export type CreateProductPayload = {
  name: string
  sku?: string | null
  description?: string | null
  categoryId?: number | null
  hsnCode?: string | null
  unit?: string | null
  sellingPrice: number
  purchasePrice?: number | null
  gstRate?: number
  isActive?: boolean
  hasVariants?: boolean
}

export type UpdateProductPayload = Partial<CreateProductPayload>

// ─── Inventory / Stock ──────────────────────────────────────────────────────

export type StockMovementType = "sale" | "purchase" | "adjustment" | "return" | "opening"

export type StockMovement = {
  id: number
  organizationId: number
  productId: number
  productVariantId?: number | null
  type: StockMovementType
  quantity: string
  referenceType?: string | null
  referenceId?: number | null
  notes?: string | null
  createdBy: number
  createdAt: string
  product: { id: number; name: string; sku?: string | null }
  variant?: { id: number; name: string; sku?: string | null } | null
  user: { id: number; name: string }
}

export type StockAdjustPayload = {
  quantity: number
  type?: StockMovementType
  notes?: string
  variantId?: number
}

export type StockSetPayload = {
  quantity: number
  notes?: string
  variantId?: number
}

export type LowStockItem = {
  type: "product" | "variant"
  id: number
  productId?: number
  productName?: string
  name: string
  sku?: string | null
  stockQuantity: string
  lowStockAlert: string
}

export type LowStockResult = {
  products: LowStockItem[]
  variants: LowStockItem[]
  totalCount: number
}

export type InventorySummary = {
  totalProducts: number
  totalProductStock: string
  totalVariantStock: string
  lowStockCount: number
  byCategory: Array<{
    categoryId: number | null
    categoryName: string
    productCount: number
  }>
}

// ─── Supplier ──────────────────────────────────────────────────────────────

export type Supplier = {
  id: number
  organizationId: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  gstNumber?: string | null
  stateCode?: string | null
  contactPerson?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { purchaseOrders: number }
}

export type SupplierPickerHit = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  gstNumber?: string | null
  stateCode?: string | null
  contactPerson?: string | null
}

export type CreateSupplierPayload = {
  name: string
  email?: string
  phone?: string
  address?: string
  gstNumber?: string
  stateCode?: string
  contactPerson?: string
  notes?: string
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload> & {
  isActive?: boolean
}

// ─── Purchase Order ─────────────────────────────────────────────────────────

export type POStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled"

export type PurchaseOrderItem = {
  id: number
  purchaseOrderId: number
  productId: number
  productVariantId?: number | null
  description: string
  hsnCode?: string | null
  unit?: string | null
  quantity: string
  receivedQuantity: string
  rate: string
  amount: string
  gstRate: string
  gstAmount: string
  product?: { id: number; name: string; sku?: string | null; hasVariants?: boolean }
  variant?: { id: number; name: string; sku?: string | null } | null
}

export type PurchaseOrder = {
  id: number
  organizationId: number
  supplierId: number
  poNumber: string
  poDate: string
  expectedDate?: string | null
  status: POStatus
  subtotal: string
  taxTotal: string
  grandTotal: string
  notes?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  supplier?: { id: number; name: string }
  items?: PurchaseOrderItem[]
  _count?: { items: number }
}

export type POItemPayload = {
  productId: number
  productVariantId?: number | null
  description: string
  hsnCode?: string | null
  unit?: string | null
  quantity: number
  rate: number
  gstRate?: number
}

export type CreatePOPayload = {
  supplierId: number
  poDate?: string
  expectedDate?: string | null
  notes?: string
  items: POItemPayload[]
}

export type UpdatePOPayload = Partial<CreatePOPayload> & {
  status?: POStatus
}

export type ReceivePOPayload = {
  items: Array<{ itemId: number; quantity: number }>
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsSummary = {
  totalRevenue: string
  thisMonthRevenue: string
  totalOutstanding: string
  totalOverdue: string
  invoiceCountByStatus: Record<string, number>
  totalCustomers: number
  totalProducts: number
  lowStockCount: number
}

export type RevenueMonth = {
  month: string
  revenue: string
}

export type GstSlabRow = {
  gstRate: string
  count: number
  taxableValue: string
  cgst: string
  sgst: string
  igst: string
}

export type GstSummaryData = {
  rows: GstSlabRow[]
  intraState: GstSlabRow[]
  interState: GstSlabRow[]
}

export type TopCustomer = {
  customerId: number
  customerName: string
  totalRevenue: string
  invoiceCount: number
}

export type StatusBreakdown = {
  status: string
  count: number
  totalAmount: string
}
