"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  InfoButton,
} from "@/ui/table";
import { Card, CardContent } from "@/ui/card";
import Pagination from "@/ui/pagination";
import TableHeaderComponent from "@/components/TableHeader";
import { useMultipleTableHeaders } from "@/hooks/useTableHeaderState";
import { getGroupedInvoices } from "@/lib/auth";
import { handleAuthError } from "@/lib/auth";
import { postMethod } from "@/lib/actions/postMethod";
import { formatDate } from "@/composable/getFormatedDate";
import { toast } from "sonner";
import { Invoice } from "@/lib/types";
import { type TableFilters } from "@/composable/getTableData";
import DateRangePicker from "@/ui/dateRangePicker";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Checkbox } from "@/ui/checkbox";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { getDropdown } from "@/lib/actions/getDropdown";
import { getBottomlineFromCompanyDetail } from "@/composable/getBottomlineFromCompanyDetail";

/** Single invoice nested under a grouped list row from `invoice-grouped`. */
interface GroupedInvoiceNestedRecord {
  id?: string;
  invoice_datetime?: string;
  is_minus?: boolean;
}

interface GroupedInvoiceApiRecord {
  company_id: string;
  company_name?: string;
  latest_invoice_datetime?: string;
  invoice_count?: number;
  sum_total?: string;
  is_minus?: boolean;
  invoices?: GroupedInvoiceNestedRecord[];
}

/** Normalizes API boolean values (boolean, 0/1, or string). */
const parseIsMinusFlag = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const readIsMinusFromRecord = (record: Record<string, unknown>): boolean | undefined => {
  if ("is_minus" in record) return parseIsMinusFlag(record.is_minus);
  if ("Is_minus" in record) return parseIsMinusFlag(record.Is_minus);
  return undefined;
};

/** Resolves `is_minus` from the grouped row or any nested `invoices` item. */
const resolveIsMinusFromGroupedRecord = (
  groupedInvoice: GroupedInvoiceApiRecord
): boolean => {
  const topLevelIsMinus = readIsMinusFromRecord(
    groupedInvoice as unknown as Record<string, unknown>
  );
  if (topLevelIsMinus !== undefined) {
    return topLevelIsMinus;
  }

  const nestedInvoices = groupedInvoice.invoices;
  if (!Array.isArray(nestedInvoices) || nestedInvoices.length === 0) {
    return false;
  }

  return nestedInvoices.some(
    (invoice) =>
      readIsMinusFromRecord(invoice as unknown as Record<string, unknown>) === true
  );
};

/** Unwraps paginated list payloads that may be single- or double-nested under `data`. */
const resolvePaginatedListPayload = (
  payload: unknown
): { results: GroupedInvoiceApiRecord[]; count: number } => {
  const emptyPayload = { results: [] as GroupedInvoiceApiRecord[], count: 0 };

  if (!payload || typeof payload !== "object") {
    return emptyPayload;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const nestedPayload =
    payloadRecord.data &&
    typeof payloadRecord.data === "object" &&
    !Array.isArray(payloadRecord.data)
      ? (payloadRecord.data as Record<string, unknown>)
      : payloadRecord;

  const results = Array.isArray(nestedPayload.results)
    ? (nestedPayload.results as GroupedInvoiceApiRecord[])
    : [];
  const count =
    typeof nestedPayload.count === "number" ? nestedPayload.count : results.length;

  return { results, count };
};

interface AgentApiRecord {
  id?: number | string;
  name?: string;
}

interface CompanyApiRecord {
  id?: number | string;
  company_name?: string;
  /** Company list API nests MPAN bottomline under sites → meters → mpan_mrpn_details. */
  sites?: unknown;
  company_detail?: unknown;
}

/** One row for POST /api/v1/auth/web/core/invoice-multiple-add/ (array body). */
interface InvoiceMultipleAddApiItem {
  company_id: string;
  user_id: number;
  is_active: boolean;
  invoice_datetime: string;
  total_received: string;
  office: string;
  agent: string;
  vat: string;
  total: string;
  reference: string;
  notes: string;
  Is_there_any_clawback_from_previous_week: boolean;
  clawback_amount: string;
  is_minus: boolean;
  month: string;
  year: number;
  week: string;
}

/** API enum values for commission invoice period (`invoice-multiple-add`). */
type CommissionMonthApiValue =
  | "JANUARY"
  | "FEBRUARY"
  | "MARCH"
  | "APRIL"
  | "MAY"
  | "JUNE"
  | "JULY"
  | "AUGUST"
  | "SEPTEMBER"
  | "OCTOBER"
  | "NOVEMBER"
  | "DECEMBER";

type CommissionWeekApiValue = "WEEK_1" | "WEEK_2" | "WEEK_3" | "WEEK_4";

const COMMISSION_MONTH_API_VALUES: CommissionMonthApiValue[] = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const COMMISSION_MONTH_OPTIONS: { value: CommissionMonthApiValue; label: string }[] = [
  { value: "JANUARY", label: "January" },
  { value: "FEBRUARY", label: "February" },
  { value: "MARCH", label: "March" },
  { value: "APRIL", label: "April" },
  { value: "MAY", label: "May" },
  { value: "JUNE", label: "June" },
  { value: "JULY", label: "July" },
  { value: "AUGUST", label: "August" },
  { value: "SEPTEMBER", label: "September" },
  { value: "OCTOBER", label: "October" },
  { value: "NOVEMBER", label: "November" },
  { value: "DECEMBER", label: "December" },
];

const COMMISSION_WEEK_OPTIONS: { value: CommissionWeekApiValue; label: string }[] = [
  { value: "WEEK_1", label: "Week 1" },
  { value: "WEEK_2", label: "Week 2" },
  { value: "WEEK_3", label: "Week 3" },
  { value: "WEEK_4", label: "Week 4" },
];

const COMMISSION_PERIOD_SELECT_CLASSNAME =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

const getCurrentCommissionMonthValue = (): CommissionMonthApiValue =>
  COMMISSION_MONTH_API_VALUES[new Date().getMonth()];

const getCurrentCommissionWeekValue = (): CommissionWeekApiValue => {
  const weekIndex = Math.min(Math.ceil(new Date().getDate() / 7), 4) - 1;
  return COMMISSION_WEEK_OPTIONS[weekIndex].value;
};

const getCurrentCommissionYear = (): number => new Date().getFullYear();

const INVOICE_MULTIPLE_ADD_ENDPOINT = "/api/v1/auth/web/core/invoice-multiple-add/";

/** Monetary fields are sent as decimal strings to match the core invoice API. */
function formatAmountForInvoiceApi(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "0.00";
  }
  return amount.toFixed(2);
}

