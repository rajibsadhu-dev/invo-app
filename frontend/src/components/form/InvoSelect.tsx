import type { FieldValues } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldWrapper, type BaseFieldProps, type Option } from "./shared"

type InvoSelectProps<T extends FieldValues> = BaseFieldProps<T> & {
  options: Option[]
  placeholder?: string
}

/**
 * InvoSelect — single-value select dropdown.
 *
 * Usage:
 *   <InvoSelect
 *     control={form.control}
 *     name="role"
 *     label="Role"
 *     options={[{ value: "user", label: "User" }, { value: "superadmin", label: "Superadmin" }]}
 *   />
 */
export function InvoSelect<T extends FieldValues>({
  options,
  placeholder = "Select an option",
  disabled,
  ...fieldProps
}: InvoSelectProps<T>) {
  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => (
        <Select
          value={field.value ?? ""}
          onValueChange={(value) => field.onChange(value)}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-full"
            aria-invalid={!!fieldState.error}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}
