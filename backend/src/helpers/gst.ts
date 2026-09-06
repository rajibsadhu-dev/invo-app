import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;
type Numeric = Prisma.Decimal | number | string;

export const dec = (v: Numeric): Prisma.Decimal => new D(v);

/** Currency rounding: 2 dp, half-up — the convention Indian invoicing expects. */
export const money = (v: Numeric): Prisma.Decimal =>
  new D(v).toDecimalPlaces(2, D.ROUND_HALF_UP);

/** Round to whole rupees for the invoice's final payable figure. */
export const toRupees = (v: Numeric): Prisma.Decimal =>
  new D(v).toDecimalPlaces(0, D.ROUND_HALF_UP);

export type GstLineInput = {
  description: string;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: Numeric;
  rate: Numeric;
  gstRate?: Numeric;
};

export type GstLine = {
  description: string;
  hsnCode: string | null;
  unit: string | null;
  quantity: Prisma.Decimal;
  rate: Prisma.Decimal;
  amount: Prisma.Decimal;
  discount: Prisma.Decimal;
  taxableValue: Prisma.Decimal;
  gstRate: Prisma.Decimal;
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
};

export type GstTotals = {
  lines: GstLine[];
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  taxableValue: Prisma.Decimal;
  cgstTotal: Prisma.Decimal;
  sgstTotal: Prisma.Decimal;
  igstTotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  roundOff: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
};

/**
 * Computes an invoice's line and header figures.
 *
 * All arithmetic runs in Decimal end to end — the columns are DECIMAL(12,2) and doing the
 * intermediate maths in JS floats reintroduces exactly the drift the column type prevents.
 *
 * Rates are GST-exclusive. An invoice-level discount is apportioned across lines pro rata
 * by line amount so that each line's taxable value — and therefore its GST — reflects its
 * share, and the apportioned parts still sum to the discount exactly.
 *
 * The payable total is rounded to whole rupees; the difference is carried in `roundOff`,
 * which is what the "Round Off" line on a GST invoice reports.
 */
export function computeInvoiceTotals(
  items: GstLineInput[],
  options: { discount?: Numeric; isIntraState: boolean }
): GstTotals {
  const discount = money(options.discount ?? 0);

  const amounts = items.map((item) => money(dec(item.quantity).times(item.rate)));
  const subtotal = money(amounts.reduce((sum, a) => sum.plus(a), new D(0)));

  // Apportion the discount, giving the last line the residual so rounding at each step
  // cannot make the parts sum to something other than the whole.
  const discounts: Prisma.Decimal[] = [];
  let allocated = new D(0);
  amounts.forEach((amount, index) => {
    const isLast = index === amounts.length - 1;
    if (isLast) {
      discounts.push(discount.minus(allocated));
      return;
    }
    const share = subtotal.isZero()
      ? new D(0)
      : money(discount.times(amount).dividedBy(subtotal));
    discounts.push(share);
    allocated = allocated.plus(share);
  });

  const lines: GstLine[] = items.map((item, index) => {
    const amount = amounts[index];
    const lineDiscount = discounts[index];
    const taxableValue = money(amount.minus(lineDiscount));
    const gstRate = money(item.gstRate ?? 0);

    const gst = money(taxableValue.times(gstRate).dividedBy(100));

    // Split so the halves always add back to the whole, even on an odd number of paise.
    const cgst = options.isIntraState
      ? money(gst.dividedBy(2))
      : new D(0);
    const sgst = options.isIntraState ? money(gst.minus(cgst)) : new D(0);
    const igst = options.isIntraState ? new D(0) : gst;

    return {
      description: item.description,
      hsnCode: item.hsnCode ?? null,
      unit: item.unit ?? null,
      quantity: dec(item.quantity).toDecimalPlaces(3, D.ROUND_HALF_UP),
      rate: money(item.rate),
      amount,
      discount: lineDiscount,
      taxableValue,
      gstRate,
      cgst,
      sgst,
      igst,
    };
  });

  const sum = (pick: (l: GstLine) => Prisma.Decimal) =>
    money(lines.reduce((acc, l) => acc.plus(pick(l)), new D(0)));

  const taxableValue = money(subtotal.minus(discount));
  const cgstTotal = sum((l) => l.cgst);
  const sgstTotal = sum((l) => l.sgst);
  const igstTotal = sum((l) => l.igst);
  const tax = money(cgstTotal.plus(sgstTotal).plus(igstTotal));

  const beforeRounding = money(taxableValue.plus(tax));
  const grandTotal = toRupees(beforeRounding);
  const roundOff = money(grandTotal.minus(beforeRounding));

  return {
    lines,
    subtotal,
    discount,
    taxableValue,
    cgstTotal,
    sgstTotal,
    igstTotal,
    tax,
    roundOff,
    grandTotal,
  };
}
