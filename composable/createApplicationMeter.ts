import { postMethod } from "@/lib/actions/postMethod";
import { Meter } from "@/components/ApplicationDetails/types";

const CREATE_METER_ENDPOINT = "/api/v1/auth/web/core/meter/";

export interface CreateApplicationMeterPayload {
  company_id: string;
  site_id: number;
  meter_type: "Electricity" | "Gas";
  meter_reference: string;
  quote_payload: Record<string, unknown>;
}

export interface CreateApplicationMeterResponse {
  success: boolean;
  data?: Meter;
  message?: string;
  errors?: unknown;
}

/** Fallback when API succeeds but returns an unexpected shape. */
function buildFallbackMeter(
  payload: CreateApplicationMeterPayload
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
  payload: CreateApplicationMeterPayload
): Meter {
  if (data && typeof data === "object" && "meterid" in data) {
    return data as Meter;
  }
  return buildFallbackMeter(payload);
}

/**
 * Create a meter for an application site via POST /api/v1/auth/web/core/meter/.
 */
export async function createApplicationMeter(
  payload: CreateApplicationMeterPayload
): Promise<CreateApplicationMeterResponse> {
  const response = await postMethod(
    {
      company: payload.company_id,
      site: payload.site_id,
      meter_type: payload.meter_type,
      meter_reference: payload.meter_reference,
      ...payload.quote_payload,
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

  return {
    success: true,
    data: mapApiResponseToMeter(response.data, payload),
  };
}
