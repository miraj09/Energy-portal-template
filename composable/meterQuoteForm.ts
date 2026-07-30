import {
  ContractDetails,
  Meter,
  MeterReference,
} from "@/components/ApplicationDetails/types";

export interface MeterContractRate {
  rate: number;
  usage: number | null;
  rate_type: number;
  rate_required?: boolean;
  usage_required?: boolean;
}

/** Flat quote-header fields returned by the new API (no Contract_Rates). */
export interface FlatQuotePayload {
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  /** Full MPAN/MPRN without leading indicator (typically 21 digits for MPAN). */
  mpan_mrpn_text?: string | null;
  postcode?: string | null;
  Supplier?: number;
  Number_of_Days?: number;
  Contract_Start_Date?: string;
  standing_charge?: number | null;
  day_rate?: number;
  day_kwh?: number;
  night_rate?: number | null;
  night_kwh?: number | null;
  ew_rate?: number | null;
  ew_kwh?: number | null;
  winter_rate?: number | null;
  winter_kwh?: number | null;
  /** Sum of day_kwh + night_kwh + ew_kwh + winter_kwh. */
  aq_eac?: number;
  is_mpan?: boolean;
  is_mrpn?: boolean;
}

/** Inbound quote header: same shape as FlatQuotePayload, but aq_eac may be string/null from GET. */
export interface MeterQuoteHeaderFields
  extends Omit<FlatQuotePayload, "aq_eac"> {
  supplier?: number;
  Contract_Rates?: MeterContractRate[];
  /** May also arrive as string from GET responses. */
  aq_eac?: string | number | null;
}

export interface MpanMrpnDetails {
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  is_mpan?: boolean;
  is_mrpn?: boolean;
  mpan_mrpn_text?: string | null;
}

export type ApplicationMeterApiResponse = Meter & {
  meter_type_name?: string;
  meter_type?: string;
  mpan_mrpn_details?: MpanMrpnDetails | null;
  quote?: MeterQuoteHeaderFields | null;
  quote_header?: MeterQuoteHeaderFields | null;
  aq?: string | null;
};

export interface MeterQuoteFormValues {
  mprn?: string;
  mpanTopValues?: string[];
  mpanBottomValues?: string[];
  postcode?: string;
  supplierId?: number;
  contractStartDate?: string;
  numberOfDays?: string;
  currentStandingCharge?: string;
  dayRate?: string;
  dayKwh?: string;
  nightRate?: string;
  nightKwh?: string;
  ewRate?: string;
  ewKwh?: string;
  winterRate?: string;
  winterKwh?: string;
}

export interface BuildFlatQuotePayloadOptions {
  isGas?: boolean;
  profileclass?: string | null;
  MTC?: string | null;
  LLF?: string | null;
  Region?: string | null;
  bottomline?: string | null;
  postcode?: string | null;
  supplierId?: number;
  numberOfDays?: string;
  contractStartDate?: string;
  currentStandingCharge?: string;
  dayRate?: string;
  dayKwh?: string;
  nightRate?: string;
  nightKwh?: string;
  ewRate?: string;
  ewKwh?: string;
  winterRate?: string;
  winterKwh?: string;
}

function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

function hasValue(value: string | null | undefined): value is string {
  return value != null && value !== "" && value !== "None";
}

