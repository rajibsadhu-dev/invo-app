import type { FieldValues } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps } from "./shared"

type InvoCheckboxProps<T extends FieldValues> = Omit<
  BaseFieldProps<T>,
  "label"
> & {
  label: string // required for checkbox — it's the clickable text
}

/**
 * InvoCheckbox — boolean checkbox with inline label.
 *
 * Usage:
 *   <InvoCheckbox control={form.control} name="agreed" label="I agree to the terms" />
 */
export function InvoCheckbox<T extends FieldValues>({
  label,
  description,
  disabled,
  ...fieldProps
}: InvoCheckboxProps<T>) {
  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      // Pass description & no label — we render them inline below
      render={(field, fieldState) => (
        <div className="flex flex-col gap-1">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 text-sm",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(checked) => field.onChange(!!checked)}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              className="mt-0.5 shrink-0"
            />
            <span className={cn(fieldState.error && "text-destructive")}>
              {label}
            </span>
          </label>
          {description && !fieldState.error && (
            <p className="pl-6 text-xs text-muted-foreground">{description}</p>
          )}
          {fieldState.error?.message && (
            <p className="pl-6 text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
