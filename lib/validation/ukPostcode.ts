/**
 * UK postcode shape, with the space optional.
 *
 * Covers the standard outward + inward patterns:
 * A9 9AA, A99 9AA, A9A 9AA, AA9 9AA, AA99 9AA, AA9A 9AA,
 * plus the special Girobank code GIR 0AA.
 *
 * This checks the format only. It does not confirm the code exists.
 */
const UK_POSTCODE_PATTERN = /^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;

/** Shown inside empty postcode fields so the expected format is visible. */
export const UK_POSTCODE_PLACEHOLDER = "E6 3BJ";

/** Shown when a non-empty value is not a UK postcode. */
export const UK_POSTCODE_FORMAT_ERROR =
  "Enter a valid UK postcode, for example E6 3BJ";

/**
 * Returns an error message when `value` is non-empty and not a UK postcode.
 * An empty value is valid here because some fields (filters) are optional.
 */
export function getUkPostcodeFormatError(value: string): string | null {
  const trimmedPostcode = value.trim();
  if (!trimmedPostcode) return null;
  return UK_POSTCODE_PATTERN.test(trimmedPostcode)
    ? null
    : UK_POSTCODE_FORMAT_ERROR;
}
