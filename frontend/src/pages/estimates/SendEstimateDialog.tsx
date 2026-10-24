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
import { useSendEstimateMutation } from "@/features/estimate/estimateApi"
import { getApiErrorMessage } from "@/lib/apiError"
import { formatINR } from "@/lib/money"
import type { Estimate, Organization } from "@/types"

const sendSchema = z.object({
  to: z.string().email("Valid email address is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
})

type SendForm = z.infer<typeof sendSchema>

export function SendEstimateDialog({
  open,
  onOpenChange,
  orgId,
  estimate,
  org,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  orgId: number
  estimate: Estimate
  org: Organization
}) {
  const [sendEstimate, { isLoading }] = useSendEstimateMutation()

  const form = useForm<SendForm>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      to: estimate.customer?.email ?? "",
      subject: `Estimate ${estimate.estimateNumber} from ${org.name}`,
      message: [
        `Dear ${estimate.customer?.name ?? "Customer"},`,
        "",
        `Please find attached estimate ${estimate.estimateNumber} for ${formatINR(estimate.grandTotal)}.`,
        "",
        estimate.validUntil
          ? `This estimate is valid until ${new Date(estimate.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.`
          : "",
        "",
        "We look forward to your response.",
      ].filter(Boolean).join("\n"),
    },
  })

  const onSubmit = async (values: SendForm) => {
    try {
      await sendEstimate({
        orgId,
        estimateId: estimate.id,
        body: values,
      }).unwrap()
      toast.success("Estimate sent successfully")
      form.reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send estimate"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Estimate</DialogTitle>
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
              Send Estimate
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}
