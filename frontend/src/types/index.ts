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
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  customer?: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; gstNumber?: string | null; stateCode?: string | null }
  items?: InvoiceItem[]
}

export type InvoiceItemPayload = {
  productId?: number | null
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
  isActive: boolean
  hasVariants: boolean
  createdAt: string
  updatedAt: string
  category?: { id: number; name: string } | null
  _count?: { invoiceItems: number }
}

/** Trimmed shape returned by the invoice-form picker endpoint. */
export type ProductPickerHit = {
  id: number
  name: string
  sku?: string | null
  hsnCode?: string | null
  unit?: string | null
  sellingPrice: string
  gstRate: string
  hasVariants: boolean
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