function parseOptionalFloat(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredFloat(value: string | undefined, fallback = 0): number {
  return parseOptionalFloat(value) ?? fallback;
}

function parseRequiredInt(value: string | undefined, fallback = 0): number {
  return parseOptionalInt(value) ?? fallback;
}

function formatRateString(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return value;
}

/** Build flat quote-header payload for POST/PATCH (no Contract_Rates). */
export function buildFlatQuotePayload(
  options: BuildFlatQuotePayloadOptions
): FlatQuotePayload {
  const isGas = options.isGas === true;

  const dayKwh = parseRequiredInt(options.dayKwh);
  const nightKwh = isGas ? 0 : parseOptionalInt(options.nightKwh) ?? 0;
  const ewKwh = isGas ? 0 : parseOptionalInt(options.ewKwh) ?? 0;
  const winterKwh = isGas ? 0 : parseOptionalInt(options.winterKwh) ?? 0;

  const payload: FlatQuotePayload = {
    profileclass: isGas ? null : options.profileclass ?? null,
    MTC: isGas ? null : options.MTC ?? null,
    LLF: isGas ? null : options.LLF ?? null,
    Region: isGas ? null : options.Region ?? null,
    bottomline: options.bottomline ?? null,
    postcode: options.postcode ?? null,
    Supplier: options.supplierId,
    Number_of_Days: parseOptionalInt(options.numberOfDays) ?? 365,
    Contract_Start_Date:
      options.contractStartDate?.trim() || new Date().toISOString(),
    standing_charge: parseOptionalFloat(options.currentStandingCharge),
    day_rate: parseRequiredFloat(options.dayRate),
    day_kwh: dayKwh,
    aq_eac: dayKwh + nightKwh + ewKwh + winterKwh,
    is_mpan: !isGas,
    is_mrpn: isGas,
  };

  if (!isGas) {
    payload.night_rate = parseOptionalFloat(options.nightRate);
    payload.night_kwh = parseOptionalInt(options.nightKwh);
    payload.ew_rate = parseOptionalFloat(options.ewRate);
    payload.ew_kwh = parseOptionalInt(options.ewKwh);
    payload.winter_rate = parseOptionalFloat(options.winterRate);
    payload.winter_kwh = parseOptionalInt(options.winterKwh);
  }

  return payload;
}

/** Merge quote, legacy quote_header, and mpan_mrpn_details into one field set. */
function extractQuoteFields(
  data: ApplicationMeterApiResponse
): MeterQuoteHeaderFields {
  const mpanDetails = data.mpan_mrpn_details ?? {};
  const quote = data.quote ?? data.quote_header ?? {};

  return {
    profileclass: quote.profileclass ?? mpanDetails.profileclass ?? null,
    MTC: quote.MTC ?? mpanDetails.MTC ?? null,
    LLF: quote.LLF ?? mpanDetails.LLF ?? null,
    Region: quote.Region ?? mpanDetails.Region ?? null,
    bottomline:
      quote.bottomline ??
      mpanDetails.bottomline ??
      data.meter_reference ??
      null,
    postcode: quote.postcode ?? null,
    Supplier: quote.Supplier ?? quote.supplier,
    Number_of_Days: quote.Number_of_Days,
    Contract_Start_Date: quote.Contract_Start_Date,
    standing_charge: quote.standing_charge ?? null,
    day_rate: quote.day_rate,
    day_kwh: quote.day_kwh,
    night_rate: quote.night_rate ?? null,
    night_kwh: quote.night_kwh ?? null,
    ew_rate: quote.ew_rate ?? null,
    ew_kwh: quote.ew_kwh ?? null,
    winter_rate: quote.winter_rate ?? null,
    winter_kwh: quote.winter_kwh ?? null,
    aq_eac: quote.aq_eac ?? data.aq ?? null,
    Contract_Rates: quote.Contract_Rates,
    is_mpan: quote.is_mpan ?? mpanDetails.is_mpan,
    is_mrpn: quote.is_mrpn ?? mpanDetails.is_mrpn,
  };
}

function hasFlatRateFields(quoteFields: MeterQuoteHeaderFields): boolean {
  return (
    quoteFields.standing_charge != null ||
    quoteFields.day_rate != null ||
    quoteFields.day_kwh != null
  );
}

function extractRatesFromFlatFields(quoteFields: MeterQuoteHeaderFields) {
  return {
    currentStandingCharge: formatRateString(quoteFields.standing_charge),
    dayRate: formatRateString(quoteFields.day_rate),
    dayKwh: formatRateString(quoteFields.day_kwh),
    nightRate: formatRateString(quoteFields.night_rate),
    nightKwh: formatRateString(quoteFields.night_kwh),
    ewRate: formatRateString(quoteFields.ew_rate),
    ewKwh: formatRateString(quoteFields.ew_kwh),
    winterRate: formatRateString(quoteFields.winter_rate),
    winterKwh: formatRateString(quoteFields.winter_kwh),
  };
}

/** Legacy fallback when API still returns Contract_Rates without flat fields. */
function extractRatesFromContractRates(
  contractRates?: MeterContractRate[],
  aqFallback?: string | null
) {
  const rates = {
    currentStandingCharge: "",
    dayRate: "",
    dayKwh: "",
    nightRate: "",
    nightKwh: "",
    ewRate: "",
    ewKwh: "",
    winterRate: "",
    winterKwh: "",
  };

  if (contractRates?.length) {
    contractRates.forEach((rate) => {
      switch (rate.rate_type) {
        case 1:
          rates.currentStandingCharge = rate.rate?.toString() ?? "";
          break;
        case 2:
          rates.dayRate = rate.rate?.toString() ?? "";
          rates.dayKwh = rate.usage?.toString() ?? "";
          break;
        case 3:
          rates.nightRate = rate.rate?.toString() ?? "";
          rates.nightKwh = rate.usage?.toString() ?? "";
          break;
        case 4:
          rates.ewRate = rate.rate?.toString() ?? "";
          rates.ewKwh = rate.usage?.toString() ?? "";
          break;
        case 5:
          rates.winterRate = rate.rate?.toString() ?? "";
          rates.winterKwh = rate.usage?.toString() ?? "";
          break;
        default:
          break;
      }
    });
  }

  if (!rates.dayKwh && aqFallback) {
    const parsedAq = Number.parseFloat(aqFallback);
    if (!Number.isNaN(parsedAq)) {
      rates.dayKwh = String(Math.round(parsedAq));
    }
  }

  return rates;
}

function extractRatesFromQuoteFields(
  quoteFields: MeterQuoteHeaderFields,
  aqFallback?: string | null
) {
  if (hasFlatRateFields(quoteFields)) {
    return extractRatesFromFlatFields(quoteFields);
  }

  return extractRatesFromContractRates(quoteFields.Contract_Rates, aqFallback);
}

function sliceReferenceParts(value: string, lengths: number[]): string[] {
  let currentIndex = 0;
  return lengths.map((count) => {
    const part = value.slice(currentIndex, currentIndex + count);
    currentIndex += count;
    return part || "0".repeat(count);
  });
}

/**
 * Parse an MPAN reference string into display grid segments.
 * Supports:
 * - full MPAN with leading indicator (e.g. S + 21 digits)
 * - full MPAN without indicator (21 digits, as in quote.mpan_mrpn_text)
 * - legacy concatenated strings using the same segment lengths
 */
export function parseMeterReferenceForDisplay(meterRef: string): MeterReference {
  const cleaned = (meterRef || "").replace(/\s/g, "");

  // Full core MPAN without leading "S": PC(2) + MTC(3) + LLF(3) + Region(2) + bottom(11)
  if (/^\d{21}$/.test(cleaned)) {
    const parts = sliceReferenceParts(cleaned, [2, 3, 3, 2, 4, 4, 3]);
    return {
      indicator: "S",
      topRow: [parts[0], parts[1], parts[2]],
      bottomRow: [parts[3], parts[4], parts[5], parts[6]],
    };
  }

  const parts = sliceReferenceParts(cleaned, [1, 2, 3, 3, 2, 4, 4, 3]);

  return {
    indicator: parts[0] || "S",
    topRow: [parts[1] || "00", parts[2] || "000", parts[3] || "000"],
    bottomRow: [
      parts[4] || "00",
      parts[5] || "0000",
      parts[6] || "0000",
      parts[7] || "000",
    ],
  };
}

/**
 * Minimal meter payload for MPAN/MPRN grid display.
 * Intentionally loose so SiteMeter (QuoteHeaderFlat) and ApplicationMeterApiResponse
 * both assign without forcing quote rate field types to match.
 */
export type MeterReferenceDisplaySource = {
  meter_reference?: string | null;
  quote?: {
    profileclass?: string | null;
    MTC?: string | null;
    LLF?: string | null;
    Region?: string | null;
    bottomline?: string | null;
    mpan_mrpn_text?: string | null;
  } | null;
  quote_header?: {
    profileclass?: string | null;
    MTC?: string | null;
    LLF?: string | null;
    Region?: string | null;
    bottomline?: string | null;
    mpan_mrpn_text?: string | null;
  } | null;
  mpan_mrpn_details?: MpanMrpnDetails | null;
};

/**
 * Build the MPAN grid for list/detail display.
 * Company meter rows often store only the bottomline in `meter_reference`;
 * prefer quote / mpan_mrpn_details segments (or full mpan_mrpn_text) instead.
 */
export function buildMeterReferenceForDisplay(
  data: MeterReferenceDisplaySource
): MeterReference {
  const quoteFields = extractQuoteFields(data as ApplicationMeterApiResponse);

  if (
    hasValue(quoteFields.profileclass) &&
    hasValue(quoteFields.MTC) &&
    hasValue(quoteFields.LLF) &&
    hasValue(quoteFields.Region) &&
    hasValue(quoteFields.bottomline)
  ) {
    return {
      indicator: "S",
      topRow: [
        quoteFields.profileclass,
        quoteFields.MTC,
        quoteFields.LLF,
      ],
      bottomRow: bottomlineToBottomRow(
        quoteFields.Region,
        quoteFields.bottomline
      ),
    };
  }

  const fullMpanText =
    data.quote?.mpan_mrpn_text ??
    data.quote_header?.mpan_mrpn_text ??
    data.mpan_mrpn_details?.mpan_mrpn_text;

  if (hasValue(fullMpanText)) {
    return parseMeterReferenceForDisplay(fullMpanText);
  }

  return parseMeterReferenceForDisplay(data.meter_reference ?? "");
}

/** Parse full MPAN reference string into grid rows (no leading indicator). */
export function parseMeterReferenceToGrid(meterRef: string) {
  const { topRow, bottomRow } = parseMeterReferenceForDisplay(meterRef);
  return { topRow, bottomRow };
}

/** Coerce API boolean fields that may arrive as string/number. */
export function coerceMeterBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

/** Resolve meter type label from API meter record. */
export function resolveMeterTypeLabel(meter: ApplicationMeterApiResponse): string {
  const typeName = meter.meter_type_name ?? meter.meter_type ?? "";
  if (typeName) {
    const lower = typeName.toLowerCase();
    if (lower.includes("gas")) return "Gas";
    if (lower.includes("electric")) return "Electricity";
    return typeName;
  }
  if (meter.meter_type_id === 2) return "Gas";
  if (meter.meter_type_id === 1) return "Electricity";
  return "Electricity";
}

function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB");
  } catch {
    return dateString;
  }
}

