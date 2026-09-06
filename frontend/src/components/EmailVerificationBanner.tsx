import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/store/hooks"
import { useResendVerificationMutation } from "@/features/auth/authApi"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/apiError"

export default function EmailVerificationBanner() {
  const user = useAppSelector((s) => s.auth.user)
  const [resend, { isLoading }] = useResendVerificationMutation()

  if (!user || user.emailVerifiedAt) return null

  const handleResend = async () => {
    try {
      await resend().unwrap()
      toast.success("Verification email sent! Check your inbox.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send verification email"))
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
      <Mail className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Please verify your email address. Check your inbox for a verification link.
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={isLoading}
        className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
      >
        {isLoading ? "Sending..." : "Resend"}
      </Button>
    </div>
  )
}
