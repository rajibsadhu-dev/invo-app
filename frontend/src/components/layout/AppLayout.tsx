import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { BreadcrumbProvider } from "@/context/BreadcrumbContext"
import EmailVerificationBanner from "@/components/EmailVerificationBanner"

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            <EmailVerificationBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
