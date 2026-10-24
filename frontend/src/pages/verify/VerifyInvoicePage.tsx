import { useParams, Link } from "react-router-dom"
import { Loader2, ShieldCheck, ShieldX, FileText } from "lucide-react"
import { useVerifyInvoiceQuery } from "@/features/invoice/invoiceApi"
import PrintableInvoice from "@/pages/invoices/PrintableInvoice"

export default function VerifyInvoicePage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = useVerifyInvoiceQuery(token!, { skip: !token })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying invoice…</p>
        </div>
      </div>
    )
  }

  if (isError || !data?.success || !data.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
          <ShieldX className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Invoice Not Verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invoice could not be verified. The QR code may be invalid, tampered with, or the
            invoice may have been withdrawn.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <FileText className="h-4 w-4" /> Go to Invo
          </Link>
        </div>
      </div>
    )
  }

  const invoice = data.data
  const org = invoice.organization
  const logoUrl = org.logo ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}` : null

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Invoice Verified</p>
            <p className="text-sm opacity-80">
              This is an authentic invoice ({invoice.invoiceNumber}) issued by {org.name}.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <PrintableInvoice invoice={invoice} org={org} logoUrl={logoUrl} />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by <Link to="/login" className="underline">Invo</Link>
        </p>
      </div>
    </div>
  )
}
