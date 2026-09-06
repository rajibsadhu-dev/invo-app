import { useSearchParams, useNavigate, Link } from "react-router-dom"
import { FileText, Loader2, CheckCircle2, XCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetInviteInfoQuery, useAcceptInviteMutation } from "@/features/org/inviteApi"
import { useAppSelector } from "@/store/hooks"
import { getApiErrorMessage } from "@/lib/apiError"

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const user = useAppSelector((s) => s.auth.user)
  const { data, isLoading, error } = useGetInviteInfoQuery(token ?? "", {
    skip: !token,
  })
  const [acceptInvite, { isLoading: isAccepting, isSuccess, error: acceptError }] =
    useAcceptInviteMutation()

  const info = data?.data
  const apiError = error ? getApiErrorMessage(error, "Invalid invitation") : null
  const acceptApiError = acceptError
    ? getApiErrorMessage(acceptError, "Failed to accept")
    : null

  const handleAccept = async () => {
    if (!token) return
    try {
      const result = await acceptInvite(token).unwrap()
      toast.success(`Joined ${result.data.name}!`)
      navigate(`/org/${result.data.id}`, { replace: true })
    } catch {
      // shown below
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-sm text-muted-foreground">
              Invalid invitation link.
            </p>
            <Button asChild className="w-full">
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
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
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <Users className="h-12 w-12 text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                Please sign in or create an account to accept this invitation.
              </p>
              <div className="flex w-full gap-2">
                <Button asChild className="flex-1">
                  <Link to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/register?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                    Sign up
                  </Link>
                </Button>
              </div>
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
            <CardTitle className="text-center">Team Invitation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isLoading && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading invitation...</p>
              </>
            )}

            {apiError && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-sm text-destructive">{apiError}</p>
                <Button asChild className="w-full">
                  <Link to="/">Go to Dashboard</Link>
                </Button>
              </>
            )}

            {info && !isSuccess && (
              <>
                <Users className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <p className="text-sm">
                    <strong>{info.invitedBy}</strong> has invited you to join
                  </p>
                  <p className="mt-1 text-lg font-semibold">{info.orgName}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    as {info.role}
                  </Badge>
                </div>
                {acceptApiError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {acceptApiError}
                  </p>
                )}
                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full"
                >
                  {isAccepting ? "Accepting..." : "Accept Invitation"}
                </Button>
              </>
            )}

            {isSuccess && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-center text-sm text-muted-foreground">
                  You've joined the team!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
