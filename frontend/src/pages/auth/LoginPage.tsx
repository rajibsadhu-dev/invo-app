import { useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvoForm, InvoInput } from "@/components/form"
import { useLoginMutation } from "@/features/auth/authApi"
import { setCredentials } from "@/features/auth/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getApiErrorMessage } from "@/lib/apiError"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [login, { isLoading, error }] = useLoginMutation()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const onSubmit = async (values: LoginForm) => {
    try {
      const res = await login(values).unwrap()
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }))
      navigate("/", { replace: true })
    } catch {
      // shown via apiError below
    }
  }

  const apiError = error ? getApiErrorMessage(error, "Login failed") : null

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
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
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
              <InvoInput
                control={form.control}
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              {apiError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {apiError}
                </p>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </InvoForm>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
