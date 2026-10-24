import React, { forwardRef } from "react"
import type { PurchaseOrder, Organization } from "@/types"

interface PrintablePOProps {
  po: PurchaseOrder
  org: Organization
  logoUrl: string | null
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    background: "#fff",
    padding: "30px 40px",
    boxSizing: "border-box",
  },
  title: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  mainTable: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #000",
  },
  mainTd: {
    border: "1px solid #000",
  },
  orgCell: {
    border: "1px solid #000",
    padding: "8px 10px",
    verticalAlign: "top",
    width: "45%",
  },
  orgName: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  orgInfo: {
    fontSize: "12px",
    lineHeight: "1.6",
  },
  leftDivider: {
    borderTop: "1px solid #000",
    marginTop: "8px",
    paddingTop: "6px",
  },
  supplierLabel: {
    fontSize: "12px",
    marginBottom: "2px",
  },
  supplierName: {
    fontWeight: "bold",
    fontSize: "13px",
  },
  supplierAddr: {
    fontSize: "12px",
  },
  metaInner: {
    width: "100%",
    borderCollapse: "collapse",
  },
  metaTd: {
    border: "1px solid #000",
    padding: "5px 8px",
    verticalAlign: "top",
    fontSize: "12px",
    width: "50%",
  },
  metaLabel: {
    color: "#333",
    fontSize: "12px",
  },
  metaValue: {
    fontWeight: "bold",
    fontSize: "13px",
    marginTop: "1px",
    minHeight: "16px",
  },
  itemsInner: {
    width: "100%",
    borderCollapse: "collapse",
  },
  itemsCell: {
    border: "1px solid #000",
    padding: "5px 8px",
    fontSize: "13px",
  },
  amountsInner: {
    width: "100%",
    borderCollapse: "collapse",
  },
  amountsTd: {
    border: "1px solid #000",
    padding: "5px 10px",
    fontSize: "13px",
  },
  amtValue: {
    border: "1px solid #000",
    padding: "5px 10px",
    fontSize: "13px",
    textAlign: "right",
  },
  notesCell: {
    border: "1px solid #000",
    padding: "10px",
    verticalAlign: "bottom",
    width: "45%",
  },
  signatoryCell: {
    border: "1px solid #000",
    padding: "10px",
    paddingBottom: "14px",
    verticalAlign: "bottom",
    textAlign: "center",
    fontSize: "13px",
  },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

