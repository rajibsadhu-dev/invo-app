import React, { forwardRef } from "react"
import type { Invoice, Organization } from "@/types"

interface PrintableInvoiceProps {
  invoice: Invoice
  org: Organization
  logoUrl: string | null
}

/* ─── Exact CSS from the HTML template ───────────────────────────────────────
   Every style below is a 1-to-1 copy of the class defined in the HTML <style>.
   Do not change values unless the HTML template changes.
─────────────────────────────────────────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  /* body */
  wrap: {
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    background: "#fff",
    padding: "30px 40px",
    boxSizing: "border-box",
  },

  /* .invoice-title */
  invoiceTitle: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "16px",
  },

  /* .main-table */
  mainTable: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #000",
  },

  /* .main-table td */
  mainTd: {
    border: "1px solid #000",
  },

  /* .supplier-cell — now also contains Bill To */
  supplierCell: {
    border: "1px solid #000",
    padding: "8px 10px",
    verticalAlign: "top",
    width: "45%",
  },

  /* .supplier-name */
  supplierName: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "4px",
  },

  /* .supplier-info */
  supplierInfo: {
    fontSize: "12px",
    lineHeight: "1.6",
  },

  /* divider between org and bill-to inside the left cell */
  leftDivider: {
    borderTop: "1px solid #000",
    marginTop: "8px",
    paddingTop: "6px",
  },

  /* .bill-to-label */
  billToLabel: {
    fontSize: "12px",
    marginBottom: "2px",
  },

  /* .bill-to-name */
  billToName: {
    fontWeight: "bold",
    fontSize: "13px",
  },

  /* .bill-to-addr */
  billToAddr: {
    fontSize: "12px",
  },

  /* .meta-inner */
  metaInner: {
    width: "100%",
    borderCollapse: "collapse",
  },

  /* .meta-inner td */
  metaTd: {
    border: "1px solid #000",
    padding: "5px 8px",
    verticalAlign: "top",
    fontSize: "12px",
    width: "50%",
  },

  /* .meta-label */
  metaLabel: {
    color: "#333",
    fontSize: "12px",
  },

  /* .meta-value */
  metaValue: {
    fontWeight: "bold",
    fontSize: "13px",
    marginTop: "1px",
    minHeight: "16px",
  },

  /* .items-inner */
  itemsInner: {
    width: "100%",
    borderCollapse: "collapse",
  },

  /* .items-inner th / td */
  itemsCell: {
    border: "1px solid #000",
    padding: "5px 8px",
    fontSize: "13px",
  },

  /* .words-cell */
  wordsCell: {
    border: "1px solid #000",
    padding: "6px 10px",
    verticalAlign: "top",
    width: "45%",
  },

  /* .words-label */
  wordsLabel: {
    fontSize: "12px",
    marginBottom: "2px",
  },

  /* .words-value */
  wordsValue: {
    fontWeight: "bold",
    fontSize: "13px",
  },

  /* .amounts-inner */
  amountsInner: {
    width: "100%",
    borderCollapse: "collapse",
  },

  /* .amounts-inner td */
  amountsTd: {
    border: "1px solid #000",
    padding: "5px 10px",
    fontSize: "13px",
  },

  /* .amt-value */
  amtValue: {
    border: "1px solid #000",
    padding: "5px 10px",
    fontSize: "13px",
    textAlign: "right",
  },

  /* .terms-cell — verticalAlign bottom so text sits at the bottom */
  termsCell: {
    border: "1px solid #000",
    padding: "10px",
    verticalAlign: "bottom",
    width: "45%",
  },

  /* .terms-label */
  termsLabel: {
    fontWeight: "bold",
    fontSize: "13px",
    marginBottom: "4px",
  },

  /* .terms-text */
  termsText: {
    fontSize: "12px",
  },

  /* .signatory-cell */
  signatoryCell: {
    border: "1px solid #000",
    padding: "10px",
    paddingBottom: "14px",
    verticalAlign: "bottom",
    textAlign: "center",
    fontSize: "13px",
  },
}

