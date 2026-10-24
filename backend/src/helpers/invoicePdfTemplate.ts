/**
 * Server-side HTML template for invoice PDF generation.
 * Visual contract mirrors: frontend/src/pages/invoices/PrintableInvoice.tsx
 * All styles are inline — no external CSS required by Puppeteer.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Num = any; // Prisma Decimal | number | string — all coerced via num()

type InvoiceItem = {
  id: number;
  description: string;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: Num;
  rate: Num;
  amount: Num;
  gstRate?: Num;
};

type InvoiceData = {
  invoiceNumber: string;
  invoiceDate?: string | Date | null;
  createdAt: string | Date;
  status: string;
  subtotal: Num;
  tax: Num;
  discount: Num;
  taxableValue?: Num;
  cgstTotal?: Num;
  sgstTotal?: Num;
  igstTotal?: Num;
  roundOff?: Num;
  grandTotal: Num;
  receivedAmount?: Num;
  balanceDue?: Num;
  amountInWords?: string | null;
  challanNo?: string | null;
  vehicleNo?: string | null;
  siteLocation?: string | null;
  billingAddress?: string | null;
  referenceNumber?: string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  transactionNumber?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  authorizedSignatory?: string | null;
  items: InvoiceItem[];
  customer?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    gstNumber?: string | null;
  } | null;
};

type OrgData = {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  registerNumber?: string | null;
};

function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(val: unknown): number {
  return Number(val ?? 0);
}

function fmt(val: number): string {
  return val.toFixed(2);
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildInvoiceHtml(data: {
  invoice: InvoiceData;
  org: OrgData;
  logoBase64: string | null;
  qrDataUrl: string | null;
  documentTitle?: string;
  showPayment?: boolean;
}): string {
  const { invoice, org, logoBase64, qrDataUrl } = data;
  const docTitle = data.documentTitle ?? "Invoice";
  const showPayment = data.showPayment !== false;

  const subtotal = num(invoice.subtotal);
  const tax = num(invoice.tax);
  const discount = num(invoice.discount);
  const taxableValue = num(invoice.taxableValue ?? subtotal - discount);
  const cgstTotal = num(invoice.cgstTotal);
  const sgstTotal = num(invoice.sgstTotal);
  const igstTotal = num(invoice.igstTotal);
  const roundOff = num(invoice.roundOff);
  const grandTotal = num(invoice.grandTotal);
  const received = num(invoice.receivedAmount);
  const balance = num(invoice.balanceDue);

  const hasGstBreakdown = cgstTotal > 0 || sgstTotal > 0 || igstTotal > 0;
  const isLegacyFlatTax = !hasGstBreakdown && tax > 0;
  const showGstColumn = invoice.items.some((it) => num(it.gstRate) > 0);

  const totalQty = invoice.items.reduce((s, it) => s + num(it.quantity), 0);
  const invoiceDateStr = fmtDate(invoice.invoiceDate || invoice.createdAt);

  // --- Sections ---

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${esc(org.name)}" style="width:56px;height:56px;object-fit:cover;margin-bottom:6px;display:block;" />`
    : "";

  const orgInfoHtml = `
    ${logoHtml}
    <div style="font-size:18px;font-weight:bold;margin-bottom:4px;">${esc(org.name)}</div>
    <div style="font-size:12px;line-height:1.6;">
      ${org.address ? `<div>Office: ${esc(org.address)}</div>` : ""}
      ${org.phone ? `<div>Phone no.: ${esc(org.phone)}</div>` : ""}
      ${org.email ? `<div>${esc(org.email)}</div>` : ""}
      ${org.gstNumber ? `<div>GST No: ${esc(org.gstNumber)}</div>` : ""}
      ${org.registerNumber ? `<div>Reg No: ${esc(org.registerNumber)}</div>` : ""}
    </div>`;

  const billToHtml = `
    <div style="border-top:1px solid #000;margin-top:8px;padding-top:6px;">
      <div style="font-size:12px;margin-bottom:2px;">Bill To</div>
      <div style="font-weight:bold;font-size:13px;">${esc(invoice.customer?.name)}</div>
      ${invoice.customer?.address ? `<div style="font-size:12px;">${esc(invoice.customer.address)}</div>` : ""}
      ${invoice.billingAddress ? `<div style="font-size:12px;">${esc(invoice.billingAddress)}</div>` : ""}
      ${invoice.customer?.phone ? `<div style="font-size:12px;">Phone: ${esc(invoice.customer.phone)}</div>` : ""}
      ${invoice.customer?.gstNumber ? `<div style="font-size:12px;">GST: ${esc(invoice.customer.gstNumber)}</div>` : ""}
    </div>`;

  const metaRow = (label: string, value: string) => `
    <td style="border:1px solid #000;padding:5px 8px;vertical-align:top;font-size:12px;width:50%;">
      <div style="color:#333;font-size:12px;">${esc(label)}</div>
      <div style="font-weight:bold;font-size:13px;margin-top:1px;min-height:16px;">${esc(value)}</div>
    </td>`;

  const metaHtml = `
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        ${metaRow(`${docTitle} No.`, invoice.invoiceNumber)}
        ${metaRow("Date", invoiceDateStr)}
      </tr>
      <tr>
        ${metaRow("Challan No.", invoice.challanNo ?? "")}
        ${metaRow("Vehicle Number", invoice.vehicleNo ?? "")}
      </tr>
      <tr>
        ${metaRow("Site Location", invoice.siteLocation ?? "")}
        ${metaRow("Ref / PO No.", invoice.referenceNumber ?? "")}
      </tr>
    </table>`;

  // Items
  const thStyle = (width: string, align: string) =>
    `style="border:1px solid #000;padding:5px 8px;font-size:13px;width:${width};text-align:${align};"`;
  const tdStyle = (align: string) =>
    `style="border:1px solid #000;padding:5px 8px;font-size:13px;text-align:${align};"`;

  const itemRows = invoice.items
    .map(
      (item, i) => `
    <tr>
      <td ${tdStyle("center")}>${i + 1}</td>
      <td ${tdStyle("left")}>${esc(item.description)}${item.unit ? `<span style="color:#555;margin-left:6px;">(${esc(item.unit)})</span>` : ""}</td>
      <td ${tdStyle("left")}>${item.hsnCode ? esc(item.hsnCode) : "—"}</td>
      <td ${tdStyle("right")}>${num(item.quantity)}</td>
      <td ${tdStyle("right")}>&#8377; ${fmt(num(item.rate))}</td>
      ${showGstColumn ? `<td ${tdStyle("right")}>${num(item.gstRate)}%</td>` : ""}
      <td ${tdStyle("right")}>&#8377; ${fmt(num(item.amount))}</td>
    </tr>`
    )
    .join("");

  const itemsHtml = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th ${thStyle("5%", "center")}>#</th>
          <th ${thStyle(showGstColumn ? "32%" : "42%", "left")}>Item name</th>
          <th ${thStyle("12%", "left")}>HSN/SAC</th>
          <th ${thStyle("14%", "right")}>Quantity</th>
          <th ${thStyle("15%", "right")}>Price/ Unit</th>
          ${showGstColumn ? `<th ${thStyle("10%", "right")}>GST</th>` : ""}
          <th ${thStyle(showGstColumn ? "12%" : "18%", "right")}>Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td ${tdStyle("center")}></td>
          <td ${tdStyle("left")}><strong>Total</strong></td>
          <td ${tdStyle("left")}></td>
          <td ${tdStyle("right")}><strong>${totalQty}</strong></td>
          <td ${tdStyle("right")}></td>
          ${showGstColumn ? `<td ${tdStyle("right")}></td>` : ""}
          <td ${tdStyle("right")}><strong>&#8377; ${fmt(subtotal)}</strong></td>
        </tr>
      </tfoot>
    </table>`;

  // Amounts breakdown
  const amtTd = `style="border:1px solid #000;padding:5px 10px;font-size:13px;"`;
  const amtVal = `style="border:1px solid #000;padding:5px 10px;font-size:13px;text-align:right;"`;

  let amountRows = `
    <tr><td ${amtTd} colspan="2"><strong>Amounts:</strong></td></tr>
    <tr><td ${amtTd}>Sub Total</td><td ${amtVal}>&#8377; ${fmt(subtotal)}</td></tr>`;

  if (discount > 0) {
    amountRows += `<tr><td ${amtTd}>Taxable Value</td><td ${amtVal}>&#8377; ${fmt(taxableValue)}</td></tr>`;
  }
  if (isLegacyFlatTax) {
    amountRows += `<tr><td ${amtTd}>Tax</td><td ${amtVal}>+ &#8377; ${fmt(tax)}</td></tr>`;
  }
  if (cgstTotal > 0) {
    amountRows += `<tr><td ${amtTd}>CGST</td><td ${amtVal}>+ &#8377; ${fmt(cgstTotal)}</td></tr>`;
  }
  if (sgstTotal > 0) {
    amountRows += `<tr><td ${amtTd}>SGST</td><td ${amtVal}>+ &#8377; ${fmt(sgstTotal)}</td></tr>`;
  }
  if (igstTotal > 0) {
    amountRows += `<tr><td ${amtTd}>IGST</td><td ${amtVal}>+ &#8377; ${fmt(igstTotal)}</td></tr>`;
  }
  if (roundOff !== 0) {
    amountRows += `<tr><td ${amtTd}>Round Off</td><td ${amtVal}>${roundOff < 0 ? "− " : "+ "}&#8377; ${fmt(Math.abs(roundOff))}</td></tr>`;
  }
  if (discount > 0) {
    amountRows += `<tr><td ${amtTd}>Discount</td><td ${amtVal}>&minus; &#8377; ${fmt(discount)}</td></tr>`;
  }

  amountRows += `
    <tr><td ${amtTd}><strong>Total</strong></td><td ${amtVal}><strong>&#8377; ${fmt(grandTotal)}</strong></td></tr>`;

  if (showPayment) {
    amountRows += `
    <tr><td ${amtTd}>Received</td><td ${amtVal}>&#8377; ${fmt(received)}</td></tr>
    <tr><td ${amtTd}>Balance</td><td ${amtVal}>&#8377; ${fmt(balance)}</td></tr>`;
  }

  // Payment row
  let paymentRowHtml = "";
  if (showPayment) {
    if (invoice.paymentMethod === "bank" && invoice.bankName) {
      let bankDetail = esc(invoice.bankName);
      if (invoice.bankAccount) bankDetail += ` | A/C: ${esc(invoice.bankAccount)}`;
      if (invoice.bankIfsc) bankDetail += ` | IFSC: ${esc(invoice.bankIfsc)}`;
      paymentRowHtml = `
        <tr>
          <td style="border:1px solid #000;padding:5px 10px;font-size:12px;" colspan="2">
            <strong>Bank Details: </strong>${bankDetail}
          </td>
        </tr>`;
    } else if (invoice.paymentMethod === "upi") {
      let upiDetail = "UPI / Online";
      if (invoice.transactionNumber)
        upiDetail += ` | Txn No.: ${esc(invoice.transactionNumber)}`;
      paymentRowHtml = `
        <tr>
          <td style="border:1px solid #000;padding:5px 10px;font-size:12px;" colspan="2">
            <strong>Payment: </strong>${upiDetail}
          </td>
        </tr>`;
    }
  }

  // QR
  const qrHtml = qrDataUrl
    ? `<div style="margin-bottom:10px;">
        <img src="${qrDataUrl}" alt="Verification QR" style="width:80px;height:80px;margin:0 auto;display:block;" />
        <div style="font-size:9px;color:#666;margin-top:2px;">Scan to verify</div>
      </div>`
    : "";

  const signatoryName = invoice.authorizedSignatory
    ? `${esc(invoice.authorizedSignatory)}<br />`
    : "";

  // Terms
  const termsText = invoice.termsAndConditions || "Thanks for doing business with us!";
  const notesHtml = invoice.notes
    ? `<div style="font-size:12px;margin-top:8px;"><strong>Note: </strong>${esc(invoice.notes)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 10mm; }
  </style>
</head>
<body style="font-family:Arial,sans-serif;font-size:13px;background:#fff;padding:30px 40px;">

  <div style="text-align:center;font-size:18px;font-weight:bold;margin-bottom:16px;">${esc(docTitle)}</div>

  <table style="width:100%;border-collapse:collapse;border:1px solid #000;">
    <tbody>

      <!-- ROW 1: Org + Bill To | Meta -->
      <tr>
        <td style="border:1px solid #000;padding:8px 10px;vertical-align:top;width:45%;">
          ${orgInfoHtml}
          ${billToHtml}
        </td>
        <td style="border:1px solid #000;padding:0;vertical-align:top;">
          ${metaHtml}
        </td>
      </tr>

      <!-- ROW 2: Items table -->
      <tr>
        <td style="border:1px solid #000;padding:0;" colspan="2">
          ${itemsHtml}
        </td>
      </tr>

      <!-- ROW 3: Words | Amounts -->
      <tr>
        <td style="border:1px solid #000;padding:6px 10px;vertical-align:top;width:45%;">
          <div style="font-size:12px;margin-bottom:2px;">${esc(docTitle)} Amount In Words</div>
          <div style="font-weight:bold;font-size:13px;">${esc(invoice.amountInWords)}</div>
        </td>
        <td style="border:1px solid #000;padding:0;vertical-align:top;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${amountRows}</tbody>
          </table>
        </td>
      </tr>

      ${paymentRowHtml}

      <!-- ROW 4: Terms | Signatory -->
      <tr style="height:150px;">
        <td style="border:1px solid #000;padding:10px;vertical-align:bottom;width:45%;">
          <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">Terms and conditions:</div>
          <div style="font-size:12px;white-space:pre-wrap;">${esc(termsText)}</div>
          ${notesHtml}
        </td>
        <td style="border:1px solid #000;padding:10px;padding-bottom:14px;vertical-align:bottom;text-align:center;font-size:13px;">
          ${qrHtml}
          ${signatoryName}
          Authorized Signatory
        </td>
      </tr>

    </tbody>
  </table>

</body>
</html>`;
}
