import AppRouter from "@/router"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  )
}