/* ─── Component ──────────────────────────────────────────────────────────────── */

/** Only widen the items table with a GST column when the invoice actually carries GST. */
function items0HasGst(invoice: PrintableInvoiceProps["invoice"]): boolean {
  return (invoice.items ?? []).some((item) => Number(item.gstRate ?? 0) > 0)
}

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, org, logoUrl }, ref) => {
    const subtotal = Number(invoice.subtotal)
    const tax = Number(invoice.tax)
    const discount = Number(invoice.discount)
    const taxableValue = Number(invoice.taxableValue ?? subtotal - discount)
    const cgstTotal = Number(invoice.cgstTotal ?? 0)
    const sgstTotal = Number(invoice.sgstTotal ?? 0)
    const igstTotal = Number(invoice.igstTotal ?? 0)
    const roundOff = Number(invoice.roundOff ?? 0)
    const grandTotal = Number(invoice.grandTotal)
    const received = Number(invoice.receivedAmount)
    const balance = Number(invoice.balanceDue)

    // Pre-GST invoices carry a flat tax with no component split.
    const hasGstBreakdown = cgstTotal > 0 || sgstTotal > 0 || igstTotal > 0
    const isLegacyFlatTax = !hasGstBreakdown && tax > 0
    const showGstColumn = items0HasGst(invoice)

    const items = invoice.items ?? []
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity), 0)

    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    const invoiceDateStr = fmtDate(invoice.invoiceDate || invoice.createdAt)

    return (
      <div ref={ref} style={s.wrap}>

        {/* ── Invoice Title ── */}
        <div style={s.invoiceTitle}>Invoice</div>

        {/* ── Main table ── */}
        <table style={s.mainTable}>
          <tbody>

            {/* ROW 1: Left = Org + Bill To | Right = Meta */}
            <tr>

              {/* LEFT: Org details on top, Bill To below */}
              <td style={s.supplierCell}>
                {/* Org info */}
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={org.name}
                    style={{ width: "56px", height: "56px", objectFit: "cover", marginBottom: "6px", display: "block" }}
                  />
                )}
                <div style={s.supplierName}>{org.name}</div>
                <div style={s.supplierInfo}>
                  {org.address && <div>Office: {org.address}</div>}
                  {org.phone && <div>Phone no.: {org.phone}</div>}
                  {org.email && <div>{org.email}</div>}
                  {org.gstNumber && <div>GST No: {org.gstNumber}</div>}
                  {org.registerNumber && <div>Reg No: {org.registerNumber}</div>}
                </div>

                {/* Bill To — below org details, separated by a line */}
                <div style={s.leftDivider}>
                  <div style={s.billToLabel}>Bill To</div>
                  <div style={s.billToName}>{invoice.customer?.name}</div>
                  {invoice.customer?.address && (
                    <div style={s.billToAddr}>{invoice.customer.address}</div>
                  )}
                  {invoice.billingAddress && (
                    <div style={s.billToAddr}>{invoice.billingAddress}</div>
                  )}
                  {invoice.customer?.phone && (
                    <div style={s.billToAddr}>Phone: {invoice.customer.phone}</div>
                  )}
                  {invoice.customer?.gstNumber && (
                    <div style={s.billToAddr}>GST: {invoice.customer.gstNumber}</div>
                  )}
                </div>
              </td>

              {/* RIGHT: Meta inner table — all fields always shown */}
              <td style={{ ...s.mainTd, padding: 0, verticalAlign: "top" }}>
                <table style={s.metaInner}>
                  <tbody>
                    {/* Invoice No. + Date */}
                    <tr>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Invoice No.</div>
                        <div style={s.metaValue}>{invoice.invoiceNumber}</div>
                      </td>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Date</div>
                        <div style={s.metaValue}>{invoiceDateStr}</div>
                      </td>
                    </tr>

                    {/* Challan No. + Vehicle Number — always shown */}
                    <tr>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Challan No.</div>
                        <div style={s.metaValue}>{invoice.challanNo ?? ""}</div>
                      </td>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Vehicle Number</div>
                        <div style={s.metaValue}>{invoice.vehicleNo ?? ""}</div>
                      </td>
                    </tr>

                    {/* Site Location — always shown */}
                    <tr>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Site Location</div>
                        <div style={s.metaValue}>{invoice.siteLocation ?? ""}</div>
                      </td>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Ref / PO No.</div>
                        <div style={s.metaValue}>{invoice.referenceNumber ?? ""}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ROW 2: Items table (full width) */}
            <tr>
              <td style={{ ...s.mainTd, padding: 0 }} colSpan={2}>
                <table style={s.itemsInner}>
                  <thead>
                    <tr>
                      <th style={{ ...s.itemsCell, width: "5%", textAlign: "center" }}>#</th>
                      <th style={{ ...s.itemsCell, width: showGstColumn ? "32%" : "42%", textAlign: "left" }}>Item name</th>
                      <th style={{ ...s.itemsCell, width: "12%", textAlign: "left" }}>HSN/SAC</th>
                      <th style={{ ...s.itemsCell, width: "14%", textAlign: "right" }}>Quantity</th>
                      <th style={{ ...s.itemsCell, width: "15%", textAlign: "right" }}>Price/ Unit</th>
                      {showGstColumn && (
                        <th style={{ ...s.itemsCell, width: "10%", textAlign: "right" }}>GST</th>
                      )}
                      <th style={{ ...s.itemsCell, width: showGstColumn ? "12%" : "18%", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ ...s.itemsCell, textAlign: "center" }}>{i + 1}</td>
                        <td style={{ ...s.itemsCell, textAlign: "left" }}>
                          {item.description}
                          {item.unit && (
                            <span style={{ color: "#555", marginLeft: "6px" }}>({item.unit})</span>
                          )}
                        </td>
                        <td style={{ ...s.itemsCell, textAlign: "left" }}>{item.hsnCode || "—"}</td>
                        <td style={{ ...s.itemsCell, textAlign: "right" }}>{Number(item.quantity)}</td>
                        <td style={{ ...s.itemsCell, textAlign: "right" }}>&#8377; {Number(item.rate).toFixed(2)}</td>
                        {showGstColumn && (
                          <td style={{ ...s.itemsCell, textAlign: "right" }}>{Number(item.gstRate ?? 0)}%</td>
                        )}
                        <td style={{ ...s.itemsCell, textAlign: "right" }}>&#8377; {Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...s.itemsCell, textAlign: "center" }} />
                      <td style={{ ...s.itemsCell, textAlign: "left" }}><strong>Total</strong></td>
                      <td style={{ ...s.itemsCell, textAlign: "left" }} />
                      <td style={{ ...s.itemsCell, textAlign: "right" }}><strong>{totalQty}</strong></td>
                      <td style={{ ...s.itemsCell, textAlign: "right" }} />
                      {showGstColumn && <td style={{ ...s.itemsCell, textAlign: "right" }} />}
                      <td style={{ ...s.itemsCell, textAlign: "right" }}><strong>&#8377; {subtotal.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>

            {/* ROW 3: Words | Amounts breakdown */}
            <tr>
              <td style={s.wordsCell}>
                <div style={s.wordsLabel}>Invoice Amount In Words</div>
                <div style={s.wordsValue}>{invoice.amountInWords ?? ""}</div>
              </td>

              <td style={{ ...s.mainTd, padding: 0, verticalAlign: "top" }}>
                <table style={s.amountsInner}>
                  <tbody>
                    <tr>
                      <td style={s.amountsTd} colSpan={2}><strong>Amounts:</strong></td>
                    </tr>
                    <tr>
                      <td style={s.amountsTd}>Sub Total</td>
                      <td style={s.amtValue}>&#8377; {subtotal.toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td style={s.amountsTd}>Taxable Value</td>
                        <td style={s.amtValue}>&#8377; {taxableValue.toFixed(2)}</td>
                      </tr>
                    )}
                    {isLegacyFlatTax && (
                      <tr>
                        <td style={s.amountsTd}>Tax</td>
                        <td style={s.amtValue}>+ &#8377; {tax.toFixed(2)}</td>
                      </tr>
                    )}
                    {cgstTotal > 0 && (
                      <tr>
                        <td style={s.amountsTd}>CGST</td>
                        <td style={s.amtValue}>+ &#8377; {cgstTotal.toFixed(2)}</td>
                      </tr>
                    )}
                    {sgstTotal > 0 && (
                      <tr>
                        <td style={s.amountsTd}>SGST</td>
                        <td style={s.amtValue}>+ &#8377; {sgstTotal.toFixed(2)}</td>
                      </tr>
                    )}
                    {igstTotal > 0 && (
                      <tr>
                        <td style={s.amountsTd}>IGST</td>
                        <td style={s.amtValue}>+ &#8377; {igstTotal.toFixed(2)}</td>
                      </tr>
                    )}
                    {roundOff !== 0 && (
                      <tr>
                        <td style={s.amountsTd}>Round Off</td>
                        <td style={s.amtValue}>
                          {roundOff < 0 ? "\u2212 " : "+ "}&#8377; {Math.abs(roundOff).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {discount > 0 && (
                      <tr>
                        <td style={s.amountsTd}>Discount</td>
                        <td style={s.amtValue}>&minus; &#8377; {discount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={s.amountsTd}><strong>Total</strong></td>
                      <td style={s.amtValue}><strong>&#8377; {grandTotal.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                      <td style={s.amountsTd}>Received</td>
                      <td style={s.amtValue}>&#8377; {received.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={s.amountsTd}>Balance</td>
                      <td style={s.amtValue}>&#8377; {balance.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Payment row — bank */}
            {invoice.paymentMethod === "bank" && invoice.bankName && (
              <tr>
                <td style={{ ...s.mainTd, padding: "5px 10px", fontSize: "12px" }} colSpan={2}>
                  <strong>Bank Details: </strong>
                  {invoice.bankName}
                  {invoice.bankAccount && ` | A/C: ${invoice.bankAccount}`}
                  {invoice.bankIfsc && ` | IFSC: ${invoice.bankIfsc}`}
                </td>
              </tr>
            )}

            {/* Payment row — upi */}
            {invoice.paymentMethod === "upi" && (
              <tr>
                <td style={{ ...s.mainTd, padding: "5px 10px", fontSize: "12px" }} colSpan={2}>
                  <strong>Payment: </strong>UPI / Online
                  {invoice.transactionNumber && ` | Txn No.: ${invoice.transactionNumber}`}
                </td>
              </tr>
            )}

            {/* ROW 4: Terms | Authorized Signatory */}
            <tr style={{ height: "150px" }}>
              <td style={s.termsCell}>
                <div style={s.termsLabel}>Terms and conditions:</div>
                <div style={{ ...s.termsText, whiteSpace: "pre-wrap" }}>
                  {invoice.termsAndConditions || "Thanks for doing business with us!"}
                </div>
                {invoice.notes && (
                  <div style={{ ...s.termsText, marginTop: "8px" }}>
                    <strong>Note: </strong>{invoice.notes}
                  </div>
                )}
              </td>
              <td style={s.signatoryCell}>
                {invoice.authorizedSignatory
                  ? <>{invoice.authorizedSignatory}<br /></>
                  : null
                }
                Authorized Signatory
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    )
  }
)

PrintableInvoice.displayName = "PrintableInvoice"
export default PrintableInvoice
