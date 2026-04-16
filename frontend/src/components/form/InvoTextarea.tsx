import type { FieldValues } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { FieldWrapper, type BaseFieldProps } from "./shared"

type InvoTextareaProps<T extends FieldValues> = BaseFieldProps<T> & {
  placeholder?: string
  rows?: number
  maxLength?: number
}

/**
 * InvoTextarea — multi-line text input.
 *
 * Usage:
 *   <InvoTextarea control={form.control} name="notes" label="Notes" rows={4} />
 */
export function InvoTextarea<T extends FieldValues>({
  placeholder,
  rows,
  maxLength,
  disabled,
  ...fieldProps
}: InvoTextareaProps<T>) {
  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => (
        <Textarea
          {...field}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
          value={field.value ?? ""}
        />
      )}
    />
  )
}
