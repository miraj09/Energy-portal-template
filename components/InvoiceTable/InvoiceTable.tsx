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
import { handleAuthError } from "@/lib/auth";
import {
  COMMISSION_MONTH_OPTIONS,
  COMMISSION_WEEK_OPTIONS,
  INVOICE_FILTER_SELECT_CLASSNAME,
  formatCurrencyValue,
  mapInvoiceApiRowToTableInvoice,
  type InvoiceApiRow,
} from "@/composable/invoiceDisplay";
import { getCoreInvoiceList, type TableFilters } from "@/composable/getTableData";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";
import { postMethod } from "@/lib/actions/postMethod";
import { formatDate } from "@/composable/getFormatedDate";
import { toast } from "sonner";
import { Invoice } from "@/lib/types";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Checkbox } from "@/ui/checkbox";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { getDropdown } from "@/lib/actions/getDropdown";
import { getBottomlineFromCompanyDetail } from "@/composable/getBottomlineFromCompanyDetail";
import {
  buildInvoiceCreatePayload,
  COMMISSION_AGENT_PCT,
  COMMISSION_MONTH_API_OPTIONS,
  COMMISSION_OFFICE_PCT,
  COMMISSION_VAT_PCT,
  COMMISSION_WEEK_API_OPTIONS,
  computeCommissionLineAmounts,
  computeInvoiceSummary,
  createCommissionSectionState,
  createInvoiceFormState,
  getCurrentCommissionYear,
  INVOICE_CREATE_ENDPOINT,
  type CommissionMonthApiValue,
  type CommissionSectionState,
  type CommissionWeekApiValue,
  type InvoiceFormState,
} from "@/composable/invoiceCreateApi";
import type { UserRecord } from "@/lib/types/user";
import { userHasAnyRole } from "@/lib/user/mapLoginUserData";

const USER_STORAGE_KEY = "energy_user_Data";

/** Super Admin / Admin only: invoice list filters and Add Commission. */
const INVOICE_ADMIN_ROLES = ["Super Admin", "Admin"] as const;

const ALL_COMPANIES_OPTION: SelectOption = {
  value: "",
  label: "All companies",
};

interface AgentApiRecord {
  id?: number | string;
  name?: string;
}

interface CompanyApiRecord {
  id?: number | string;
  company_name?: string;
  /**
   * Company list may expose a root meter summary when nested `sites` are omitted.
   * Used as a fallback for the MPAN/MPRN select label.
   */
  meterstring?: string | null;
  /** Nested path: sites → meters → mpan_mrpn_details.bottomline (when present). */
  sites?: unknown;
  company_detail?: unknown;
  /** Flat invoice-style embed: mpan_mrpn_details.bottomline. */
  mpan_mrpn_details?: { bottomline?: string | null } | null;
}

const COMMISSION_PERIOD_SELECT_CLASSNAME =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

const COMMISSION_DROPDOWN_PAGE_SIZE = 20;
const COMMISSION_DROPDOWN_SEARCH_DEBOUNCE_MS = 500;

