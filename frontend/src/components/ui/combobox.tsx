import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Search, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ComboboxOption = { value: string; label: string }

type ComboboxBaseProps = {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /** Async search callback. When provided, options are not filtered client-side. */
  onSearch?: (query: string) => void
  loading?: boolean
  debounce?: number
}

type SingleProps = ComboboxBaseProps & {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

type MultiProps = ComboboxBaseProps & {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

type ComboboxProps = SingleProps | MultiProps

/**
 * Standalone combobox for use outside react-hook-form.
 * Supports single select, multi-select, client-side filtering, and async search.
 *
 * Single:
 *   <Combobox value={customerId} onChange={setCustomerId} options={customers} placeholder="All customers" />
 *
 * Multi:
 *   <Combobox multiple value={tags} onChange={setTags} options={tagOptions} />
 *
 * Async:
 *   <Combobox value={val} onChange={setVal} options={results} onSearch={setQuery} loading={searching} />
 */
export function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "No results found",
    disabled = false,
    className,
    onSearch,
    loading = false,
    debounce: debounceMs = 300,
    multiple = false,
  } = props

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const isAsync = !!onSearch

  const filtered = isAsync
    ? options
    : options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      if (onSearch) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => onSearch(value), debounceMs)
      }
    },
    [onSearch, debounceMs]
  )

  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch("")
      if (onSearch) onSearch("")
    }
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        changeOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Value helpers
  const selectedValues: string[] = multiple
    ? (props as MultiProps).value
    : []
  const singleValue: string = multiple ? "" : (props as SingleProps).value

  const isSelected = (val: string) =>
    multiple ? selectedValues.includes(val) : singleValue === val

  const handleSelect = (val: string) => {
    if (multiple) {
      const mv = props as MultiProps
      const next = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val]
      mv.onChange(next)
    } else {
      const sv = props as SingleProps
      sv.onChange(val === singleValue ? "" : val)
      changeOpen(false)
    }
  }

  const handleRemoveTag = (val: string) => {
    if (multiple) {
      const mv = props as MultiProps
      mv.onChange(selectedValues.filter((v) => v !== val))
    }
  }

  // Display
  const selectedLabel = !multiple
    ? options.find((o) => o.value === singleValue)?.label
    : null

  const selectedTags = multiple
    ? options.filter((o) => selectedValues.includes(o.value))
    : []

  const hasValue = multiple ? selectedValues.length > 0 : !!singleValue

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && changeOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors outline-none select-none",
          "hover:bg-accent/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !hasValue && "text-muted-foreground",
          open && "border-ring ring-[3px] ring-ring/50"
        )}
      >
        <span className="flex flex-1 flex-wrap gap-1 truncate text-left">
          {multiple ? (
            selectedTags.length > 0 ? (
              selectedTags.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {opt.label}
                  <X
                    className="size-3 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTag(opt.value)
                    }}
                  />
                </span>
              ))
            ) : (
              placeholder
            )
          ) : (
            selectedLabel ?? placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            "ml-1 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {loading ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                Searching…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((opt) => {
                const active = isSelected(opt.value)
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