function formatTermDisplay(termMonths: number | null | undefined): string {
  if (termMonths == null || termMonths <= 0) return "N/A";
  return `${termMonths} months`;
}

function pickRateValue(
  soldValue: string | null | undefined,
  quoteValue: string
): string {
  if (soldValue && soldValue !== "0.00" && soldValue !== "0") {
    return soldValue;
  }
  return quoteValue || "N/A";
}

/** Map GET /meter/{id}/ response to contract details for the View modal. */
export function mapMeterApiToContractDetails(
  data: ApplicationMeterApiResponse
): ContractDetails {
  const quoteFields = extractQuoteFields(data);
  const quoteRates = extractRatesFromQuoteFields(quoteFields, data.aq);

  return {
    contractCommission: "N/A",
    startDate: quoteFields.Contract_Start_Date
      ? formatDateForDisplay(quoteFields.Contract_Start_Date)
      : "N/A",
    soldSupplier: data.latestsoldsuppliername || "N/A",
    tariff: data.latesttariffname || "N/A",
    term: formatTermDisplay(data.latestterm),
    units: quoteRates.dayKwh ? `${quoteRates.dayKwh} kWh` : "kWh",
    uplifts: "N/A",
    rates: {
      standingCharge: pickRateValue(
        data.latestSoldStandingCharge,
        quoteRates.currentStandingCharge
      ),
      dayRate: pickRateValue(data.latestSoldDayRate, quoteRates.dayRate),
      ...(data.latestSoldNightRate
        ? { nightRate: data.latestSoldNightRate }
        : quoteRates.nightRate
          ? { nightRate: quoteRates.nightRate }
          : {}),
      ...(data.latestSoldEveningWeekendRate
        ? { eveningWeekendRate: data.latestSoldEveningWeekendRate }
        : quoteRates.ewRate
          ? { eveningWeekendRate: quoteRates.ewRate }
          : {}),
      ...(data.latestSoldWinterRate
        ? { winterRate: data.latestSoldWinterRate }
        : quoteRates.winterRate
          ? { winterRate: quoteRates.winterRate }
          : {}),
    },
    savings: "N/A",
    yearlyCost: "N/A",
    soldDate: data.updated_at
      ? formatDateForDisplay(data.updated_at)
      : "N/A",
    contractType: resolveMeterTypeLabel(data),
    submitted: coerceMeterBoolean(data.latest_isprocessed) ? "Yes" : "No",
    isProcessed: coerceMeterBoolean(data.latest_isprocessed) ? "Yes" : "No",
  };
}

