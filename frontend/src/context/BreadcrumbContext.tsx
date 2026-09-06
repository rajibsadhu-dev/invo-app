import { useState, type ReactNode } from "react"
import { BreadcrumbContext, type Crumb } from "./breadcrumbStore"

// The context, hooks and types live in ./breadcrumbStore so this file exports only a
// component — a file that mixes the two breaks React Fast Refresh.
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}
