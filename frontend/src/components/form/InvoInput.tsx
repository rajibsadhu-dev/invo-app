import { useState } from "react"
import type { FieldValues } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FieldWrapper, type BaseFieldProps } from "./shared"

type InvoInputProps<T extends FieldValues> = BaseFieldProps<T> & {
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
  autoComplete?: string
}

/**
 * InvoInput — text, email, password, number, tel, url inputs.
 * Password fields get a show/hide toggle automatically.
 *
 * Usage:
 *   <InvoInput control={form.control} name="email" label="Email" type="email" />
 */
export function InvoInput<T extends FieldValues>({
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  ...fieldProps
}: InvoInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <FieldWrapper
      {...fieldProps}
      disabled={disabled}
      render={(field, fieldState) =>
        isPassword ? (
          <div className="relative">
            <Input
              {...field}
              type={resolvedType}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              value={field.value ?? ""}
              className="px-3 rounded-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={disabled}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          <Input
            {...field}
            type={resolvedType}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
            value={field.value ?? ""}
          />
        )
      }
    />
  )
}
