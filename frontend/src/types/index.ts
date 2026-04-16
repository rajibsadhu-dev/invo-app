export type ApiResponse<T> = {
  statusCode: number
  success: boolean
  message: string
  data: T
}

export type UserRole = "superadmin" | "user"

export type User = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
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
  }
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  phone?: string
  role: UserRole
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
  invoicePrefix?: string
}

export type UpdateOrgPayload = Partial<CreateOrgPayload> & {
  nextInvoiceNumber?: number
}

export type OrganizationWithOwner = Organization & {
  owner: { id: number; name: string; email: string }
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
  createdAt: string
  updatedAt: string
}

export type CreateCustomerPayload = {
  name: string
  email?: string
  phone?: string
  address?: string
  gstNumber?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled"
export type PaymentMethod = "cash" | "bank" | "upi"

export type InvoiceItem = {
  id: number
  invoiceId: number
  description: string
  unit?: string | null
  quantity: string
  rate: string
  amount: string
}

export type Invoice = {
  id: number
  organizationId: number
  customerId: number
  invoiceNumber: string
  invoiceDate: string
  subtotal: string
  tax: string
  discount: string
  grandTotal: string
  receivedAmount: string
  balanceDue: number
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
  createdAt: string
  updatedAt: string
  customer?: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; gstNumber?: string | null }
  items?: InvoiceItem[]
}

export type InvoiceItemPayload = {
  description: string
  unit?: string | null
  quantity: number
  rate: number
}

export type CreateInvoicePayload = {
  customerId: number
  invoiceDate?: string
  items: InvoiceItemPayload[]
  tax?: number
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
