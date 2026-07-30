"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addYears, format, parse, subDays } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDropdown } from "@/lib/actions/getDropdown";
import { patchMethod } from "@/lib/actions/patchMethod";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { CustomSelect, type SelectOption } from "@/ui/select";

type ExportContractContactDetails = {
  id?: string;
  submitted_by?: string | null;
  aq_eac?: string | number | null;
  mpan_mrpn_text?: string | null;
  bottom_line?: string | null;
  cl?: string | number | null;
  /** API may return a slug string, numeric id, or nested object depending on serializer. */
  lead_status?: string | number | { id?: number; name?: string } | null;
  /** When the API exposes the FK directly (preferred for timeline updates). */
  lead_status_id?: number | null;
  live_date?: string | null;
  reminder_date?: string | null;
  window_open?: string | null;
  con_end_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  company?: {
    id?: string | number;
    company_name?: string | null;
    current_postcode?: string | null;
    sold_supplier_name?: string | null;
    contract_type?: string | null;
    current_address_line1?: string | null;
    current_address_line2?: string | null;
    current_address_line3?: string | null;
    current_address_line4?: string | null;
  } | null;
};

const toDisplayString = (value: unknown): string => {
  if (value == null) return "N/A";
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : "N/A";
  }
  return "N/A";
};

/**
 * Same string format as the Live date `<input type="date" />` value (`yyyy-MM-dd`).
 */
const formatDateLikeLiveDateInput = (date: Date): string =>
  format(date, "yyyy-MM-dd");

/**
 * Read-only schedule fields: use `muted` so they sit on `bg-card` like nested inputs,
 * not `bg-background` (page), which caused pure black boxes on light cards in dark mode.
 */
const readonlyScheduleInputClassName =
  "cursor-default border-border bg-white text-gray-700 dark:text-gray-400 shadow-sm focus-visible:border-border focus-visible:ring-0";

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const buildAddress = (
  company: ExportContractContactDetails["company"],
): string => {
  if (!company) return "N/A";
  const addressParts = [
    company.current_address_line1,
    company.current_address_line2,
    company.current_address_line3,
    company.current_address_line4,
    company.current_postcode,
  ]
    .map((item) => (item ?? "").trim())
    .filter((item) => item.length > 0);

  return addressParts.length > 0 ? addressParts.join(", ") : "N/A";
};

// Match `ApplicationDetails` text palette, with dark-mode equivalents for contrast.
const detailLabelClassName =
  "text-sm font-medium text-gray-500 dark:text-gray-400";
const detailValueClassName =
  "font-semibold text-gray-900 dark:text-gray-500";

const LEAD_STATUS_LIST_ENDPOINT = "/api/v1/auth/web/core/lead-status/";

const UPDATE_LEAD_STATUS_AND_CONTRACT_TIMELINE_ENDPOINT =
  "/api/v1/auth/web/core/update-lead-status-and-contract-timeline/";

type LeadStatusListItem = {
  id: number;
  name: string;
};

/**
 * Normalize a label or string (e.g. "Work in progress") for comparison with API `name`.
 */
const normalizeExportContractLeadStatusKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Parses paginated lead-status list from GET `/api/v1/auth/web/core/lead-status/`
 * (`getDropdown` returns the inner `data` object with `results`).
 */
function parseLeadStatusListFromDropdownData(data: unknown): LeadStatusListItem[] {
  if (data == null || typeof data !== "object") return [];
  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  const out: LeadStatusListItem[] = [];
  for (const row of results) {
    if (
      row !== null &&
      typeof row === "object" &&
      typeof (row as { id?: unknown }).id === "number" &&
      typeof (row as { name?: unknown }).name === "string"
    ) {
      out.push({ id: (row as { id: number }).id, name: (row as { name: string }).name });
    }
  }
  return out;
}

/**
 * `CustomSelect` value for the contact's current lead status: API id as string when possible.
 */
