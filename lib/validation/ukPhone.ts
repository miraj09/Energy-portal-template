/** Shown inside empty phone fields so the expected format is visible. */
export const UK_PHONE_PLACEHOLDER = "07123 456789";

/** Shown when a non-empty value is not a UK phone number. */
export const UK_PHONE_FORMAT_ERROR =
  "Enter a valid UK phone number, for example 07123 456789 or +44 20 1234 5678";

/**
 * Returns an error when `value` is non-empty and not a UK phone number.
 * An empty value is valid here because some phone fields are optional.
 *
 * Accepts national numbers (0 followed by 9 or 10 digits) and the same
 * number written as +44 or 0044 without the leading 0. Spaces, hyphens,
 * and brackets are ignored.
 */
export function getUkPhoneFormatError(value: string): string | null {
  const trimmedPhone = value.trim();
  if (!trimmedPhone) return null;

  const compactPhone = trimmedPhone.replace(/[\s()-]/g, "");
  if (!/^\+?\d+$/.test(compactPhone)) {
    return UK_PHONE_FORMAT_ERROR;
  }

  if (compactPhone.startsWith("+44") || compactPhone.startsWith("0044")) {
    const nationalNumber = compactPhone.startsWith("+44")
      ? compactPhone.slice(3)
      : compactPhone.slice(4);
    const isValidInternational =
      /^[1-9]\d{8,9}$/.test(nationalNumber);
    return isValidInternational ? null : UK_PHONE_FORMAT_ERROR;
  }

  const isValidNational = /^0\d{9,10}$/.test(compactPhone);
  return isValidNational ? null : UK_PHONE_FORMAT_ERROR;
}
