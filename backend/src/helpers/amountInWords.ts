import { Prisma } from "@prisma/client";

type Numeric = Prisma.Decimal | number | string;

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

/** n < 100 */
const underHundred = (n: number): string => {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones ? `${tens} ${ONES[ones]}` : tens;
};

/** n < 1000 */
const underThousand = (n: number): string => {
  if (n < 100) return underHundred(n);
  const hundreds = `${ONES[Math.floor(n / 100)]} Hundred`;
  const rest = n % 100;
  return rest ? `${hundreds} ${underHundred(rest)}` : hundreds;
};

/**
 * Indian numbering: crore / lakh / thousand, not million / billion. Recurses on the
 * crore count so values above 99 crore ("One Hundred Twenty Crore") read correctly.
 */
const indianWords = (n: number): string => {
  if (n === 0) return "";

  const parts: string[] = [];

  const crore = Math.floor(n / CRORE);
  let rest = n % CRORE;
  if (crore > 0) parts.push(`${indianWords(crore)} Crore`);

  const lakh = Math.floor(rest / LAKH);
  rest %= LAKH;
  if (lakh > 0) parts.push(`${underThousand(lakh)} Lakh`);

  const thousand = Math.floor(rest / THOUSAND);
  rest %= THOUSAND;
  if (thousand > 0) parts.push(`${underThousand(thousand)} Thousand`);

  if (rest > 0) parts.push(underThousand(rest));

  return parts.join(" ");
};

/**
 * Renders an amount as Indian-English currency words for the invoice face.
 *
 * This is the single source of truth — the frontend must render the value the backend
 * stored rather than computing its own, or the two drift (they previously disagreed on
 * "Cents" versus "Paise").
 */
export function amountInWords(amount: Numeric): string {
  const value = new Prisma.Decimal(amount).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );

  if (value.isNegative()) {
    return `Minus ${amountInWords(value.abs())}`;
  }

  const rupees = value.floor().toNumber();
  const paise = value.minus(value.floor()).times(100).round().toNumber();

  const rupeeWords = rupees === 0 ? "Zero" : indianWords(rupees);
  const base = `Rupees ${rupeeWords}`;

  return paise > 0
    ? `${base} and ${underHundred(paise)} Paise Only`
    : `${base} Only`;
}