/** Map company-list meter row to contract details (fallback without GET /meter). */
export function mapMeterListItemToContractDetails(meter: Meter): ContractDetails {
  return {
    contractCommission: "N/A",
    startDate: "N/A",
    soldSupplier: meter.latestsoldsuppliername || "N/A",
    tariff: meter.latesttariffname || "N/A",
    term: formatTermDisplay(meter.latestterm),
    units: "kWh",
    uplifts: "N/A",
    rates: {
      standingCharge: meter.latestSoldStandingCharge || "N/A",
      dayRate: meter.latestSoldDayRate || "N/A",
      ...(meter.latestSoldNightRate
        ? { nightRate: meter.latestSoldNightRate }
        : {}),
      ...(meter.latestSoldEveningWeekendRate
        ? { eveningWeekendRate: meter.latestSoldEveningWeekendRate }
        : {}),
      ...(meter.latestSoldWinterRate ? { winterRate: meter.latestSoldWinterRate } : {}),
    },
    savings: "N/A",
    yearlyCost: "N/A",
    soldDate: meter.updated_at
      ? formatDateForDisplay(meter.updated_at)
      : "N/A",
    contractType:
      meter.meter_type_id === 2
        ? "Gas"
        : meter.meter_type_id === 1
          ? "Electricity"
          : meter.meter_type_name || "Electricity",
    submitted: coerceMeterBoolean(meter.latest_isprocessed) ? "Yes" : "No",
    isProcessed: coerceMeterBoolean(meter.latest_isprocessed) ? "Yes" : "No",
  };
}

