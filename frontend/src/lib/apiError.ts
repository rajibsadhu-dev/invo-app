/**
 * Pulls the human-readable message out of an RTK Query error.
 *
 * The API's error envelope is `{ success, message, errorMessages[] }`; RTK Query wraps it
 * as `{ status, data }`. Everything here is `unknown` because a rejected query can also be
 * a network failure or a serialization error, neither of which has a `data` field.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === "string" && message.trim()) return message
    }
  }
  return fallback
}
