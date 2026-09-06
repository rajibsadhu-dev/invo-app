import {
  createContext,
  useContext,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react"

export type Crumb = {
  label: string
  to?: string
}

export type BreadcrumbContextValue = {
  crumbs: Crumb[]
  setCrumbs: Dispatch<SetStateAction<Crumb[]>>
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  crumbs: [],
  setCrumbs: () => {},
})

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