/** Reverse of bottomline = mpanBottomValues.slice(1).join("") */
function bottomlineToBottomRow(region: string, bottomline: string): string[] {
  return [
    region,
    bottomline.slice(0, 4).padEnd(4, "0"),
    bottomline.slice(4, 8).padEnd(4, "0"),
    bottomline.slice(8, 11).padEnd(3, "0"),
  ];
}

function isGasMeter(data: ApplicationMeterApiResponse): boolean {
  const typeLabel = (
    data.meter_type_name ??
    data.meter_type ??
    ""
  ).toLowerCase();

  if (typeLabel.includes("gas")) return true;
  if (typeLabel.includes("electric")) return false;
  if (data.meter_type_id === 2) return true;
  if (data.meter_type_id === 1) return false;

  if (data.mpan_mrpn_details?.is_mrpn && !data.mpan_mrpn_details?.is_mpan) {
    return true;
  }

  return false;
}

/** Map GET /api/v1/auth/web/core/meter/{id}/ response to quote form values. */
export function mapMeterApiToQuoteFormValues(
  data: ApplicationMeterApiResponse
): MeterQuoteFormValues {
  const quoteFields = extractQuoteFields(data);
  const rates = extractRatesFromQuoteFields(quoteFields, data.aq);

  const baseValues: MeterQuoteFormValues = {
    postcode: quoteFields.postcode ?? "",
    supplierId: quoteFields.Supplier,
    contractStartDate: formatDateForInput(quoteFields.Contract_Start_Date ?? ""),
    numberOfDays: quoteFields.Number_of_Days?.toString() ?? "365",
    ...rates,
  };

  if (isGasMeter(data)) {
    return {
      ...baseValues,
      mprn:
        quoteFields.bottomline ||
        data.meter_reference ||
        data.mpan_mrpn_details?.bottomline ||
        "",
    };
  }

  if (
    hasValue(quoteFields.profileclass) &&
    hasValue(quoteFields.MTC) &&
    hasValue(quoteFields.LLF) &&
    hasValue(quoteFields.Region) &&
    hasValue(quoteFields.bottomline)
  ) {
    return {
      ...baseValues,
      mpanTopValues: [
        quoteFields.profileclass,
        quoteFields.MTC,
        quoteFields.LLF,
      ],
      mpanBottomValues: bottomlineToBottomRow(
        quoteFields.Region,
        quoteFields.bottomline
      ),
    };
  }

  const displayReference = buildMeterReferenceForDisplay(data);
  return {
    ...baseValues,
    mpanTopValues: displayReference.topRow,
    mpanBottomValues: displayReference.bottomRow,
  };
}
