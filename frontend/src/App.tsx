import AppRouter from "@/router"
import AuthBootstrap from "@/components/AuthBootstrap"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
      <Toaster position="top-right" richColors />
    </>
  )
}
