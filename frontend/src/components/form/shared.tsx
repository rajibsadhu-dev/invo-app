/**
 * Internal shared types and FieldWrapper used by all Invo form components.
 * Not exported from the barrel — consumers import the Invo* components directly.
 */
import { Controller } from "react-hook-form"
import type {
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
  ControllerFieldState,
} from "react-hook-form"
import { cn } from "@/lib/utils"

export type Option = { value: string; label: string }

export type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FieldWrapper<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  className,
  render,
}: BaseFieldProps<T> & {
  render: (
    field: ControllerRenderProps<T, FieldPath<T>>,
    fieldState: ControllerFieldState
  ) => React.ReactNode
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("flex flex-col gap-1.5", className)}>
          {label && (
            <label
              className={cn(
                "text-sm font-medium leading-none",
                fieldState.error && "text-destructive"
              )}
            >
              {label}
              {required && (
                <span className="ml-0.5 text-destructive" aria-hidden>
                  *
                </span>
              )}
            </label>
          )}
          {render(field, fieldState)}
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
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