interface CommissionSectionState {
  sectionId: string;
  selectedAgentOption: SelectOption | null;
  selectedMpanMprnOption: SelectOption | null;
  totalReceived: string;
  reference: string;
  notes: string;
  includeVatInTotal: boolean;
  /** When true, `clawbackAmount` reduces the commission total and submitted invoice total. */
  hasPreviousWeekClawback: boolean;
  clawbackAmount: string;
  /** When true, amounts are treated as a negative calculation (`is_minus` on the API). */
  isMinus: boolean;
  selectedMonth: CommissionMonthApiValue;
  selectedWeek: CommissionWeekApiValue;
}

/** Fixed split of `total_received`: office 15%, agent 85%. VAT applies to agent amount. */
const COMMISSION_OFFICE_PCT = 15;
const COMMISSION_AGENT_PCT = 85;
const COMMISSION_VAT_PCT = 20;
const COMMISSION_DROPDOWN_PAGE_SIZE = 20;
const COMMISSION_DROPDOWN_SEARCH_DEBOUNCE_MS = 500;

const createCommissionSectionState = (): CommissionSectionState => ({
  sectionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  selectedAgentOption: null,
  selectedMpanMprnOption: null,
  totalReceived: "",
  reference: "",
  notes: "",
  includeVatInTotal: true,
  hasPreviousWeekClawback: false,
  clawbackAmount: "",
  isMinus: false,
  selectedMonth: getCurrentCommissionMonthValue(),
  selectedWeek: getCurrentCommissionWeekValue(),
});

