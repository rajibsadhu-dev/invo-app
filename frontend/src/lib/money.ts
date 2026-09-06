/**
 * Client-side mirror of the server's invoice arithmetic (backend/src/helpers/gst.ts and
 * amountInWords.ts).
 *
 * The server is the authority: it recomputes every figure on save and its values are what
 * get stored and printed. This module exists so the form can show a live preview that
 * matches. Any change here must be made there too — the two previously drifted apart
 * (backend said "Cents", frontend said "Paise") and printed different words than it showed.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100
export const roundRupees = (n: number): number => Math.round(n + Number.EPSILON)

export const formatINR = (value: number | string): string =>
  `₹ ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

// ─── Amount in words (Indian numbering) ───────────────────────────────────────

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
]
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
]

const underHundred = (n: number): string => {
  if (n < 20) return ONES[n]
  const tens = TENS[Math.floor(n / 10)]
  const ones = n % 10
  return ones ? `${tens} ${ONES[ones]}` : tens
}

const underThousand = (n: number): string => {
  if (n < 100) return underHundred(n)
  const hundreds = `${ONES[Math.floor(n / 100)]} Hundred`
  const rest = n % 100
  return rest ? `${hundreds} ${underHundred(rest)}` : hundreds
}

const indianWords = (n: number): string => {
  if (n === 0) return ""
  const parts: string[] = []

  const crore = Math.floor(n / 10_000_000)
  let rest = n % 10_000_000
  if (crore > 0) parts.push(`${indianWords(crore)} Crore`)

  const lakh = Math.floor(rest / 100_000)
  rest %= 100_000
  if (lakh > 0) parts.push(`${underThousand(lakh)} Lakh`)

  const thousand = Math.floor(rest / 1_000)
  rest %= 1_000
  if (thousand > 0) parts.push(`${underThousand(thousand)} Thousand`)

  if (rest > 0) parts.push(underThousand(rest))

  return parts.join(" ")
}

export function amountInWords(amount: number): string {
  const value = round2(amount)
  if (value < 0) return `Minus ${amountInWords(-value)}`

  const rupees = Math.floor(value)
  const paise = Math.round((value - rupees) * 100)

  const base = `Rupees ${rupees === 0 ? "Zero" : indianWords(rupees)}`
  return paise > 0 ? `${base} and ${underHundred(paise)} Paise Only` : `${base} Only`
}

// ─── Invoice totals ───────────────────────────────────────────────────────────

export type PreviewLine = {
  quantity?: number | string
  rate?: number | string
  gstRate?: number | string
}

export type InvoiceTotals = {
  lineAmounts: number[]
  lineTax: number[]
  subtotal: number
  discount: number
  taxableValue: number
  cgstTotal: number
  sgstTotal: number
  igstTotal: number
  tax: number
  roundOff: number
  grandTotal: number
}

/**
 * Rates are GST-exclusive. An invoice-level discount is apportioned across lines pro rata
 * by amount, with the residual on the last line so the parts sum to the whole exactly.
 * The payable total is rounded to whole rupees, with the difference reported as roundOff.
 */
export function computeInvoiceTotals(
  items: PreviewLine[],
  options: { discount?: number; isIntraState: boolean }
): InvoiceTotals {
  const discount = round2(Number(options.discount) || 0)

  const lineAmounts = items.map((item) =>
    round2((Number(item?.quantity) || 0) * (Number(item?.rate) || 0))
  )
  const subtotal = round2(lineAmounts.reduce((sum, a) => sum + a, 0))

  const discounts: number[] = []
  let allocated = 0
  lineAmounts.forEach((amount, index) => {
    if (index === lineAmounts.length - 1) {
      discounts.push(round2(discount - allocated))
      return
    }
    const share = subtotal === 0 ? 0 : round2((discount * amount) / subtotal)
    discounts.push(share)
    allocated = round2(allocated + share)
  })

  let cgstTotal = 0
  let sgstTotal = 0
  let igstTotal = 0
  const lineTax: number[] = []

  lineAmounts.forEach((amount, index) => {
    const taxable = round2(amount - (discounts[index] ?? 0))
    const rate = Number(items[index]?.gstRate) || 0
    const gst = round2((taxable * rate) / 100)
    lineTax.push(gst)

    if (options.isIntraState) {
      const cgst = round2(gst / 2)
      cgstTotal = round2(cgstTotal + cgst)
      sgstTotal = round2(sgstTotal + round2(gst - cgst))
    } else {
      igstTotal = round2(igstTotal + gst)
    }
  })

  const taxableValue = round2(subtotal - discount)
  const tax = round2(cgstTotal + sgstTotal + igstTotal)
  const beforeRounding = round2(taxableValue + tax)
  const grandTotal = roundRupees(beforeRounding)
  const roundOff = round2(grandTotal - beforeRounding)

  return {
    lineAmounts,
    lineTax,
    subtotal,
    discount,
    taxableValue,
    cgstTotal,
    sgstTotal,
    igstTotal,
    tax,
    roundOff,
    grandTotal,
  }
}
