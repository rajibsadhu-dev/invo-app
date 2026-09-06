import { useState, useRef, useEffect } from "react"
import type { FieldValues } from "react-hook-form"
import { ChevronDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps, type Option } from "./shared"

type InvoComboboxProps<T extends FieldValues> = BaseFieldProps<T> & {
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
}

/**
 * InvoCombobox — searchable select with filtering.
 *
 * Usage:
 *   <InvoCombobox
 *     control={form.control}
 *     name="country"
 *     label="Country"
 *     options={countries}
 *     searchPlaceholder="Search country..."
 *   />
 */
export function InvoCombobox<T extends FieldValues>({
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyText = "No results found",
  disabled,
  ...fieldProps
}: InvoComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  // Clearing the search belongs to the close action, not to an effect reacting to it —
  // setting state inside an effect body triggers a cascading re-render.
  const changeOpen = (next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => {
        const selected = options.find((o) => String(o.value) === String(field.value))

        return (
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && changeOpen(!open)}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              className={cn(
                "flex h-8 w-full items-center justify-between rounded-[1.5px] border border-input bg-white text-black px-2.5 py-1 text-sm transition-colors outline-none select-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
                !selected && "text-gray-400",
                fieldState.error && "border-destructive ring-3 ring-destructive/20",
                open && "border-ring ring-3 ring-ring/50"
              )}
            >
              {selected?.label ?? placeholder}
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => changeOpen(false)}
                />
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg bg-popover shadow-md ring-1 ring-foreground/10">
                  {/* Search */}
                  <div className="flex items-center gap-2 border-b px-2.5 py-2">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {/* Options */}
                  <div className="max-h-52 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        {emptyText}
                      </p>
                    ) : (
                      filtered.map((opt) => {
                        const isSelected = String(field.value) === String(opt.value)
                        return (
                          <div
                            key={opt.value}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              field.onChange(opt.value)
                              changeOpen(false)
                            }}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none",
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Check
                              className={cn(
                                "size-3.5 shrink-0",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {opt.label}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      }}
    />
  )
}
