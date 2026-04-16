import { useState } from "react"
import type { FieldValues } from "react-hook-form"
import { ChevronDown, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps, type Option } from "./shared"

type InvoMultiSelectProps<T extends FieldValues> = BaseFieldProps<T> & {
  options: Option[]
  placeholder?: string
  max?: number
}

/**
 * InvoMultiSelect — multi-value select with badges.
 *
 * Field value type: string[]
 *
 * Usage:
 *   <InvoMultiSelect
 *     control={form.control}
 *     name="tags"
 *     label="Tags"
 *     options={[{ value: "a", label: "Alpha" }]}
 *   />
 */
export function InvoMultiSelect<T extends FieldValues>({
  options,
  placeholder = "Select options",
  max,
  disabled,
  ...fieldProps
}: InvoMultiSelectProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : []

        const toggle = (value: string) => {
          if (selected.includes(value)) {
            field.onChange(selected.filter((v) => v !== value))
          } else {
            if (max && selected.length >= max) return
            field.onChange([...selected, value])
          }
        }

        const remove = (value: string, e: React.MouseEvent) => {
          e.stopPropagation()
          field.onChange(selected.filter((v) => v !== value))
        }

        return (
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setOpen((o) => !o)}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              className={cn(
                "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                fieldState.error &&
                  "border-destructive ring-3 ring-destructive/20",
                open && "border-ring ring-3 ring-ring/50"
              )}
            >
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((v) => {
                  const opt = options.find((o) => o.value === v)
                  return (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs"
                    >
                      {opt?.label ?? v}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => remove(v, e)}
                        onKeyDown={(e) => e.key === "Enter" && remove(v, e as any)}
                        className="cursor-pointer rounded-sm opacity-70 hover:opacity-100"
                      >
                        <X className="size-3" />
                      </span>
                    </Badge>
                  )
                })
              )}
              <ChevronDown
                className={cn(
                  "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOpen(false)}
                />
                {/* Dropdown */}
                <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
                  {options.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      No options
                    </p>
                  ) : (
                    options.map((opt) => {
                      const isSelected = selected.includes(opt.value)
                      const isDisabled = !isSelected && !!max && selected.length >= max
                      return (
                        <div
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => !isDisabled && toggle(opt.value)}
                          className={cn(
                            "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground",
                            isDisabled && "cursor-not-allowed opacity-40"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-4 items-center justify-center rounded-sm border border-input",
                              isSelected && "border-primary bg-primary text-primary-foreground"
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          {opt.label}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )
      }}
    />
  )
}
