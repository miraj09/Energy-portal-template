/**
 * Pulls the first message for a field out of an action result's `errors` bag.
 * Handles both DRF's `{ field: ["msg"] }` and zod's flattened `fieldErrors`.
 */
export function getFieldError(errors: unknown, field: string): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;

  const value = (errors as Record<string, unknown>)[field];

  if (Array.isArray(value)) {
    const first = value.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
    return first;
  }

  if (typeof value === "string" && value.trim().length > 0) return value;

  return undefined;
}
