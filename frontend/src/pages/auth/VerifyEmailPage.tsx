import { useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useVerifyEmailMutation } from "@/features/auth/authApi"
import { getApiErrorMessage } from "@/lib/apiError"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [verify, { isLoading, isSuccess, error }] = useVerifyEmailMutation()
  const attempted = useRef(false)

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true
      verify(token)
    }
  }, [token, verify])

  const apiError = error ? getApiErrorMessage(error, "Verification failed") : null

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
            <CardTitle className="text-center">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {!token && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-sm text-muted-foreground">
                  No verification token provided. Please check your email for the
                  verification link.
                </p>
              </>
            )}

            {token && isLoading && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-sm text-muted-foreground">
                  Verifying your email...
                </p>
              </>
            )}

            {token && isSuccess && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-center text-sm text-muted-foreground">
                  Your email has been verified successfully!
                </p>
              </>
            )}

            {token && apiError && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-sm text-destructive">{apiError}</p>
              </>
            )}

            <Button asChild className="w-full">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
