import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvoForm, InvoInput } from "@/components/form"
import { useResetPasswordMutation } from "@/features/auth/authApi"
import { getApiErrorMessage } from "@/lib/apiError"

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetForm = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation()
  const [success, setSuccess] = useState(false)

  const form = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ResetForm) => {
    if (!token) return
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap()
      setSuccess(true)
    } catch {
      // shown below
    }
  }

  const apiError = error ? getApiErrorMessage(error, "Reset failed") : null

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-sm text-muted-foreground">
                Invalid reset link. Please request a new one.
              </p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-semibold">Invo</span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-center">
              {success ? "Password Reset" : "Set New Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-center text-sm text-muted-foreground">
                  Your password has been reset. Please sign in with your new password.
                </p>
                <Button asChild className="w-full">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            ) : (
              <InvoForm form={form} onSubmit={onSubmit}>
                <InvoInput
                  control={form.control}
                  name="newPassword"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                <InvoInput
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                {apiError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {apiError}
                  </p>
                )}
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Resetting..." : "Reset password"}
                </Button>
              </InvoForm>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