function resolveContactLeadStatusSelectValue(
  details: ExportContractContactDetails | null,
  apiItems: LeadStatusListItem[],
): string {
  if (!details) return "";

  if (
    typeof details.lead_status_id === "number" &&
    !Number.isNaN(details.lead_status_id)
  ) {
    return String(details.lead_status_id);
  }

  const raw = details.lead_status;
  if (typeof raw === "object" && raw !== null && typeof raw.id === "number") {
    return String(raw.id);
  }
  if (typeof raw === "number" && !Number.isNaN(raw)) {
    return String(raw);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^\d+$/.test(trimmed)) return trimmed;
    const key = normalizeExportContractLeadStatusKey(trimmed);
    const match = apiItems.find(
      (item) => normalizeExportContractLeadStatusKey(item.name) === key,
    );
    if (match) return String(match.id);
  }

  return "";
}

function orphanLeadStatusOptionLabel(details: ExportContractContactDetails): string {
  const raw = details.lead_status;
  if (typeof raw === "object" && raw !== null && raw.name != null) {
    return String(raw.name).trim() || "Unknown lead status";
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const s = String(raw).trim();
    return s.length > 0 ? s : "Unknown lead status";
  }
  return "Unknown lead status";
}

/** True when the selected lead status row is Live (by API list id or contact fallback). */
function isLiveLeadStatus(
  leadStatusIdSelectValue: string,
  apiItems: LeadStatusListItem[],
  details?: ExportContractContactDetails | null,
): boolean {
  const id = leadStatusIdSelectValue.trim();
  if (!id) return false;

  const fromList = apiItems.find((item) => String(item.id) === id);
  if (fromList) {
    return normalizeExportContractLeadStatusKey(fromList.name) === "live";
  }

  if (details && resolveContactLeadStatusSelectValue(details, apiItems) === id) {
    const raw = details.lead_status;
    if (typeof raw === "object" && raw !== null && raw.name != null) {
      return normalizeExportContractLeadStatusKey(String(raw.name)) === "live";
    }
    if (typeof raw === "string") {
      return normalizeExportContractLeadStatusKey(raw) === "live";
    }
  }

  return false;
}

type UpdateLeadStatusAndContractTimelinePayload = {
  company_id: string;
  lead_status_id: number;
  live_date?: string;
  reminder_date: string;
  window_open: string;
  end_date: string;
};

type DerivedScheduleDates = {
  contractEndingDate: Date;
  reminderDate: Date;
  windowOpenDate: Date;
};

/** Compute contract end / reminder / window open from a live date picker value. */
function computeDerivedScheduleDatesFromLiveDate(
  liveDateValue: string,
): DerivedScheduleDates | null {
  if (!liveDateValue.trim()) return null;
  const liveDate = parse(liveDateValue, "yyyy-MM-dd", new Date());
  if (Number.isNaN(liveDate.getTime())) return null;

  const contractEndingDate = addYears(liveDate, 1);
  return {
    contractEndingDate,
    reminderDate: subDays(contractEndingDate, 180),
    windowOpenDate: subDays(contractEndingDate, 120),
  };
}

/**
 * Normalizes API datetime or date-only strings to `yyyy-MM-dd` for timeline payloads.
 */
