import type { FieldValues } from "react-hook-form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps, type Option } from "./shared"

type InvoRadioProps<T extends FieldValues> = BaseFieldProps<T> & {
  options: Option[]
  orientation?: "horizontal" | "vertical"
}

/**
 * InvoRadio — radio group for single-choice selection.
 *
 * Usage:
 *   <InvoRadio
 *     control={form.control}
 *     name="gender"
 *     label="Gender"
 *     options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
 *     orientation="horizontal"
 *   />
 */
export function InvoRadio<T extends FieldValues>({
  options,
  orientation = "vertical",
  disabled,
  ...fieldProps
}: InvoRadioProps<T>) {
  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field) => (
        <RadioGroup
          value={field.value ?? ""}
          onValueChange={(value) => field.onChange(value)}
          disabled={disabled}
          className={cn(
            orientation === "horizontal" ? "flex flex-row flex-wrap gap-4" : "flex flex-col gap-2"
          )}
        >
          {options.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-sm",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <RadioGroupItem value={opt.value} disabled={disabled} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      )}
    />
  )
}
