/**
 * Suggested business types for the organization form.
 *
 * Suggestions only — the field is free text and the server stores whatever is typed, so a
 * business that fits none of these can still say what it does.
 */
export const BUSINESS_TYPES = [
  "Trading",
  "Manufacturing",
  "Services",
  "Construction",
  "Retail",
  "Wholesale",
  "Import/Export",
  "Consulting",
  "Freelancing",
  "Healthcare",
  "Education",
  "Transportation",
  "Agriculture",
  "IT & Software",
  "Other",
] as const

export const BUSINESS_TYPE_LIST_ID = "invo-business-types"
