import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { InvoForm, InvoInput, InvoTextarea } from "@/components/form"
import { useSendInvoiceMutation } from "@/features/invoice/invoiceApi"
import { getApiErrorMessage } from "@/lib/apiError"
import { formatINR } from "@/lib/money"
import type { Invoice, Organization } from "@/types"

const sendSchema = z.object({
  to: z.string().email("Valid email address is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
})

type SendForm = z.infer<typeof sendSchema>

export function SendInvoiceDialog({
  open,
  onOpenChange,
  orgId,
  invoice,
  org,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  orgId: number
  invoice: Invoice
  org: Organization
}) {
  const [sendInvoice, { isLoading }] = useSendInvoiceMutation()

  const form = useForm<SendForm>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      to: invoice.customer?.email ?? "",
      subject: `Invoice ${invoice.invoiceNumber} from ${org.name}`,
      message: [
        `Dear ${invoice.customer?.name ?? "Customer"},`,
        "",
        `Please find attached invoice ${invoice.invoiceNumber} for ${formatINR(invoice.grandTotal)}.`,
        "",
        "Thank you for your business.",
      ].join("\n"),
    },
  })

  const onSubmit = async (values: SendForm) => {
    try {
      await sendInvoice({
        orgId,
        invoiceId: invoice.id,
        body: values,
      }).unwrap()
      toast.success("Invoice sent successfully")
      form.reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invoice"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="to"
            label="To (email)"
            placeholder="customer@example.com"
            required
          />
          <InvoInput
            control={form.control}
            name="subject"
            label="Subject"
            required
          />
          <InvoTextarea
            control={form.control}
            name="message"
            label="Message"
            rows={6}
            required
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              <Send className="h-3.5 w-3.5" />
              Send Invoice
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}
