import { postMethod } from "@/lib/actions/postMethod";
import { Meter } from "@/components/ApplicationDetails/types";
import type { FlatQuotePayload } from "@/composable/meterQuoteForm";
import {
  extractQuoteIdFromApiResponse,
  patchQuoteHeader,
} from "@/composable/quoteHeaderApi";

const CREATE_METER_ENDPOINT = "/api/v1/auth/web/core/meter/";

/** Minimal meter fields for the application quote flow (quote-header created separately). */
export interface CreateApplicationMeterBasicPayload {
  company_id: string;
  site_id: number;
  meter_type: "Electricity" | "Gas";
  meter_reference: string;
}

export interface CreateApplicationMeterPayload
  extends CreateApplicationMeterBasicPayload {
  quote_payload: FlatQuotePayload;
  /** Required when updating an existing meter's quote rates. */
  quote_id?: number;
}

export interface CreateApplicationMeterResponse {
  success: boolean;
  data?: Meter;
  message?: string;
  errors?: unknown;
  quoteId?: number;
}

/** Fallback when API succeeds but returns an unexpected shape. */
function buildFallbackMeter(
  payload: CreateApplicationMeterBasicPayload
): Meter {
  const now = new Date().toISOString();

  return {
    meterid: Date.now(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
    is_active: true,
    latest_issold: false,
    latest_isprocessed: false,
    sold_contracts: 0,
    processed_contracts: 0,
    soldleadid: false,
    latestcontractid: 0,
    latestsoldsuppliername: "",
    latesttariffname: "",
    latestterm: 0,
    latestSoldStandingCharge: "0.00",
    latestSoldDayRate: "0.00",
    latestSoldNightRate: null,
    latestSoldEveningWeekendRate: null,
    latestSoldWinterRate: null,
    leadid: 0,
    meter_status_id: 0,
    meter_type_id: payload.meter_type === "Gas" ? 2 : 1,
    meter_type_name: payload.meter_type,
    meter_reference: payload.meter_reference,
    ssite_id: null,
    smeterid: null,
    electric_contract_type_id: 0,
    created_user_id: 0,
    screated_user_id: null,
    created_datetime: now,
    last_modified_user_id: 0,
    last_modified_datetime: now,
    deleted_user_id: null,
    deleted_datetime: null,
    is_deleted: false,
    is_electralink_consent: null,
    created_by: null,
    deleted_by: null,
    site: payload.site_id,
  };
}

function mapApiResponseToMeter(
  data: unknown,
  payload: CreateApplicationMeterBasicPayload
): Meter {
  if (data && typeof data === "object") {
    if ("meterid" in data && (data as Meter).meterid) {
      return data as Meter;
    }
    if ("id" in data && typeof (data as { id: unknown }).id === "number") {
      return {
        ...buildFallbackMeter(payload),
        meterid: (data as { id: number }).id,
      };
    }
  }
  return buildFallbackMeter(payload);
}

/** Resolve meter primary key from create-meter API response. */
export function extractMeterIdFromApiResponse(
  data: unknown
): number | null {
  if (data && typeof data === "object") {
    if ("meterid" in data && typeof (data as Meter).meterid === "number") {
      return (data as Meter).meterid;
    }
    if ("id" in data && typeof (data as { id: unknown }).id === "number") {
      return (data as { id: number }).id;
    }
  }
  return null;
}

function resolveMeterTypeId(meterType: "Electricity" | "Gas"): number {
  return meterType === "Gas" ? 1 : 2;
}

/**
 * Create a meter with only site, type, and reference.
 * The API auto-creates a linked quote-header; patch rates separately if needed.
 */
export async function createApplicationMeterBasic(
  payload: CreateApplicationMeterBasicPayload
): Promise<CreateApplicationMeterResponse> {
  const response = await postMethod(
    {
      site: payload.site_id,
      meter_type: resolveMeterTypeId(payload.meter_type),
      meter_reference: payload.meter_reference,
    },
    CREATE_METER_ENDPOINT
  );

  if (!response.success) {
    return {
      success: false,
      message: response.message || "Failed to create meter",
      errors: response.errors,
    };
  }

  const quoteId = extractQuoteIdFromApiResponse(response.data) ?? undefined;

  return {
    success: true,
    data: mapApiResponseToMeter(response.data, payload),
    quoteId,
  };
}

/**
 * Create a meter, then PATCH the auto-created quote-header with flat rate fields.
 */
export async function createApplicationMeter(
  payload: CreateApplicationMeterPayload
): Promise<CreateApplicationMeterResponse> {
  const meterResponse = await createApplicationMeterBasic(payload);

  if (!meterResponse.success) {
    return meterResponse;
  }

  const quoteId =
    meterResponse.quoteId ??
    extractQuoteIdFromApiResponse(meterResponse.data) ??
    null;

  if (!quoteId) {
    return {
      success: false,
      message: "Meter created but no quote ID was returned to save rates.",
      data: meterResponse.data,
    };
  }

  const quoteResponse = await patchQuoteHeader(quoteId, payload.quote_payload);

  if (!quoteResponse.success) {
    return {
      success: false,
      message:
        quoteResponse.message ||
        "Meter created but quote rates could not be saved.",
      data: meterResponse.data,
      errors: quoteResponse.errors,
      quoteId,
    };
  }

  return {
    success: true,
    data: meterResponse.data,
    quoteId,
    message: quoteResponse.message || "Meter and quote saved successfully",
  };
}
