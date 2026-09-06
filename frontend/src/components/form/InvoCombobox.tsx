import { useState, useRef, useEffect, useCallback } from "react"
import type { FieldValues } from "react-hook-form"
import { ChevronDown, Search, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps, type Option } from "./shared"

type InvoComboboxProps<T extends FieldValues> = BaseFieldProps<T> & {
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Enable multi-select mode */
  multiple?: boolean
  /** Async search callback. When provided, options are not filtered client-side. */
  onSearch?: (query: string) => void
  /** Show a loading spinner in the dropdown */
  loading?: boolean
  /** Debounce delay in ms for onSearch (default: 300) */
  debounce?: number
}

/**
 * InvoCombobox — searchable select with filtering, async search, and multi-select.
 *
 * Single select:
 *   <InvoCombobox control={form.control} name="customerId" label="Customer" options={customers} />
 *
 * Multi select:
 *   <InvoCombobox control={form.control} name="tags" label="Tags" options={tags} multiple />
 *
 * Async search:
 *   <InvoCombobox control={form.control} name="product" label="Product" options={results}
 *     onSearch={setSearchTerm} loading={isLoading} />
 */
export function InvoCombobox<T extends FieldValues>({
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyText = "No results found",
  disabled,
  multiple = false,
  onSearch,
  loading = false,
  debounce = 300,
  ...fieldProps
}: InvoComboboxProps<T>) {
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
        debounceRef.current = setTimeout(() => onSearch(value), debounce)
      }
    },
    [onSearch, debounce]
  )

  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch("")
      if (onSearch) onSearch("")
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
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

  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => {
        const currentValue = field.value

        // Multi-select helpers
        const selectedValues: string[] = multiple
          ? Array.isArray(currentValue) ? currentValue.map(String) : []
          : []
        const isMultiSelected = (val: string) => selectedValues.includes(val)

        // Single-select helpers
        const selected = !multiple
          ? options.find((o) => String(o.value) === String(currentValue))
          : null

        const toggleMulti = (val: string) => {
          const next = isMultiSelected(val)
            ? selectedValues.filter((v) => v !== val)
            : [...selectedValues, val]
          field.onChange(next)
        }

        const selectedLabels = multiple
          ? options.filter((o) => selectedValues.includes(String(o.value)))
          : []

        return (
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => !disabled && changeOpen(!open)}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              className={cn(
                "flex h-auto min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors outline-none select-none",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !selected && !selectedLabels.length && "text-muted-foreground",
                fieldState.error && "border-destructive ring-[3px] ring-destructive/20",
                open && "border-ring ring-[3px] ring-ring/50"
              )}
            >
              <span className="flex flex-1 flex-wrap gap-1 truncate text-left">
                {multiple ? (
                  selectedLabels.length > 0 ? (
                    selectedLabels.map((opt) => (
                      <span
                        key={opt.value}
                        className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-xs font-medium"
                      >
                        {opt.label}
                        <X
                          className="size-3 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMulti(String(opt.value))
                          }}
                        />
                      </span>
                    ))
                  ) : (
                    placeholder
                  )
                ) : (
                  selected?.label ?? placeholder
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
                {/* Search */}
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
                {/* Options */}
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
                      const isActive = multiple
                        ? isMultiSelected(String(opt.value))
                        : String(currentValue) === String(opt.value)
                      return (
                        <div
                          key={opt.value}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            if (multiple) {
                              toggleMulti(String(opt.value))
                            } else {
                              field.onChange(opt.value)
                              changeOpen(false)
                            }
                          }}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                        >
                          <Check
                            className={cn(
                              "size-3.5 shrink-0",
                              isActive ? "opacity-100" : "opacity-0"
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
      }}
    />
  )
}