const toYyyyMmDd = (value: string | null | undefined): string => {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const parsed = new Date(
    trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`,
  );
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, "yyyy-MM-dd");
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return "";
};

/**
 * Builds the PATCH body for `update-lead-status-and-contract-timeline`.
 * `live_date` is included only when the selected lead status is Live.
 */
function buildUpdateLeadStatusAndContractTimelinePayload(
  details: ExportContractContactDetails,
  leadStatusIdSelectValue: string,
  publishDate: string,
  derivedScheduleDates: DerivedScheduleDates | null,
  leadStatusListItems: LeadStatusListItem[],
): UpdateLeadStatusAndContractTimelinePayload | null {
  const companyIdRaw = details.company?.id;
  if (
    companyIdRaw === undefined ||
    companyIdRaw === null ||
    String(companyIdRaw).trim() === ""
  ) {
    return null;
  }

  const leadStatusId = Number.parseInt(leadStatusIdSelectValue, 10);
  if (Number.isNaN(leadStatusId)) {
    return null;
  }

  const isLiveStatus = isLiveLeadStatus(
    leadStatusIdSelectValue,
    leadStatusListItems,
    details,
  );

  const trimmedLivePicker = publishDate.trim();
  let reminder_date = "";
  let window_open = "";
  let end_date = "";

  if (isLiveStatus && trimmedLivePicker && derivedScheduleDates) {
    reminder_date = formatDateLikeLiveDateInput(derivedScheduleDates.reminderDate);
    window_open = formatDateLikeLiveDateInput(derivedScheduleDates.windowOpenDate);
    end_date = formatDateLikeLiveDateInput(derivedScheduleDates.contractEndingDate);
  } else {
    reminder_date = toYyyyMmDd(details.reminder_date);
    window_open = toYyyyMmDd(details.window_open);
    end_date = toYyyyMmDd(details.con_end_date);
  }

  const payload: UpdateLeadStatusAndContractTimelinePayload = {
    company_id: String(companyIdRaw),
    lead_status_id: leadStatusId,
    reminder_date,
    window_open,
    end_date,
  };

  if (isLiveStatus) {
    const live_date =
      trimmedLivePicker || toYyyyMmDd(details.live_date);
    if (live_date) {
      payload.live_date = live_date;
    }
  }

  return payload;
}

const ExportContractDetails = ({ id }: { id: string }) => {
  const router = useRouter();
  const [details, setDetails] = useState<ExportContractContactDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const [publishDate, setPublishDate] = useState<string>("");
  /** Live status chosen in the dropdown before a live date is picked and saved. */
  const [pendingLeadStatusId, setPendingLeadStatusId] = useState<string | null>(
    null,
  );
  const [isUpdatingLeadStatus, setIsUpdatingLeadStatus] = useState(false);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);

  const [leadStatusListItems, setLeadStatusListItems] = useState<
    LeadStatusListItem[]
  >([]);
  const [isLoadingLeadStatuses, setIsLoadingLeadStatuses] = useState(true);

  useEffect(() => {
    setPendingLeadStatusId(null);
    setPublishDate("");
  }, [id]);

  useEffect(() => {
    if (!details || pendingLeadStatusId) return;

    const statusValue = resolveContactLeadStatusSelectValue(
      details,
      leadStatusListItems,
    );

    if (isLiveLeadStatus(statusValue, leadStatusListItems, details)) {
      const normalizedLive = toYyyyMmDd(details.live_date);
      if (normalizedLive) {
        setPublishDate(normalizedLive);
      }
      return;
    }

    setPublishDate("");
  }, [details, leadStatusListItems, pendingLeadStatusId]);

  const fetchLeadStatuses = useCallback(async () => {
    try {
      setIsLoadingLeadStatuses(true);
      const response = await getDropdown(LEAD_STATUS_LIST_ENDPOINT);

      if (!response.success) {
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
          return;
        }
        toast.error(response.message || "Failed to load lead statuses");
        setLeadStatusListItems([]);
        return;
      }

      const rows = parseLeadStatusListFromDropdownData(response.data);
      setLeadStatusListItems(rows);
    } catch (error) {
      console.error("Error fetching lead statuses:", error);
      toast.error("An error occurred while loading lead statuses");
      setLeadStatusListItems([]);
    } finally {
      setIsLoadingLeadStatuses(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchLeadStatuses();
  }, [fetchLeadStatuses]);

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getDropdown(`/api/v1/auth/web/core/contact/${id}/`);

      if (!response.success) {
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
          return;
        }

        toast.error(response.message || "Failed to fetch export contract details");
        setDetails(null);
        return;
      }

      const payload = response.data as ExportContractContactDetails | undefined;
      setDetails(payload ?? null);
    } catch (error) {
      console.error("Error fetching export contract details:", error);
      toast.error("An error occurred while fetching export contract details");
      setDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    fetchDetails();
  }, [id, fetchDetails]);

  const currentLeadStatusValue = useMemo(
    () => resolveContactLeadStatusSelectValue(details, leadStatusListItems),
    [details, leadStatusListItems],
  );

  /** Shown in the dropdown: pending Live selection or saved server value. */
  const activeLeadStatusId = pendingLeadStatusId ?? currentLeadStatusValue;

  const isLiveFlowActive = useMemo(
    () =>
      isLiveLeadStatus(activeLeadStatusId, leadStatusListItems, details),
    [activeLeadStatusId, leadStatusListItems, details],
  );

  /**
   * Options from GET lead-status; if the contact's id is not in the list (deprecated row),
   * prepend a synthetic option so the select still shows the server value.
   */
  const leadStatusSelectOptions = useMemo((): SelectOption[] => {
    const base: SelectOption[] = leadStatusListItems.map((row) => ({
      value: String(row.id),
      label: row.name,
    }));

    if (!details || !activeLeadStatusId) return base;
    if (base.some((option) => option.value === activeLeadStatusId)) {
      return base;
    }

    return [
      {
        value: activeLeadStatusId,
        label: orphanLeadStatusOptionLabel(details),
      },
      ...base,
    ];
  }, [activeLeadStatusId, details, leadStatusListItems]);

  const selectedLeadStatusOption = useMemo(() => {
    if (!activeLeadStatusId) return undefined;
    return leadStatusSelectOptions.find(
      (option) => option.value === activeLeadStatusId,
    );
  }, [activeLeadStatusId, leadStatusSelectOptions]);

  /**
   * When Live date is set: contract end is placeholder (+1 year from live); reminder and window open
   * are N days before contract end (renewal-style schedule). Used for preview and timeline PATCH payload.
   */
  const derivedScheduleDates = useMemo((): DerivedScheduleDates | null => {
    if (!isLiveFlowActive) return null;
    return computeDerivedScheduleDatesFromLiveDate(publishDate);
  }, [isLiveFlowActive, publishDate]);

  type LeadStatusPatchOverrides = {
    publishDate?: string;
    derivedScheduleDates?: DerivedScheduleDates | null;
  };

  const patchLeadStatusAndContractTimeline = useCallback(
    async (
      leadStatusIdSelectValue: string,
      overrides?: LeadStatusPatchOverrides,
    ): Promise<{ ok: true } | { ok: false; message?: string }> => {
      if (!details) {
        return { ok: false, message: "Contact details are not loaded yet." };
      }

      const liveDateForPayload = overrides?.publishDate ?? publishDate;
      const derivedForPayload =
        overrides?.derivedScheduleDates ??
        computeDerivedScheduleDatesFromLiveDate(liveDateForPayload);

      const payload = buildUpdateLeadStatusAndContractTimelinePayload(
        details,
        leadStatusIdSelectValue,
        liveDateForPayload,
        derivedForPayload,
        leadStatusListItems,
      );

      if (!payload) {
        return {
          ok: false,
          message:
            "Missing company on this contact, or invalid lead status id. Choose a lead status from the list.",
        };
      }

      const response = await patchMethod(
        payload,
        UPDATE_LEAD_STATUS_AND_CONTRACT_TIMELINE_ENDPOINT,
      );

      if (response.success) {
        return { ok: true };
      }

      if (
        response.errors &&
        typeof response.errors === "object" &&
        "authError" in response.errors
      ) {
        return { ok: false, message: "AUTH" };
      }

      return {
        ok: false,
        message: response.message || "Request failed",
      };
    },
    [details, publishDate, leadStatusListItems],
  );

  const handleLeadStatusChange = useCallback(
    async (option: SelectOption | null) => {
      if (!option?.value || !id || !details) return;
      if (option.value === activeLeadStatusId) return;

      const selectingLive = isLiveLeadStatus(
        option.value,
        leadStatusListItems,
        details,
      );

      if (selectingLive) {
        setPendingLeadStatusId(option.value);
        setPublishDate("");
        return;
      }

      setPendingLeadStatusId(null);
      setPublishDate("");

      try {
        setIsUpdatingLeadStatus(true);
        const result = await patchLeadStatusAndContractTimeline(option.value);

        if (result.ok) {
          toast.success("Lead status updated.");
          await fetchDetails();
          return;
        }

        if (result.message === "AUTH") {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
          return;
        }

        toast.error(result.message || "Failed to update lead status.");
      } catch (error) {
        console.error("Error updating lead status:", error);
        toast.error("An error occurred while updating lead status.");
      } finally {
        setIsUpdatingLeadStatus(false);
      }
    },
    [
      activeLeadStatusId,
      details,
      fetchDetails,
      id,
      leadStatusListItems,
      patchLeadStatusAndContractTimeline,
      router,
    ],
  );

  const handleSaveContractTimeline = useCallback(async () => {
    if (!details?.id || !details?.company?.id) {
      toast.error("Missing contact or company for this update.");
      return;
    }

    const leadStatusId = pendingLeadStatusId ?? currentLeadStatusValue;
    if (!leadStatusId) {
      toast.error("Select a lead status before saving the timeline.");
      return;
    }

    if (!publishDate.trim()) {
      toast.error("Select a live date before saving.");
      return;
    }

    const derived = computeDerivedScheduleDatesFromLiveDate(publishDate);
    if (!derived) {
      toast.error("Invalid live date.");
      return;
    }

    try {
      setIsSavingTimeline(true);
      const result = await patchLeadStatusAndContractTimeline(leadStatusId, {
        publishDate,
        derivedScheduleDates: derived,
      });

      if (result.ok) {
        toast.success("Lead status and contract timeline updated.");
        setPendingLeadStatusId(null);
        await fetchDetails();
        return;
      }

      if (result.message === "AUTH") {
        toast.error("Token expired. Authentication required.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/login");
        return;
      }

      toast.error(result.message || "Failed to save contract timeline.");
    } catch (error) {
      console.error("Error saving contract timeline:", error);
      toast.error("An error occurred while saving the contract timeline.");
    } finally {
      setIsSavingTimeline(false);
    }
  }, [
    currentLeadStatusValue,
    details?.company?.id,
    details?.id,
    fetchDetails,
    patchLeadStatusAndContractTimeline,
    pendingLeadStatusId,
    publishDate,
    router,
  ]);

  const contractReference = useMemo(() => {
    if (!details?.id) return "N/A";
    const shortId = details.id.split("-")[0];
    return shortId || details.id;
  }, [details?.id]);

  const publishDateLabel = useMemo(() => {
    if (!publishDate) return "No date selected";
    const parsed = new Date(`${publishDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [publishDate]);

  if (isLoading) {
    return (
      <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading export contract details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-gray-400">
            Export Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={detailLabelClassName}>Contract ID</p>
            <p className={detailValueClassName}>{contractReference}</p>
          </div>
          <div>
            <p className={detailLabelClassName}>Full Contact ID</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.id)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Submitted By</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.submitted_by)}
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="export-contract-lead-status">Lead status</Label>
              <CustomSelect
                inputId="export-contract-lead-status"
                options={leadStatusSelectOptions}
                value={selectedLeadStatusOption}
                onChange={(next) => {
                  void handleLeadStatusChange(next);
                }}
                placeholder="Select lead status"
                isLoading={isUpdatingLeadStatus || isLoadingLeadStatuses}
                isDisabled={
                  isUpdatingLeadStatus ||
                  isSavingTimeline ||
                  isLoadingLeadStatuses ||
                  leadStatusSelectOptions.length === 0 ||
                  !details?.id ||
                  !details?.company?.id
                }
                className="min-w-[200px] w-full max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                Non-live statuses save immediately. Live requires a live date
                before saving.
              </p>
            </div>
            {isLiveFlowActive && (
            <div className="space-y-3">
              <Label htmlFor="publish-date">Live Date</Label>
              <Input
                id="publish-date"
                type="date"
                value={publishDate}
                onChange={(event) => setPublishDate(event.target.value)}
                disabled={isSavingTimeline || isUpdatingLeadStatus}
                className="w-full max-w-sm"
              />
              <p className={detailLabelClassName}>
                Selected:{" "}
                <span className={detailValueClassName}>{publishDateLabel}</span>
              </p>
              {publishDate && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full max-w-sm"
                  disabled={
                    isSavingTimeline ||
                    isUpdatingLeadStatus ||
                    !details?.company?.id ||
                    !activeLeadStatusId ||
                    leadStatusSelectOptions.length === 0
                  }
                  onClick={() => {
                    void handleSaveContractTimeline();
                  }}
                >
                  {isSavingTimeline ? "Saving…" : "Save contract timeline"}
                </Button>
              )}
              {pendingLeadStatusId && !publishDate && (
                <p className="text-xs text-muted-foreground">
                  Select a live date, then save to apply the Live status and
                  contract timeline.
                </p>
              )}
            </div>
            )}
          </div>
          {isLiveFlowActive && derivedScheduleDates && (
            <div className="space-y-3 md:col-span-2 pt-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
                Contract timeline (from live date)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="schedule-contract-ending">
                    Contract end date
                  </Label>
                  <Input
                    id="schedule-contract-ending"
                    readOnly
                    tabIndex={-1}
                    value={formatDateLikeLiveDateInput(
                      derivedScheduleDates.contractEndingDate,
                    )}
                    className={readonlyScheduleInputClassName}
                    aria-describedby="schedule-contract-ending-hint"
                  />
                  <p
                    id="schedule-contract-ending-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Placeholder: 1 year after live date (replace with API value
                    when available).
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="schedule-reminder">Reminder date</Label>
                  <Input
                    id="schedule-reminder"
                    readOnly
                    tabIndex={-1}
                    value={formatDateLikeLiveDateInput(
                      derivedScheduleDates.reminderDate,
                    )}
                    className={readonlyScheduleInputClassName}
                  />
                  <p className="text-xs text-muted-foreground">
                    180 days before contract ending date.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="schedule-window-open">Window open date</Label>
                  <Input
                    id="schedule-window-open"
                    readOnly
                    tabIndex={-1}
                    value={formatDateLikeLiveDateInput(
                      derivedScheduleDates.windowOpenDate,
                    )}
                    className={readonlyScheduleInputClassName}
                  />
                  <p className="text-xs text-muted-foreground">
                    120 days before contract ending date.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div>
            <p className={detailLabelClassName}>AQ/EAC</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.aq_eac)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>CL</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.cl)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>MPAN/MPRN</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.bottom_line)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Contract End Date</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.con_end_date)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Reminder Date</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.reminder_date)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Window Open</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.window_open)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Created At</p>
            <p className={detailValueClassName}>
              {formatDateTime(details?.created_at)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Updated At</p>
            <p className={detailValueClassName}>
              {formatDateTime(details?.updated_at)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-gray-400">
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={detailLabelClassName}>Company Name</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.company?.company_name)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Company ID</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.company?.id)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Supplier</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.company?.sold_supplier_name)}
            </p>
          </div>
          <div>
            <p className={detailLabelClassName}>Contract Type</p>
            <p className={detailValueClassName}>
              {toDisplayString(details?.company?.contract_type)}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={detailLabelClassName}>Address</p>
            <p className={detailValueClassName}>
              {buildAddress(details?.company)}
            </p>
          </div>
        </CardContent>
      </Card>

    </section>
  );
};

export default ExportContractDetails;
