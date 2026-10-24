export type InvoiceFieldConfig = {
  challanNo: boolean
  vehicleNo: boolean
  siteLocation: boolean
  billingAddress: boolean
  qrVerification: boolean
}

const ALL_VISIBLE: InvoiceFieldConfig = {
  challanNo: true,
  vehicleNo: true,
  siteLocation: true,
  billingAddress: true,
  qrVerification: false,
}

const BUSINESS_TYPE_DEFAULTS: Record<string, InvoiceFieldConfig> = {
  Trading: { challanNo: true, vehicleNo: true, siteLocation: false, billingAddress: true, qrVerification: false },
  Manufacturing: { challanNo: true, vehicleNo: true, siteLocation: false, billingAddress: true, qrVerification: false },
  Services: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: true, qrVerification: false },
  Construction: { challanNo: true, vehicleNo: true, siteLocation: true, billingAddress: true, qrVerification: false },
  Retail: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: false, qrVerification: false },
  Wholesale: { challanNo: true, vehicleNo: true, siteLocation: false, billingAddress: true, qrVerification: false },
  "Import/Export": { challanNo: true, vehicleNo: true, siteLocation: false, billingAddress: true, qrVerification: false },
  Consulting: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: true, qrVerification: false },
  Freelancing: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: false, qrVerification: false },
  Healthcare: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: true, qrVerification: false },
  Education: { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: true, qrVerification: false },
  Transportation: { challanNo: true, vehicleNo: true, siteLocation: true, billingAddress: false, qrVerification: false },
  Agriculture: { challanNo: true, vehicleNo: true, siteLocation: true, billingAddress: true, qrVerification: false },
  "IT & Software": { challanNo: false, vehicleNo: false, siteLocation: false, billingAddress: true, qrVerification: false },
}

export const INVOICE_FIELD_LABELS: Record<keyof InvoiceFieldConfig, string> = {
  challanNo: "Challan No.",
  vehicleNo: "Vehicle No.",
  siteLocation: "Site / Delivery Location",
  billingAddress: "Billing Address",
  qrVerification: "QR Code Verification",
}

export const INVOICE_FIELD_KEYS = Object.keys(INVOICE_FIELD_LABELS) as (keyof InvoiceFieldConfig)[]

export function resolveFieldConfig(
  businessType?: string | null,
  override?: Partial<InvoiceFieldConfig> | null
): InvoiceFieldConfig {
  const base = businessType
    ? BUSINESS_TYPE_DEFAULTS[businessType] ?? ALL_VISIBLE
    : ALL_VISIBLE

  if (!override) return base

  return {
    challanNo: override.challanNo ?? base.challanNo,
    vehicleNo: override.vehicleNo ?? base.vehicleNo,
    siteLocation: override.siteLocation ?? base.siteLocation,
    billingAddress: override.billingAddress ?? base.billingAddress,
    qrVerification: override.qrVerification ?? base.qrVerification,
  }
}
