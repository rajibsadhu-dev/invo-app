import { useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InvoForm, InvoInput } from "@/components/form"
import { useRegisterMutation } from "@/features/auth/authApi"
import { setCredentials } from "@/features/auth/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getApiErrorMessage } from "@/lib/apiError"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [register, { isLoading, error }] = useRegisterMutation()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", orgName: "" },
  })

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const onSubmit = async (values: RegisterForm) => {
    try {
      const res = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        orgName: values.orgName,
      }).unwrap()
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }))
      navigate("/", { replace: true })
    } catch {
      // shown via apiError below
    }
  }

  const apiError = error ? getApiErrorMessage(error, "Registration failed") : null

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
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Sign up to start managing your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoForm form={form} onSubmit={onSubmit}>
              <InvoInput
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
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
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
              />
              <InvoInput
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
              <InvoInput
                control={form.control}
                name="orgName"
                label="Organization Name"
                placeholder="Your business name"
                required
              />
              {apiError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {apiError}
                </p>
              )}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </InvoForm>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
