import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvoForm, InvoInput } from "@/components/form"
import { useForgotPasswordMutation } from "@/features/auth/authApi"
import { getApiErrorMessage } from "@/lib/apiError"

const schema = z.object({
  email: z.string().email("Invalid email address"),
})

type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation()
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotForm) => {
    try {
      await forgotPassword(values).unwrap()
      setSent(true)
    } catch {
      // shown below
    }
  }

  const apiError = error ? getApiErrorMessage(error, "Something went wrong") : null

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
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for a reset link."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col gap-4">
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300">
                  If that email is registered, a password reset link has been sent.
                  Please check your inbox.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <InvoForm form={form} onSubmit={onSubmit}>
                  <InvoInput
                    control={form.control}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                  {apiError && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {apiError}
                    </p>
                  )}
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </InvoForm>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
