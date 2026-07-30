/** Human-readable message from API validation or error payloads. */
export function getApiErrorMessage(response: {
  message?: string;
  errors?: unknown;
}): string {
  const errors = response.errors as
    | Record<string, string[] | string>
    | undefined;

  if (errors && typeof errors === "object" && !("authError" in errors)) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const raw = Array.isArray(errors[firstKey])
        ? (errors[firstKey] as string[])[0]
        : String(errors[firstKey]);
      if (raw?.startsWith("This field")) {
        return `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(1)}${raw.replace("This field", "")}`
          .trim()
          .replace(/\.$/, "");
      }
      return raw?.replace(/\.$/, "") || response.message || "Request failed";
    }
  }

  return response.message || "Request failed";
}
