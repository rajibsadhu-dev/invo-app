import { BUSINESS_TYPES, BUSINESS_TYPE_LIST_ID } from "@/lib/businessTypes"

/**
 * The suggestion list behind the business-type field. Render it once per form and point an
 * input at it with `list={BUSINESS_TYPE_LIST_ID}` — the input stays free text.
 */
export function BusinessTypeOptions() {
  return (
    <datalist id={BUSINESS_TYPE_LIST_ID}>
      {BUSINESS_TYPES.map((type) => (
        <option key={type} value={type} />
      ))}
    </datalist>
  )
}