const formatMoneyGb = (value: number): string =>
  value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const InvoiceTable = () => {
  console.log("🏢 InvoiceTable component rendered");

  // State for table data and pagination
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    businessName: "",
  });
  const [commissionSections, setCommissionSections] = useState<CommissionSectionState[]>([
    createCommissionSectionState(),
  ]);
  const [isCommissionSectionVisible, setIsCommissionSectionVisible] = useState(false);
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([]);
  const [isAgentOptionsLoading, setIsAgentOptionsLoading] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [agentCurrentPage, setAgentCurrentPage] = useState(1);
  const [hasMoreAgentOptions, setHasMoreAgentOptions] = useState(false);
  const [mpanMprnOptions, setMpanMprnOptions] = useState<SelectOption[]>([]);
  const [isMpanMprnOptionsLoading, setIsMpanMprnOptionsLoading] = useState(false);
  const [mpanMprnSearchTerm, setMpanMprnSearchTerm] = useState("");
  const [mpanMprnCurrentPage, setMpanMprnCurrentPage] = useState(1);
  const [hasMoreMpanMprnOptions, setHasMoreMpanMprnOptions] = useState(false);
  const agentSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const mpanMprnSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmittingCommissionInvoices, setIsSubmittingCommissionInvoices] = useState(false);

  // State for formatted dates
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  // Get current state for this specific table instance
  const currentState = getInstanceState("invoice-table");

  const mapGroupedInvoiceToTableInvoice = (
    groupedInvoice: GroupedInvoiceApiRecord
  ): Invoice => {
    return {
      // Use company_id as row identifier so details page can load all invoices for a company.
      id: groupedInvoice.company_id,
      exported_on_date: groupedInvoice.latest_invoice_datetime,
      invoice_number: groupedInvoice.company_id,
      company_name: groupedInvoice.company_name,
      contract_count: groupedInvoice.invoice_count,
      net_payment_due: groupedInvoice.sum_total,
      is_minus: resolveIsMinusFromGroupedRecord(groupedInvoice),
    };
  };

  // Fetch invoices data from API
  const fetchInvoices = useCallback(
    async (
      page: number = 1,
      search: string = "",
      additionalFilters: TableFilters = {}
    ) => {
      console.log("🔄 fetchInvoices called with:", { page, search, additionalFilters });
      setIsLoading(true);
      try {
        const filters: TableFilters = {
          page,
          page_size: itemsPerPage,
          search,
          ...additionalFilters,
        };

        // Convert TableFilters to Record<string, string> for URLSearchParams
        const stringFilters: Record<string, string> = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            stringFilters[key] = String(value);
          }
        });

        const result = await getGroupedInvoices(stringFilters);
        console.log(result, "result");

        if (result.success && result.data) {
          const { results, count } = resolvePaginatedListPayload(result.data);
          const mappedInvoices = results.map(mapGroupedInvoiceToTableInvoice);
          setInvoices(mappedInvoices);
          setTotalItems(count);
        } else {
          toast.error(result.message || "Failed to fetch invoices");
          
          // Handle auth errors
          if (handleAuthError(result)) {
            return;
          }
          setInvoices([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast.error("An error occurred while fetching invoices");
        setInvoices([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage]
  );
console.log(invoices, "inv")
  const parseAmount = useCallback((value: string): number => {
    const normalizedValue = value.trim();
    if (!normalizedValue) return 0;
    const parsedAmount = Number(normalizedValue);
    return Number.isFinite(parsedAmount) ? parsedAmount : 0;
  }, []);

  const updateCommissionSection = useCallback(
    (
      sectionId: string,
      updater: (previousSection: CommissionSectionState) => CommissionSectionState
    ) => {
      setCommissionSections((previousSections) =>
        previousSections.map((commissionSection) =>
          commissionSection.sectionId === sectionId
            ? updater(commissionSection)
            : commissionSection
        )
      );
    },
    []
  );

  const handleAddMoreCommissionSection = useCallback(() => {
    setCommissionSections((previousSections) => [
      ...previousSections,
      createCommissionSectionState(),
    ]);
  }, []);

  const handleRemoveCommissionSection = useCallback((sectionId: string) => {
    setCommissionSections((previousSections) => {
      if (previousSections.length <= 1) {
        toast.error("At least one commission section is required.");
        return previousSections;
      }
      return previousSections.filter(
        (commissionSection) => commissionSection.sectionId !== sectionId
      );
    });
  }, []);

  // Format dates for invoices
  const formatInvoiceDates = useCallback(async (invoiceList: Invoice[]) => {
    const datePromises = invoiceList.map(async (invoice) => {
      if (invoice.exported_on_date) {
        const formattedDate = await formatDate(invoice.exported_on_date);
        return { invoiceId: invoice.id, formattedDate };
      }
      return { invoiceId: invoice.id, formattedDate: "N/A" };
    });

    try {
      const results = await Promise.all(datePromises);
      const newFormattedDates: Record<string, string> = {};
      results.forEach(({ invoiceId, formattedDate }) => {
        newFormattedDates[invoiceId] = formattedDate;
      });
      setFormattedDates(newFormattedDates);
    } catch (error) {
      console.error("Error formatting dates:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchInvoices(currentPage, searchTerm, filters);
  }, [fetchInvoices, currentPage, searchTerm, filters]);

  // Format dates when invoices change
  useEffect(() => {
    if (invoices.length > 0) {
      formatInvoiceDates(invoices);
    }
  }, [invoices, formatInvoiceDates]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search change (kept consistent with other tables)
  const handleSearchChange = (searchValue: string) => {
    // Update local search term used for API query
    setSearchTerm(searchValue);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Handle filter change (functional update and ready for future mappings)
  const handleFilterChange = (newFilters: {
    condition: boolean;
    status: boolean;
  }) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      // Add more filter mappings as needed based on API
      // Example: payment_status: newFilters.status ? "paid" : "unpaid"
    }));

    // Reset to first page when filtering so results stay predictable
    setCurrentPage(1);

    // Keep debug log for now; helps verify filter payloads
    console.log("Applied filters:", newFilters);
  };

  const handleAdvancedFilterInputChange = (
    field: "mpanMprn" | "postcode" | "businessName",
    value: string
  ) => {
    const sanitizedValue =
      field === "mpanMprn" ? value.replace(/\D/g, "") : value;
    setAdvancedFilterInputs((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  const handleApplyAdvancedFilters = () => {
    setFilters((prev) => ({
      ...prev,
      mpan_mprn: advancedFilterInputs.mpanMprn.trim() || undefined,
      company__current_postcode:
        advancedFilterInputs.postcode.trim() || undefined,
      company__company_name:
        advancedFilterInputs.businessName.trim() || undefined,
    }));
    setCurrentPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilterInputs({
      mpanMprn: "",
      postcode: "",
      businessName: "",
    });
    setFilters((prev) => {
      const {
        mpan_mprn,
        company__current_postcode,
        company__company_name,
        ...rest
      } = prev;
      void mpan_mprn;
      void company__current_postcode;
      void company__company_name;
      return rest;
    });
    setCurrentPage(1);
  };

  // Handle search with controlled state
  const handleSearchChangeControlled = (value: string) => {
    handleSearchChange(value);
  };

  // Handle filter changes with controlled state
  const handleFilterChangeControlled = (filters: {
    condition: boolean;
    status: boolean;
  }) => {
    handleFilterChange(filters);
  };

  const handleDownload = (invoice: Invoice) => {
    if (invoice.invoice_url) {
      window.open(invoice.invoice_url, "_blank");
    } else {
      // Grouped API rows do not return a single file URL.
      toast.error("Download is available inside invoice details.");
      console.warn("Invoice download URL not available:", invoice);
    }
  };

  const fetchAgentOptions = useCallback(
    async ({
      page,
      search,
      append,
    }: {
      page: number;
      search: string;
      append: boolean;
    }) => {
    try {
      setIsAgentOptionsLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        page_size: String(COMMISSION_DROPDOWN_PAGE_SIZE),
      });
      if (search.trim()) {
        queryParams.set("search", search.trim());
      }
      const response = await getDropdown(`/api/v1/auth/web/user/?${queryParams.toString()}`);
      if (!response.success) {
        toast.error(response.message || "Failed to load agents.");
        if (!append) {
          setAgentOptions([]);
        }
        setHasMoreAgentOptions(false);
        return;
      }

      const responseRecord = (response.data ?? {}) as {
        results?: AgentApiRecord[];
        next?: string | null;
      };
      const userResults = Array.isArray(responseRecord.results) ? responseRecord.results : [];
      const mappedAgentOptions = userResults
        .filter(
          (agentRecord) =>
            agentRecord.id != null && (agentRecord.name ?? "").trim().length > 0
        )
        .map((agentRecord) => ({
          value: String(agentRecord.id),
          label: String(agentRecord.name).trim(),
        }));

      setAgentOptions((previousOptions) => {
        if (!append) return mappedAgentOptions;
        const existingOptionValues = new Set(previousOptions.map((option) => option.value));
        return [
          ...previousOptions,
          ...mappedAgentOptions.filter(
            (option) => !existingOptionValues.has(option.value)
          ),
        ];
      });
      setAgentCurrentPage(page);
      setHasMoreAgentOptions(Boolean(responseRecord.next));
    } catch (error) {
      console.error("Error loading agent options:", error);
      toast.error("An error occurred while loading agents.");
      if (!append) {
        setAgentOptions([]);
      }
      setHasMoreAgentOptions(false);
    } finally {
      setIsAgentOptionsLoading(false);
    }
    },
    []
  );

  /**
   * Commission MPAN/MPRN dropdown label: `sites[].meters[].mpan_mrpn_details.bottomline`
   * from the company list API (not `mpan_mrpn_text`).
   */
  const resolveCompanyBottomlineDisplayValue = (
    companyRecord: CompanyApiRecord
  ): string => {
    const bottomlineFromSites =
      getBottomlineFromCompanyDetail(companyRecord) ??
      getBottomlineFromCompanyDetail(companyRecord.company_detail);
    return bottomlineFromSites?.trim() ?? "";
  };

  const fetchMpanMprnOptions = useCallback(
    async ({
      page,
      search,
      append,
    }: {
      page: number;
      search: string;
      append: boolean;
    }) => {
    try {
      setIsMpanMprnOptionsLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        page_size: String(COMMISSION_DROPDOWN_PAGE_SIZE),
      });
      if (search.trim()) {
        queryParams.set("company_name", search.trim());
      }
      const response = await getDropdown(
        `/api/v1/auth/web/core/company/?${queryParams.toString()}`
      );
      if (!response.success) {
        toast.error(response.message || "Failed to load MPAN/MPRN list.");
        if (!append) {
          setMpanMprnOptions([]);
        }
        setHasMoreMpanMprnOptions(false);
        return;
      }

      const responseRecord = (response.data ?? {}) as {
        results?: CompanyApiRecord[];
        next?: string | null;
      };
      const companyResults = Array.isArray(responseRecord.results)
        ? responseRecord.results
        : [];

      const mappedMpanMprnOptions: SelectOption[] = [];
      const seenCompanyIds = new Set<string>();
      companyResults.forEach((companyRecord) => {
        if (companyRecord.id == null) {
          return;
        }
        const companyId = String(companyRecord.id).trim();
        if (!companyId || seenCompanyIds.has(companyId)) {
          return;
        }
        seenCompanyIds.add(companyId);
        const mpanMprnValue = resolveCompanyBottomlineDisplayValue(companyRecord);
        const companyName = (companyRecord.company_name ?? "").trim();
        const labelParts = [mpanMprnValue, companyName].filter((part) => part.length > 0);
        mappedMpanMprnOptions.push({
          // Value must be company UUID/id for invoice-multiple-add `company_id`.
          value: companyId,
          label: labelParts.length > 0 ? labelParts.join(" - ") : companyId,
        });
      });

      setMpanMprnOptions((previousOptions) => {
        if (!append) return mappedMpanMprnOptions;
        const existingOptionValues = new Set(previousOptions.map((option) => option.value));
        return [
          ...previousOptions,
          ...mappedMpanMprnOptions.filter(
            (option) => !existingOptionValues.has(option.value)
          ),
        ];
      });
      setMpanMprnCurrentPage(page);
      setHasMoreMpanMprnOptions(Boolean(responseRecord.next));
    } catch (error) {
      console.error("Error loading MPAN/MPRN options:", error);
      toast.error("An error occurred while loading MPAN/MPRN list.");
      if (!append) {
        setMpanMprnOptions([]);
      }
      setHasMoreMpanMprnOptions(false);
    } finally {
      setIsMpanMprnOptionsLoading(false);
    }
    },
    []
  );

  /**
   * Paginated dropdown search (same pattern as `ExportContractTable` company filter):
   * debounce `companySearch`-style term, then fetch page 1; scroll loads more pages.
   */
  useEffect(() => {
    if (!isCommissionSectionVisible) return;
    if (agentSearchDebounceRef.current) {
      clearTimeout(agentSearchDebounceRef.current);
    }
    agentSearchDebounceRef.current = setTimeout(() => {
      void fetchAgentOptions({
        page: 1,
        search: agentSearchTerm,
        append: false,
      });
    }, COMMISSION_DROPDOWN_SEARCH_DEBOUNCE_MS);

    return () => {
      if (agentSearchDebounceRef.current) {
        clearTimeout(agentSearchDebounceRef.current);
      }
    };
  }, [agentSearchTerm, fetchAgentOptions, isCommissionSectionVisible]);

  useEffect(() => {
    if (!isCommissionSectionVisible) return;
    if (mpanMprnSearchDebounceRef.current) {
      clearTimeout(mpanMprnSearchDebounceRef.current);
    }
    mpanMprnSearchDebounceRef.current = setTimeout(() => {
      void fetchMpanMprnOptions({
        page: 1,
        search: mpanMprnSearchTerm,
        append: false,
      });
    }, COMMISSION_DROPDOWN_SEARCH_DEBOUNCE_MS);

    return () => {
      if (mpanMprnSearchDebounceRef.current) {
        clearTimeout(mpanMprnSearchDebounceRef.current);
      }
    };
  }, [fetchMpanMprnOptions, isCommissionSectionVisible, mpanMprnSearchTerm]);

  const handleAgentMenuScrollToBottom = useCallback(() => {
    if (isAgentOptionsLoading || !hasMoreAgentOptions) return;
    void fetchAgentOptions({
      page: agentCurrentPage + 1,
      search: agentSearchTerm,
      append: true,
    });
  }, [
    agentCurrentPage,
    agentSearchTerm,
    fetchAgentOptions,
    hasMoreAgentOptions,
    isAgentOptionsLoading,
  ]);

  const handleMpanMprnMenuScrollToBottom = useCallback(() => {
    if (isMpanMprnOptionsLoading || !hasMoreMpanMprnOptions) return;
    void fetchMpanMprnOptions({
      page: mpanMprnCurrentPage + 1,
      search: mpanMprnSearchTerm,
      append: true,
    });
  }, [
    fetchMpanMprnOptions,
    hasMoreMpanMprnOptions,
    isMpanMprnOptionsLoading,
    mpanMprnCurrentPage,
    mpanMprnSearchTerm,
  ]);

  /**
   * Merge API pages with each row's current selection so chosen ids stay in `options`
   * (needed when multiple commission rows share one list; export contracts uses a single selection).
   */
  const agentOptionsForCommissionSelect = useMemo(() => {
    const optionsByValue = new Map<string, SelectOption>();
    for (const commissionSection of commissionSections) {
      const selectedAgentOption = commissionSection.selectedAgentOption;
      if (selectedAgentOption?.value) {
        optionsByValue.set(selectedAgentOption.value, selectedAgentOption);
      }
    }
    for (const agentOption of agentOptions) {
      optionsByValue.set(agentOption.value, agentOption);
    }
    return Array.from(optionsByValue.values());
  }, [agentOptions, commissionSections]);

  const mpanMprnOptionsForCommissionSelect = useMemo(() => {
    const optionsByValue = new Map<string, SelectOption>();
    for (const commissionSection of commissionSections) {
      const selectedMpanMprnOption = commissionSection.selectedMpanMprnOption;
      if (selectedMpanMprnOption?.value) {
        optionsByValue.set(selectedMpanMprnOption.value, selectedMpanMprnOption);
      }
    }
    for (const mpanMprnOption of mpanMprnOptions) {
      optionsByValue.set(mpanMprnOption.value, mpanMprnOption);
    }
    return Array.from(optionsByValue.values());
  }, [commissionSections, mpanMprnOptions]);

  /**
   * Builds one API row per commission section (same office/agent/VAT split as the UI)
   * and POSTs the array to `invoice-multiple-add`.
   */
  const handleSubmitCommissionInvoices = useCallback(async () => {
    for (let sectionIndex = 0; sectionIndex < commissionSections.length; sectionIndex++) {
      const commissionSection = commissionSections[sectionIndex];
      if (!commissionSection.selectedAgentOption?.value) {
        toast.error(`Commission #${sectionIndex + 1}: select an agent.`);
        return;
      }
      if (!commissionSection.selectedMpanMprnOption?.value) {
        toast.error(`Commission #${sectionIndex + 1}: select a company (MPAN/MPRN).`);
        return;
      }
      const totalReceivedText = commissionSection.totalReceived.trim();
      if (!totalReceivedText) {
        toast.error(`Commission #${sectionIndex + 1}: enter a total received amount.`);
        return;
      }
      const totalReceivedAmount = parseAmount(commissionSection.totalReceived);
      if (!Number.isFinite(Number(totalReceivedText))) {
        toast.error(
          `Commission #${sectionIndex + 1}: enter a valid total received amount.`
        );
        return;
      }
      if (!commissionSection.selectedMonth) {
        toast.error(`Commission #${sectionIndex + 1}: select a month.`);
        return;
      }
      if (!commissionSection.selectedWeek) {
        toast.error(`Commission #${sectionIndex + 1}: select a week.`);
        return;
      }
    }

    const requestPayload: InvoiceMultipleAddApiItem[] = commissionSections.map(
      (commissionSection) => {
        const totalReceivedAmount = parseAmount(commissionSection.totalReceived);
        const officeAmount = totalReceivedAmount * (COMMISSION_OFFICE_PCT / 100);
        const agentAmount = totalReceivedAmount * (COMMISSION_AGENT_PCT / 100);
        const vatAmount = agentAmount * (COMMISSION_VAT_PCT / 100);
        const grossInvoiceTotalAmount =
          officeAmount +
          agentAmount +
          (commissionSection.includeVatInTotal ? vatAmount : 0);
        const clawbackAmountValue = commissionSection.hasPreviousWeekClawback
          ? parseAmount(commissionSection.clawbackAmount)
          : 0;
        const invoiceTotalAmount = grossInvoiceTotalAmount - clawbackAmountValue;

        const agentIdString = commissionSection.selectedAgentOption!.value.trim();
        const parsedUserId = Number.parseInt(agentIdString, 10);
        const companyId = commissionSection.selectedMpanMprnOption!.value.trim();

        return {
          company_id: companyId,
          user_id: Number.isFinite(parsedUserId) ? parsedUserId : 0,
          is_active: true,
          invoice_datetime: new Date().toISOString(),
          total_received: formatAmountForInvoiceApi(totalReceivedAmount),
          office: formatAmountForInvoiceApi(officeAmount),
          agent: formatAmountForInvoiceApi(agentAmount),
          vat: formatAmountForInvoiceApi(vatAmount),
          total: formatAmountForInvoiceApi(invoiceTotalAmount),
          reference: commissionSection.reference.trim(),
          notes: commissionSection.notes.trim(),
          Is_there_any_clawback_from_previous_week:
            commissionSection.hasPreviousWeekClawback,
          clawback_amount: formatAmountForInvoiceApi(clawbackAmountValue),
          is_minus: commissionSection.isMinus,
          month: commissionSection.selectedMonth,
          year: getCurrentCommissionYear(),
          week: commissionSection.selectedWeek,
        };
      }
    );

    setIsSubmittingCommissionInvoices(true);
    try {
      const result = await postMethod(requestPayload, INVOICE_MULTIPLE_ADD_ENDPOINT);
      if (result.success) {
        toast.success(result.message || "Invoices created successfully.");
        setCommissionSections([createCommissionSectionState()]);
        void fetchInvoices(currentPage, searchTerm, filters);
      } else {
        toast.error(result.message || "Failed to create invoices.");
        if (handleAuthError(result)) {
          return;
        }
      }
    } catch (error) {
      console.error("invoice-multiple-add failed:", error);
      toast.error("An error occurred while creating invoices.");
    } finally {
      setIsSubmittingCommissionInvoices(false);
    }
  }, [
    commissionSections,
    currentPage,
    fetchInvoices,
    filters,
    parseAmount,
    searchTerm,
  ]);

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          onClick={() => setIsCommissionSectionVisible((previousValue) => !previousValue)}
        >
          {isCommissionSectionVisible ? "Hide Commission" : "Add Commission"}
        </Button>
      </div>

      {isCommissionSectionVisible ? (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Commission Calculation</h2>
              {commissionSections.map((commissionSection, sectionIndex) => {
                const sectionBaseAmount = parseAmount(commissionSection.totalReceived);
                const sectionOfficeAmount = sectionBaseAmount * (COMMISSION_OFFICE_PCT / 100);
                const sectionAgentAmount = sectionBaseAmount * (COMMISSION_AGENT_PCT / 100);
                const sectionVatAmount = sectionAgentAmount * (COMMISSION_VAT_PCT / 100);
                const sectionCommissionGrossTotal =
                  sectionAgentAmount +
                  (commissionSection.includeVatInTotal ? sectionVatAmount : 0);
                const sectionClawbackAmount = commissionSection.hasPreviousWeekClawback
                  ? parseAmount(commissionSection.clawbackAmount)
                  : 0;
                const sectionCommissionTotal =
                  sectionCommissionGrossTotal - sectionClawbackAmount;
                const fieldKeySuffix = `${commissionSection.sectionId}-${sectionIndex}`;

                return (
                  <div
                    key={commissionSection.sectionId}
                    className="space-y-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Commission #{sectionIndex + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemoveCommissionSection(commissionSection.sectionId)}
                        disabled={commissionSections.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-agent-select-${fieldKeySuffix}`}>
                          Agent
                        </Label>
                        <CustomSelect
                          inputId={`invoice-page-agent-select-${fieldKeySuffix}`}
                          options={agentOptionsForCommissionSelect}
                          value={commissionSection.selectedAgentOption ?? undefined}
                          onChange={(nextOption) =>
                            updateCommissionSection(commissionSection.sectionId, (previousSection) => ({
                              ...previousSection,
                              selectedAgentOption: nextOption ?? null,
                            }))
                          }
                          onInputChange={(inputValue, actionMeta) => {
                            if (actionMeta.action === "input-change") {
                              setAgentSearchTerm(inputValue);
                            }
                            return inputValue;
                          }}
                          onMenuScrollToBottom={handleAgentMenuScrollToBottom}
                          placeholder={isAgentOptionsLoading ? "Loading agents..." : "Select an agent"}
                          isLoading={isAgentOptionsLoading}
                          isDisabled={false}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-mpan-mprn-select-${fieldKeySuffix}`}>
                          MPAN/MPRN
                        </Label>
                        <CustomSelect
                          inputId={`invoice-page-mpan-mprn-select-${fieldKeySuffix}`}
                          options={mpanMprnOptionsForCommissionSelect}
                          value={commissionSection.selectedMpanMprnOption ?? undefined}
                          onChange={(nextOption) =>
                            updateCommissionSection(commissionSection.sectionId, (previousSection) => ({
                              ...previousSection,
                              selectedMpanMprnOption: nextOption ?? null,
                            }))
                          }
                          onInputChange={(inputValue, actionMeta) => {
                            if (actionMeta.action === "input-change") {
                              setMpanMprnSearchTerm(inputValue);
                            }
                            return inputValue;
                          }}
                          onMenuScrollToBottom={handleMpanMprnMenuScrollToBottom}
                          placeholder={
                            isMpanMprnOptionsLoading
                              ? "Loading MPAN/MPRN..."
                              : "Select MPAN/MPRN"
                          }
                          isLoading={isMpanMprnOptionsLoading}
                          isDisabled={false}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-commission-total-received-${fieldKeySuffix}`}>
                          Total received
                        </Label>
                        <Input
                          id={`invoice-page-commission-total-received-${fieldKeySuffix}`}
                          inputMode="decimal"
                          type="number"
                          step="0.01"
                          value={commissionSection.totalReceived}
                          onChange={(event) =>
                            updateCommissionSection(commissionSection.sectionId, (previousSection) => ({
                              ...previousSection,
                              totalReceived: event.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">Amount (£)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-commission-office-${fieldKeySuffix}`}>
                          Office
                        </Label>
                        <div className="relative">
                          <Input
                            id={`invoice-page-commission-office-${fieldKeySuffix}`}
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={formatMoneyGb(sectionOfficeAmount)}
                            className="pr-8 tabular-nums"
                            aria-describedby={`invoice-page-commission-office-hint-${fieldKeySuffix}`}
                          />
                          <span
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
                            aria-hidden
                          >
                            £
                          </span>
                        </div>
                        <p
                          id={`invoice-page-commission-office-hint-${fieldKeySuffix}`}
                          className="text-xs text-muted-foreground"
                        >
                          {COMMISSION_OFFICE_PCT}% of total received
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-commission-agent-${fieldKeySuffix}`}>
                          Agent
                        </Label>
                        <div className="relative">
                          <Input
                            id={`invoice-page-commission-agent-${fieldKeySuffix}`}
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={formatMoneyGb(sectionAgentAmount)}
                            className="pr-8 tabular-nums"
                            aria-describedby={`invoice-page-commission-agent-hint-${fieldKeySuffix}`}
                          />
                          <span
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
                            aria-hidden
                          >
                            £
                          </span>
                        </div>
                        <p
                          id={`invoice-page-commission-agent-hint-${fieldKeySuffix}`}
                          className="text-xs text-muted-foreground"
                        >
                          {COMMISSION_AGENT_PCT}% of total received
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-commission-vat-${fieldKeySuffix}`}>
                          VAT
                        </Label>
                        <div className="relative">
                          <Input
                            id={`invoice-page-commission-vat-${fieldKeySuffix}`}
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={formatMoneyGb(sectionVatAmount)}
                            className="pr-8 tabular-nums"
                            aria-describedby={`invoice-page-commission-vat-hint-${fieldKeySuffix}`}
                          />
                          <span
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
                            aria-hidden
                          >
                            £
                          </span>
                        </div>
                        <p
                          id={`invoice-page-commission-vat-hint-${fieldKeySuffix}`}
                          className="text-xs text-muted-foreground"
                        >
                          {COMMISSION_VAT_PCT}% of agent amount (applied when included in total)
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-reference-${fieldKeySuffix}`}>Reference</Label>
                        <Input
                          id={`invoice-page-reference-${fieldKeySuffix}`}
                          value={commissionSection.reference}
                          onChange={(event) =>
                            updateCommissionSection(commissionSection.sectionId, (previousSection) => ({
                              ...previousSection,
                              reference: event.target.value,
                            }))
                          }
                          placeholder="Enter invoice reference"
                        />
                        <div className="grid grid-cols-3 gap-2 max-w-sm">
                          <div className="space-y-2 min-w-0">
                            <Label htmlFor={`invoice-page-commission-year-${fieldKeySuffix}`}>
                              Year
                            </Label>
                            <Input
                              id={`invoice-page-commission-year-${fieldKeySuffix}`}
                              type="text"
                              readOnly
                              tabIndex={-1}
                              value={String(getCurrentCommissionYear())}
                              className="w-full min-w-0"
                            />
                          </div>
                          <div className="space-y-2 min-w-0">
                            <Label htmlFor={`invoice-page-commission-month-${fieldKeySuffix}`}>
                              Month
                            </Label>
                            <select
                              id={`invoice-page-commission-month-${fieldKeySuffix}`}
                              value={commissionSection.selectedMonth}
                              onChange={(event) =>
                                updateCommissionSection(
                                  commissionSection.sectionId,
                                  (previousSection) => ({
                                    ...previousSection,
                                    selectedMonth: event.target.value as CommissionMonthApiValue,
                                  })
                                )
                              }
                              className={`${COMMISSION_PERIOD_SELECT_CLASSNAME} w-full min-w-0`}
                            >
                              {COMMISSION_MONTH_OPTIONS.map((monthOption) => (
                                <option key={monthOption.value} value={monthOption.value}>
                                  {monthOption.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2 min-w-0">
                            <Label htmlFor={`invoice-page-commission-week-${fieldKeySuffix}`}>
                              Week
                            </Label>
                            <select
                              id={`invoice-page-commission-week-${fieldKeySuffix}`}
                              value={commissionSection.selectedWeek}
                              onChange={(event) =>
                                updateCommissionSection(
                                  commissionSection.sectionId,
                                  (previousSection) => ({
                                    ...previousSection,
                                    selectedWeek: event.target.value as CommissionWeekApiValue,
                                  })
                                )
                              }
                              className={`${COMMISSION_PERIOD_SELECT_CLASSNAME} w-full min-w-0`}
                            >
                              {COMMISSION_WEEK_OPTIONS.map((weekOption) => (
                                <option key={weekOption.value} value={weekOption.value}>
                                  {weekOption.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`invoice-page-notes-${fieldKeySuffix}`}>Notes</Label>
                        <Textarea
                          id={`invoice-page-notes-${fieldKeySuffix}`}
                          value={commissionSection.notes}
                          onChange={(event) =>
                            updateCommissionSection(commissionSection.sectionId, (previousSection) => ({
                              ...previousSection,
                              notes: event.target.value,
                            }))
                          }
                          placeholder="Enter invoice notes"
                          className="min-h-[96px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Total commission calculation
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`invoice-page-include-vat-in-total-${fieldKeySuffix}`}
                            checked={commissionSection.includeVatInTotal}
                            onCheckedChange={(nextCheckedValue) =>
                              updateCommissionSection(
                                commissionSection.sectionId,
                                (previousSection) => ({
                                  ...previousSection,
                                  includeVatInTotal: nextCheckedValue,
                                })
                              )
                            }
                          />
                          <Label
                            htmlFor={`invoice-page-include-vat-in-total-${fieldKeySuffix}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            Include VAT in total
                          </Label>
                        </div>
                      </div>
                      <div
                        className="mt-2 rounded-xl border border-border bg-primary-soft px-4 py-3 shadow-sm"
                        role="status"
                        aria-live="polite"
                        aria-label="Commission total amount"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                          Commission total
                        </p>
                        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-700">
                          {formatMoneyGb(sectionCommissionTotal)}
                        </p>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`invoice-page-is-minus-${fieldKeySuffix}`}
                            checked={commissionSection.isMinus}
                            onCheckedChange={(nextCheckedState) =>
                              updateCommissionSection(
                                commissionSection.sectionId,
                                (previousSection) => ({
                                  ...previousSection,
                                  isMinus: nextCheckedState === true,
                                })
                              )
                            }
                          />
                          <Label
                            htmlFor={`invoice-page-is-minus-${fieldKeySuffix}`}
                            className="text-sm font-normal cursor-pointer leading-snug"
                          >
                            Is negative calculation
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`invoice-page-previous-week-clawback-${fieldKeySuffix}`}
                            checked={commissionSection.hasPreviousWeekClawback}
                            onCheckedChange={(nextCheckedState) =>
                              updateCommissionSection(
                                commissionSection.sectionId,
                                (previousSection) => ({
                                  ...previousSection,
                                  hasPreviousWeekClawback: nextCheckedState === true,
                                })
                              )
                            }
                          />
                          <Label
                            htmlFor={`invoice-page-previous-week-clawback-${fieldKeySuffix}`}
                            className="text-sm font-normal cursor-pointer leading-snug"
                          >
                            Is there any clawback from previous week?
                          </Label>
                        </div>
                        {commissionSection.hasPreviousWeekClawback ? (
                          <div className="space-y-2 max-w-md">
                            <Label htmlFor={`invoice-page-clawback-amount-${fieldKeySuffix}`}>
                              Clawback amount
                            </Label>
                            <Input
                              id={`invoice-page-clawback-amount-${fieldKeySuffix}`}
                              inputMode="decimal"
                              type="number"
                              step="0.01"
                              min={0}
                              value={commissionSection.clawbackAmount}
                              onChange={(event) =>
                                updateCommissionSection(
                                  commissionSection.sectionId,
                                  (previousSection) => ({
                                    ...previousSection,
                                    clawbackAmount: event.target.value,
                                  })
                                )
                              }
                              aria-describedby={`invoice-page-clawback-amount-hint-${fieldKeySuffix}`}
                            />
                            <p
                              id={`invoice-page-clawback-amount-hint-${fieldKeySuffix}`}
                              className="text-xs text-muted-foreground"
                            >
                              Subtracts from commission total. Amount (£).
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  disabled={isSubmittingCommissionInvoices}
                  onClick={() => void handleSubmitCommissionInvoices()}
                >
                  {isSubmittingCommissionInvoices ? "Submitting…" : "Create invoices"}
                </Button>
                <Button type="button" variant="outline" onClick={handleAddMoreCommissionSection}>
                  Add More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <TableHeaderComponent
        title="Invoice List"
        showCSVButton={false}
        showExcelButton={false}
        onSearchChange={handleSearchChangeControlled}
        showDateRangePicker={false}
        onFilterChange={handleFilterChangeControlled}
        // Controlled state props with unique instance ID
        searchValue={currentState.searchValue}
        filterByCondition={currentState.filterByCondition}
        filterByStatus={currentState.filterByStatus}
        filterMenuOpen={currentState.filterMenuOpen}
        onSearchValueChange={(value) =>
          updateInstanceState("invoice-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("invoice-table", { filterMenuOpen: open })
        }
      />
      <Card className="overflow-hidden">
        <div className="px-6 pt-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1">
                MPAN / MPRN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={advancedFilterInputs.mpanMprn}
                onChange={(e) =>
                  handleAdvancedFilterInputChange("mpanMprn", e.target.value)
                }
                placeholder="Enter MPAN or MPRN"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Post Code
              </label>
              <input
                type="text"
                value={advancedFilterInputs.postcode}
                onChange={(e) =>
                  handleAdvancedFilterInputChange("postcode", e.target.value)
                }
                placeholder="Enter post code"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col md:col-span-1">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={advancedFilterInputs.businessName}
                onChange={(e) =>
                  handleAdvancedFilterInputChange("businessName", e.target.value)
                }
                placeholder="Enter business name"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <DateRangePicker
                onRangeChange={(formattedRange, startDate, endDate) =>
                  console.log("Date range:", formattedRange, startDate, endDate)
                }
              />
            </div>
            <div className="flex flex-col justify-end gap-2 md:flex-row md:items-end md:justify-end md:col-span-2 lg:col-span-4">
              <button
                onClick={handleApplyAdvancedFilters}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearAdvancedFilters}
                className="border border-primary text-primary px-4 py-2 rounded text-sm font-medium hover:bg-primary-soft transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
                <TableHead>Details</TableHead>
                <TableHead>Latest Invoice Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Invoice Count</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice: Invoice, idx: number) => {
                  const isMinusRow = invoice.is_minus === true;
                  const minusRowTextClass = isMinusRow ? "text-red-500" : undefined;

                  return (
                  <TableRow key={invoice.id || idx}>
                    <TableCell className={minusRowTextClass}>
                      {invoice.id ? (
                        <Link
                          href={`/invoices/${invoice.id}`}
                        >
                          <InfoButton>
                            View
                          </InfoButton>
                        </Link>
                      ) : (
                        invoice.id?.split("-")[0] || "N/A"
                      )}
                    </TableCell>
                    <TableCell className={minusRowTextClass}>{invoice.exported_on_date ? 
                        (formattedDates[invoice.id] || "Loading...") : 
                        "N/A"
                      }</TableCell>
                    <TableCell className={minusRowTextClass}>{invoice.company_name || "N/A"}</TableCell>
                    <TableCell className={minusRowTextClass}>{invoice.contract_count ?? 0}</TableCell>
                    <TableCell className={minusRowTextClass}>{invoice.net_payment_due || invoice.total_amount || "N/A"}</TableCell>
                    <TableCell className={minusRowTextClass}>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className={
                          isMinusRow
                            ? "text-red-500 underline-offset-2 hover:text-red-600 hover:underline transition-colors cursor-pointer"
                            : "text-primary underline-offset-2 hover:underline transition-colors cursor-pointer"
                        }
                      >
                        Download
                      </button>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </Card>
    </section>
  );
};

export default InvoiceTable;