const fmtINR = (v: number) =>
  v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PrintablePO = forwardRef<HTMLDivElement, PrintablePOProps>(
  ({ po, org, logoUrl }, ref) => {
    const items = po.items ?? []
    const subtotal = Number(po.subtotal)
    const taxTotal = Number(po.taxTotal)
    const grandTotal = Number(po.grandTotal)
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity), 0)
    const showGstColumn = items.some((item) => Number(item.gstRate ?? 0) > 0)

    return (
      <div ref={ref} style={s.wrap}>
        <div style={s.title}>Purchase Order</div>

        <table style={s.mainTable}>
          <tbody>
            {/* ROW 1: Org + Supplier | Meta */}
            <tr>
              <td style={s.orgCell}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={org.name}
                    style={{ width: "56px", height: "56px", objectFit: "cover", marginBottom: "6px", display: "block" }}
                  />
                )}
                <div style={s.orgName}>{org.name}</div>
                <div style={s.orgInfo}>
                  {org.address && <div>Office: {org.address}</div>}
                  {org.phone && <div>Phone: {org.phone}</div>}
                  {org.email && <div>{org.email}</div>}
                  {org.gstNumber && <div>GST No: {org.gstNumber}</div>}
                </div>

                <div style={s.leftDivider}>
                  <div style={s.supplierLabel}>Supplier</div>
                  <div style={s.supplierName}>{po.supplier?.name ?? "—"}</div>
                </div>
              </td>

              <td style={{ ...s.mainTd, padding: 0, verticalAlign: "top" }}>
                <table style={s.metaInner}>
                  <tbody>
                    <tr>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>PO Number</div>
                        <div style={s.metaValue}>{po.poNumber}</div>
                      </td>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Date</div>
                        <div style={s.metaValue}>{fmtDate(po.poDate)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Status</div>
                        <div style={s.metaValue}>{po.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                      </td>
                      <td style={s.metaTd}>
                        <div style={s.metaLabel}>Expected Delivery</div>
                        <div style={s.metaValue}>{po.expectedDate ? fmtDate(po.expectedDate) : "—"}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ROW 2: Items */}
            <tr>
              <td style={{ ...s.mainTd, padding: 0 }} colSpan={2}>
                <table style={s.itemsInner}>
                  <thead>
                    <tr>
                      <th style={{ ...s.itemsCell, width: "5%", textAlign: "center" }}>#</th>
                      <th style={{ ...s.itemsCell, width: showGstColumn ? "32%" : "42%", textAlign: "left" }}>Item</th>
                      <th style={{ ...s.itemsCell, width: "12%", textAlign: "left" }}>HSN/SAC</th>
                      <th style={{ ...s.itemsCell, width: "14%", textAlign: "right" }}>Quantity</th>
                      <th style={{ ...s.itemsCell, width: "15%", textAlign: "right" }}>Rate</th>
                      {showGstColumn && (
                        <th style={{ ...s.itemsCell, width: "10%", textAlign: "right" }}>GST</th>
                      )}
                      <th style={{ ...s.itemsCell, width: showGstColumn ? "12%" : "18%", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const lineAmount = Number(item.amount) + Number(item.gstAmount)
                      return (
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
                          <td style={{ ...s.itemsCell, textAlign: "right" }}>&#8377; {fmtINR(Number(item.rate))}</td>
                          {showGstColumn && (
                            <td style={{ ...s.itemsCell, textAlign: "right" }}>{Number(item.gstRate)}%</td>
                          )}
                          <td style={{ ...s.itemsCell, textAlign: "right" }}>&#8377; {fmtINR(lineAmount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...s.itemsCell, textAlign: "center" }} />
                      <td style={{ ...s.itemsCell, textAlign: "left" }}><strong>Total</strong></td>
                      <td style={{ ...s.itemsCell, textAlign: "left" }} />
                      <td style={{ ...s.itemsCell, textAlign: "right" }}><strong>{totalQty}</strong></td>
                      <td style={{ ...s.itemsCell, textAlign: "right" }} />
                      {showGstColumn && <td style={{ ...s.itemsCell, textAlign: "right" }} />}
                      <td style={{ ...s.itemsCell, textAlign: "right" }}><strong>&#8377; {fmtINR(subtotal)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>

            {/* ROW 3: Amounts */}
            <tr>
              <td style={s.notesCell}>
                {po.notes && (
                  <>
                    <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>Notes</div>
                    <div style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>{po.notes}</div>
                  </>
                )}
              </td>
              <td style={{ ...s.mainTd, padding: 0, verticalAlign: "top" }}>
                <table style={s.amountsInner}>
                  <tbody>
                    <tr>
                      <td style={s.amountsTd}>Sub Total</td>
                      <td style={s.amtValue}>&#8377; {fmtINR(subtotal)}</td>
                    </tr>
                    {taxTotal > 0 && (
                      <tr>
                        <td style={s.amountsTd}>GST</td>
                        <td style={s.amtValue}>+ &#8377; {fmtINR(taxTotal)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={s.amountsTd}><strong>Grand Total</strong></td>
                      <td style={s.amtValue}><strong>&#8377; {fmtINR(grandTotal)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ROW 4: Signature */}
            <tr style={{ height: "120px" }}>
              <td style={s.notesCell} />
              <td style={s.signatoryCell}>
                Authorized Signatory
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
)

PrintablePO.displayName = "PrintablePO"
export default PrintablePO
