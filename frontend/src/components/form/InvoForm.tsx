import { FormProvider } from "react-hook-form"
import type { UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form"
import { cn } from "@/lib/utils"

type InvoFormProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  onSubmit: SubmitHandler<T>
  children: React.ReactNode
  className?: string
}

/**
 * InvoForm — wraps FormProvider + <form> with handleSubmit.
 *
 * Usage:
 *   const form = useForm<MySchema>({ resolver: zodResolver(schema) })
 *   <InvoForm form={form} onSubmit={handleSubmit}>
 *     <InvoInput control={form.control} name="email" label="Email" />
 *     <Button type="submit">Submit</Button>
 *   </InvoForm>
 */
export function InvoForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: InvoFormProps<T>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  )
}
