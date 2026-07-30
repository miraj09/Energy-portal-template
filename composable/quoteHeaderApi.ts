import { patchMethod } from "@/lib/actions/patchMethod";
import { postMethod } from "@/lib/actions/postMethod";
import type { FlatQuotePayload } from "@/composable/meterQuoteForm";

const QUOTE_HEADER_ENDPOINT = "/api/v1/auth/web/core/quote-header";

export interface QuoteHeaderApiResponse {
  success: boolean;
  message?: string;
  errors?: unknown;
}

/** Extract quote header id from varied API response shapes. */
export function extractQuoteHeaderId(data: unknown): string | number | null {
  if (data == null) return null;

  if (typeof data === "number" && !Number.isNaN(data)) {
    return data;
  }

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  const directId =
    obj.id ??
    obj.Quote_Header_ID ??
    obj.quote_header_id ??
    obj.quote_header ??
    obj.quote_id;

  if (typeof directId === "number" && !Number.isNaN(directId)) {
    return directId;
  }
  if (typeof directId === "string" && directId.trim()) {
    return directId.trim();
  }

  if (obj.data != null) {
    return extractQuoteHeaderId(obj.data);
  }

  return null;
}

export { getApiErrorMessage as getQuoteApiErrorMessage } from "@/composable/getApiErrorMessage";

/** Resolve quote-header id from create-meter or company GET responses. */
export function extractQuoteIdFromApiResponse(data: unknown): number | null {
  if (data == null || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const quoteField = record.quote;

  if (typeof quoteField === "number" && Number.isFinite(quoteField)) {
    return quoteField;
  }

  if (quoteField && typeof quoteField === "object" && !Array.isArray(quoteField)) {
    const quoteRecord = quoteField as Record<string, unknown>;
    if (typeof quoteRecord.id === "number" && Number.isFinite(quoteRecord.id)) {
      return quoteRecord.id;
    }
  }

  if (typeof record.id === "number" && Number.isFinite(record.id)) {
    return record.id;
  }

  if (typeof record.Quote_Header_ID === "number") {
    return record.Quote_Header_ID;
  }

  return null;
}

/** PATCH flat rate fields onto an existing quote-header. */
export async function patchQuoteHeader(
  quoteId: number,
  payload: FlatQuotePayload
): Promise<QuoteHeaderApiResponse> {
  const response = await patchMethod(payload, `${QUOTE_HEADER_ENDPOINT}/${quoteId}/`);

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to update quote header",
      errors: response.errors,
    };
  }

  return {
    success: true,
    message: response.message || "Quote header updated successfully",
  };
}

/** POST a new quote-header (standalone quote flow, not meter-linked). */
export async function postQuoteHeader(
  payload: FlatQuotePayload
): Promise<QuoteHeaderApiResponse & { quoteId?: number }> {
  const response = await postMethod(payload, `${QUOTE_HEADER_ENDPOINT}/`);

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to create quote header",
      errors: response.errors,
    };
  }

  const quoteId = extractQuoteIdFromApiResponse(response.data);

  return {
    success: true,
    message: response.message || "Quote header created successfully",
    quoteId: quoteId ?? undefined,
  };
}
