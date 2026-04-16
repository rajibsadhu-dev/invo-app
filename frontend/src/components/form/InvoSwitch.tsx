import type { FieldValues } from "react-hook-form"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { FieldWrapper, type BaseFieldProps } from "./shared"

type InvoSwitchProps<T extends FieldValues> = Omit<BaseFieldProps<T>, "label"> & {
  label: string // required — shown next to the switch
}

/**
 * InvoSwitch — toggle switch with inline label.
 *
 * Usage:
 *   <InvoSwitch
 *     control={form.control}
 *     name="notifications"
 *     label="Enable notifications"
 *     description="Receive email updates"
 *   />
 */
export function InvoSwitch<T extends FieldValues>({
  label,
  description,
  disabled,
  ...fieldProps
}: InvoSwitchProps<T>) {
  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) => (
        <div className="flex flex-col gap-1">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3",
              disabled && "cursor-not-allowed opacity-50",
              fieldState.error && "border-destructive"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{label}</span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
            <Switch
              checked={!!field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
              disabled={disabled}
            />
          </label>
          {fieldState.error?.message && (
            <p className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
