/**
 * Normalizes business_type from API responses or form state to a numeric PK.
 * Handles number, string, nested { id }, or SelectOption-style values.
 */
export function resolveBusinessTypePk(businessType: unknown): number | null {
  if (businessType == null) {
    return null;
  }

  if (typeof businessType === "number" && Number.isFinite(businessType)) {
    return businessType;
  }

  if (typeof businessType === "string") {
    const trimmed = businessType.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof businessType === "object" && !Array.isArray(businessType)) {
    const record = businessType as Record<string, unknown>;

    // SelectOption shape: { value, label }
    if ("value" in record && record.value != null) {
      const fromValue = resolveBusinessTypePk(record.value);
      if (fromValue != null) {
        return fromValue;
      }
    }

    if ("id" in record) {
      return resolveBusinessTypePk(record.id);
    }

    if ("pk" in record) {
      return resolveBusinessTypePk(record.pk);
    }
  }

  return null;
}
