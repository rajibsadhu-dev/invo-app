import {
  createContext,
  useContext,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react"

export type Crumb = {
  label: string
  to?: string
}

type BreadcrumbContextValue = {
  crumbs: Crumb[]
  setCrumbs: Dispatch<SetStateAction<Crumb[]>>
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  crumbs: [],
  setCrumbs: () => {},
})

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

/** Call this in a page to set its breadcrumbs. Cleared on unmount. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  // Stringify to avoid re-running on every render
  const key = JSON.stringify(crumbs)
  useEffect(() => {
    setCrumbs(crumbs)
    return () => setCrumbs([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

export function useBreadcrumbItems() {
  return useContext(BreadcrumbContext).crumbs
}