const formatMoneyGb = (value: number): string =>
  value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const InvoiceTable = () => {
  // State for table data and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [companyFilterOptions, setCompanyFilterOptions] = useState<SelectOption[]>([
    ALL_COMPANIES_OPTION,
  ]);
  const [isCompanyFilterOptionsLoading, setIsCompanyFilterOptionsLoading] = useState(false);
  const [companyFilterSearchTerm, setCompanyFilterSearchTerm] = useState("");
  const [selectedCompanyFilterOption, setSelectedCompanyFilterOption] =
    useState<SelectOption>(ALL_COMPANIES_OPTION);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("");
  const [selectedWeekFilter, setSelectedWeekFilter] = useState("");
  const [mpanMprnFilter, setMpanMprnFilter] = useState("");
  const [postcodeFilter, setPostcodeFilter] = useState("");
  const [commissionSections, setCommissionSections] = useState<CommissionSectionState[]>([
    createCommissionSectionState(),
  ]);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(createInvoiceFormState);
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
  const companyFilterSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmittingCommissionInvoices, setIsSubmittingCommissionInvoices] = useState(false);
  // Default false until localStorage is read (avoids flashing admin UI for other roles).
  const [isInvoiceAdmin, setIsInvoiceAdmin] = useState(false);

  // State for formatted dates
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    try {
      const rawUserData = localStorage.getItem(USER_STORAGE_KEY);
      if (!rawUserData) {
        setIsInvoiceAdmin(false);
        return;
      }
      const parsedUser = JSON.parse(rawUserData) as UserRecord;
      setIsInvoiceAdmin(userHasAnyRole(parsedUser, INVOICE_ADMIN_ROLES));
    } catch (error) {
      console.error("Failed to read energy_user_Data for invoice admin access:", error);
      setIsInvoiceAdmin(false);
    }
  }, []);

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  // Get current state for this specific table instance
  const currentState = getInstanceState("invoice-table");

  const {
    results: invoiceApiRows,
    totalItems,
    isLoading,
    refetch: refetchInvoices,
  } = usePaginatedTableQuery<InvoiceApiRow>({
    resource: "invoices",
    fetcher: getCoreInvoiceList,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters,
  });

  const invoices = useMemo(
    () => invoiceApiRows.map(mapInvoiceApiRowToTableInvoice),
    [invoiceApiRows]
  );

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
    setCommissionSections((previousSections) => {
      const firstSection = previousSections[0];
      const nextSection = {
        ...createCommissionSectionState(),
        selectedAgentOption: firstSection?.selectedAgentOption ?? null,
        selectedMpanMprnOption: firstSection?.selectedMpanMprnOption ?? null,
      };
      return [...previousSections, nextSection];
    });
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

  const fetchCompanyFilterOptions = useCallback(async (search: string) => {
    try {
      setIsCompanyFilterOptionsLoading(true);
      const queryParams = new URLSearchParams({
        page: "1",
        page_size: "20",
      });
      if (search.trim()) {
        queryParams.set("search", search.trim());
      }
      const response = await getDropdown(
        `/api/v1/auth/web/core/company/?${queryParams.toString()}`
      );
      if (!response.success) {
        toast.error(response.message || "Failed to load company filters.");
        setCompanyFilterOptions([ALL_COMPANIES_OPTION]);
        return;
      }
      const responseRecord = (response.data ?? {}) as { results?: CompanyApiRecord[] };
      const companyResults = Array.isArray(responseRecord.results)
        ? responseRecord.results
        : [];
      const mappedCompanyOptions = companyResults
        .filter(
          (companyRecord) =>
            companyRecord.id != null &&
            (companyRecord.company_name ?? "").trim().length > 0
        )
        .map((companyRecord) => ({
          value: String(companyRecord.id),
          label: String(companyRecord.company_name).trim(),
        }));
      setCompanyFilterOptions([ALL_COMPANIES_OPTION, ...mappedCompanyOptions]);
    } catch (error) {
      console.error("Error loading company filter options:", error);
      toast.error("An error occurred while loading company filters.");
      setCompanyFilterOptions([ALL_COMPANIES_OPTION]);
    } finally {
      setIsCompanyFilterOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInvoiceAdmin) {
      return;
    }
    if (companyFilterSearchDebounceRef.current) {
      clearTimeout(companyFilterSearchDebounceRef.current);
    }
    companyFilterSearchDebounceRef.current = setTimeout(() => {
      void fetchCompanyFilterOptions(companyFilterSearchTerm);
    }, COMMISSION_DROPDOWN_SEARCH_DEBOUNCE_MS);
    return () => {
      if (companyFilterSearchDebounceRef.current) {
        clearTimeout(companyFilterSearchDebounceRef.current);
      }
    };
  }, [isInvoiceAdmin, companyFilterSearchTerm, fetchCompanyFilterOptions]);

  const handleApplyInvoiceFilters = () => {
    const trimmedMpanMprn = mpanMprnFilter.trim();
    const trimmedPostcode = postcodeFilter.trim();

    setFilters((prev) => ({
      ...prev,
      company_id: selectedCompanyFilterOption.value || undefined,
      month: selectedMonthFilter || undefined,
      week: selectedWeekFilter || undefined,
      quote_mpan_mrpn_text: trimmedMpanMprn || undefined,
      current_postcode: trimmedPostcode || undefined,
    }));
    setCurrentPage(1);
  };

  const handleClearInvoiceFilters = () => {
    setSelectedCompanyFilterOption(ALL_COMPANIES_OPTION);
    setSelectedMonthFilter("");
    setSelectedWeekFilter("");
    setMpanMprnFilter("");
    setPostcodeFilter("");
    setCompanyFilterSearchTerm("");
    setFilters((prev) => {
      const {
        company_id,
        month,
        week,
        quote_mpan_mrpn_text,
        current_postcode,
        ...rest
      } = prev;
      void company_id;
      void month;
      void week;
      void quote_mpan_mrpn_text;
      void current_postcode;
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
   * Commission MPAN/MPRN dropdown label uses meter bottomline when available
   * (`sites[].meters[]`, flat `mpan_mrpn_details`, or root `meterstring`), then company name.
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
          queryParams.set("search", search.trim());
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
            // Value must be company UUID/id for invoice create `company_id` on each item.
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

  const invoiceSummary = useMemo(
    () => computeInvoiceSummary(commissionSections, invoiceForm, parseAmount),
    [commissionSections, invoiceForm, parseAmount]
  );

  /**
   * Builds one nested invoice payload (commission rows in `items[]`)
   * and POSTs to `/api/v1/auth/web/core/invoice/`.
   */
  const handleSubmitCommissionInvoices = useCallback(async () => {
    if (!isInvoiceAdmin) {
      toast.error("Only Super Admin and Admin can create commission invoices.");
      return;
    }

    if (invoiceForm.hasPreviousWeekClawback) {
      const clawbackText = invoiceForm.clawbackAmount.trim();
      if (!clawbackText) {
        toast.error("Enter a clawback amount.");
        return;
      }
      if (!Number.isFinite(Number(clawbackText))) {
        toast.error("Enter a valid clawback amount.");
        return;
      }
    }

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

    const requestPayload = buildInvoiceCreatePayload(
      invoiceForm,
      commissionSections,
      parseAmount
    );

    setIsSubmittingCommissionInvoices(true);
    try {
      const result = await postMethod(requestPayload, INVOICE_CREATE_ENDPOINT);
      if (result.success) {
        toast.success(result.message || "Invoice created successfully.");
        setCommissionSections([createCommissionSectionState()]);
        setInvoiceForm(createInvoiceFormState());
        void refetchInvoices();
      } else {
        toast.error(result.message || "Failed to create invoice.");
        if (handleAuthError(result)) {
          return;
        }
      }
    } catch (error) {
      console.error("invoice create failed:", error);
      toast.error("An error occurred while creating the invoice.");
    } finally {
      setIsSubmittingCommissionInvoices(false);
    }
  }, [
    commissionSections,
    refetchInvoices,
    invoiceForm,
    isInvoiceAdmin,
    parseAmount,
  ]);

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      {isInvoiceAdmin ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              onClick={() =>
                setIsCommissionSectionVisible((previousValue) => !previousValue)
              }
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
                const {
                  officeAmount: sectionOfficeAmount,
                  agentAmount: sectionAgentAmount,
                  vatAmount: sectionVatAmount,
                  lineTotal: sectionCommissionTotal,
                } = computeCommissionLineAmounts(
                  sectionBaseAmount,
                  invoiceForm.addVat
                );
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
                          {COMMISSION_VAT_PCT}% of agent amount; invoice VAT is recalculated
                          after clawback
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
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
                          {COMMISSION_MONTH_API_OPTIONS.map((monthOption) => (
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
                          {COMMISSION_WEEK_API_OPTIONS.map((weekOption) => (
                            <option key={weekOption.value} value={weekOption.value}>
                              {weekOption.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Total commission calculation
                      </p>
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
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-4 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold text-gray-700">Invoice details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-page-reference">Reference</Label>
                    <Input
                      id="invoice-page-reference"
                      value={invoiceForm.reference}
                      onChange={(event) =>
                        setInvoiceForm((previousForm) => ({
                          ...previousForm,
                          reference: event.target.value,
                        }))
                      }
                      placeholder="Enter invoice reference"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-page-notes">Notes</Label>
                    <Textarea
                      id="invoice-page-notes"
                      value={invoiceForm.notes}
                      onChange={(event) =>
                        setInvoiceForm((previousForm) => ({
                          ...previousForm,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Enter invoice notes"
                      className="min-h-[96px]"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="invoice-page-previous-week-clawback"
                      checked={invoiceForm.hasPreviousWeekClawback}
                      onCheckedChange={(nextCheckedState) =>
                        setInvoiceForm((previousForm) => ({
                          ...previousForm,
                          hasPreviousWeekClawback: nextCheckedState === true,
                        }))
                      }
                    />
                    <Label
                      htmlFor="invoice-page-previous-week-clawback"
                      className="text-sm font-normal cursor-pointer leading-snug"
                    >
                      Is there any clawback from previous week?
                    </Label>
                  </div>
                  {invoiceForm.hasPreviousWeekClawback ? (
                    <div className="space-y-2 max-w-md">
                      <Label htmlFor="invoice-page-clawback-amount">Clawback amount</Label>
                      <Input
                        id="invoice-page-clawback-amount"
                        inputMode="decimal"
                        type="number"
                        step="0.01"
                        min={0}
                        value={invoiceForm.clawbackAmount}
                        onChange={(event) =>
                          setInvoiceForm((previousForm) => ({
                            ...previousForm,
                            clawbackAmount: event.target.value,
                          }))
                        }
                        aria-describedby="invoice-page-clawback-amount-hint"
                      />
                      <p
                        id="invoice-page-clawback-amount-hint"
                        className="text-xs text-muted-foreground"
                      >
                        Applied at invoice level. Amount (£).
                      </p>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="invoice-page-include-vat-in-total"
                      checked={invoiceForm.addVat}
                      onCheckedChange={(nextCheckedValue) =>
                        setInvoiceForm((previousForm) => ({
                          ...previousForm,
                          addVat: nextCheckedValue,
                        }))
                      }
                    />
                    <Label
                      htmlFor="invoice-page-include-vat-in-total"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Include VAT in total
                    </Label>
                  </div>
                </div>
              </div>
              
              <div
                className="rounded-lg border border-border bg-muted/30 p-4"
                role="status"
                aria-live="polite"
                aria-label="Invoice summary"
              >
                <p className="text-sm font-semibold text-gray-900">Invoice summary</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Amount excl. VAT
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-800">
                      {formatMoneyGb(invoiceSummary.lineSubtotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Clawback
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-800">
                      {formatMoneyGb(invoiceSummary.clawbackAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {invoiceForm.addVat
                        ? "Net total (VAT after clawback)"
                        : "Net total (excl. VAT)"}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-800">
                      {formatMoneyGb(invoiceSummary.netTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  disabled={isSubmittingCommissionInvoices}
                  onClick={() => void handleSubmitCommissionInvoices()}
                >
                  {isSubmittingCommissionInvoices ? "Submitting…" : "Create invoice"}
                </Button>
                <Button type="button" variant="outline" onClick={handleAddMoreCommissionSection}>
                  Add More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          ) : null}
        </>
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
        {isInvoiceAdmin ? (
        <div className="px-6 pt-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Company
              </label>
              <CustomSelect
                options={companyFilterOptions}
                value={selectedCompanyFilterOption}
                onChange={(nextOption) =>
                  setSelectedCompanyFilterOption(nextOption ?? ALL_COMPANIES_OPTION)
                }
                onInputChange={(inputValue, actionMeta) => {
                  if (actionMeta.action === "input-change") {
                    setCompanyFilterSearchTerm(inputValue);
                  }
                  return inputValue;
                }}
                placeholder={
                  isCompanyFilterOptionsLoading
                    ? "Loading companies..."
                    : "Search company"
                }
                isLoading={isCompanyFilterOptionsLoading}
                isDisabled={false}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Month
              </label>
              <select
                value={selectedMonthFilter}
                onChange={(event) => setSelectedMonthFilter(event.target.value)}
                className={INVOICE_FILTER_SELECT_CLASSNAME}
              >
                <option value="">All months</option>
                {COMMISSION_MONTH_OPTIONS.map((monthOption) => (
                  <option key={monthOption.value} value={monthOption.value}>
                    {monthOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Week
              </label>
              <select
                value={selectedWeekFilter}
                onChange={(event) => setSelectedWeekFilter(event.target.value)}
                className={INVOICE_FILTER_SELECT_CLASSNAME}
              >
                <option value="">All weeks</option>
                {COMMISSION_WEEK_OPTIONS.map((weekOption) => (
                  <option key={weekOption.value} value={weekOption.value}>
                    {weekOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="invoice-list-mpan-mprn-filter"
                className="text-sm font-medium text-gray-700"
              >
                MPAN / MPRN
              </label>
              <input
                id="invoice-list-mpan-mprn-filter"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={mpanMprnFilter}
                onChange={(event) =>
                  setMpanMprnFilter(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter MPAN or MPRN"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="invoice-list-postcode-filter"
                className="text-sm font-medium text-gray-700"
              >
                Post Code
              </label>
              <input
                id="invoice-list-postcode-filter"
                type="text"
                value={postcodeFilter}
                onChange={(event) => setPostcodeFilter(event.target.value)}
                placeholder="Enter post code"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col justify-end gap-2 md:flex-row md:items-end md:justify-end md:col-span-2 lg:col-span-4">
              <button
                onClick={handleApplyInvoiceFilters}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearInvoiceFilters}
                className="border border-primary text-primary px-4 py-2 rounded text-sm font-medium hover:bg-primary-soft transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        ) : null}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
                <TableHead>Details</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount excl VAT</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead>Clawback</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
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
                          <Link href={`/invoices/${invoice.id}`}>
                            <InfoButton>{invoice.id.split("-")[0]}</InfoButton>
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>{invoice.exported_on_date ?
                        (formattedDates[invoice.id] || "Loading...") :
                        "N/A"
                      }</TableCell>
                      <TableCell className={minusRowTextClass}>
                        {invoice.reference || "N/A"}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>
                        {invoice.item_count ?? 0}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>
                        {formatCurrencyValue(invoice.amount_excluding_vat)}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>
                        {formatCurrencyValue(invoice.vat_amount)}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>
                        {formatCurrencyValue(invoice.clawback_amount)}
                      </TableCell>
                      <TableCell className={minusRowTextClass}>
                        {formatCurrencyValue(invoice.final_total)}{" "}
                        ({invoice.add_vat ? "incl. VAT" : "excl. VAT"})
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
