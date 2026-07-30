"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/ui/checkbox";
import Pagination from "@/ui/pagination";
import TableHeaderComponent from "@/components/TableHeader";
import { useMultipleTableHeaders } from "@/hooks/useTableHeaderState";
import {
  getContactsList,
  getCompanyList,
  type TableFilters,
} from "@/composable/getTableData";
import { getBottomlineFromCompanyDetail } from "@/composable/getBottomlineFromCompanyDetail";
import { formatDateTimeWithSeconds } from "@/composable/getFormatedDate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Company, ContactRecord, SubmittedSale } from "./type";
import { exportReports } from "@/lib/actions/exportReportServer";
import { CustomSelect, type SelectOption } from "@/ui/select";
import Link from "next/link";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";

const ALL_COMPANIES_OPTION: SelectOption = { value: "", label: "All companies" };
const ALL_LEAD_STATUSES_OPTION: SelectOption = {
  value: "",
  label: "All lead statuses",
};

const LEAD_STATUS_OPTIONS: SelectOption[] = [
  ALL_LEAD_STATUSES_OPTION,
  { value: "live", label: "Live" },
  { value: "in_progress", label: "In progress" },
  { value: "dead", label: "Dead" },
];

const ExportContractTable = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    businessName: "",
    leadStatus: "",
  });

  // Company filter: paginated dropdown (same pattern as TicketForm / SoldTariffFormPage1)
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [companyOptionsLoading, setCompanyOptionsLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const companySearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<SelectOption | null>(
    null
  );

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  // Get current state for this specific table instance
  const currentState = getInstanceState("export-contract-table");
  const [exportLoading, setExportLoading] = useState(false);

  // Selection state: Set of contact/contract IDs that are currently checked
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    results: contracts,
    totalItems,
    isLoading,
  } = usePaginatedTableQuery<ContactRecord>({
    resource: "export-contracts",
    fetcher: getContactsList,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters,
  });

  /** Map API company results to select options (id + company_name). */
  const mapCompaniesToOptions = useCallback(
    (
      results: Array<{ id?: string; company_name?: string }> | undefined | null
    ): SelectOption[] => {
      if (!results || !Array.isArray(results)) return [];
      return results
        .filter((c) => c?.id != null && c?.company_name != null)
        .map((c) => ({
          value: String(c.id),
          label: c.company_name as string,
        }));
    },
    []
  );

  /**
   * Fetch one page of companies for the filter dropdown (paginated, same as TicketForm).
   * - append: false = replace options (new search); true = append for "load more" on scroll.
   */
  const fetchCompaniesPage = useCallback(
    async ({
      search,
      page,
      append,
    }: {
      search: string;
      page: number;
      append: boolean;
    }) => {
      const PAGE_SIZE = 10;
      try {
        setCompanyOptionsLoading(true);
        const filters: TableFilters = {
          page,
          page_size: PAGE_SIZE,
        };
        if (search.trim()) {
          filters.company_name = search.trim();
        }
        const result = await getCompanyList(filters);
        if (!result.success || !result.data?.results) {
          if (!append) setCompanyOptions([]);
          setHasMoreCompanies(false);
          return;
        }
        const results = result.data.results as Array<{
          id?: string;
          company_name?: string;
        }>;
        const newOptions = mapCompaniesToOptions(results);
        setCompanyOptions((prev) => {
          if (!append) return newOptions;
          const existingByValue = new Set(prev.map((o) => o.value));
          return [
            ...prev,
            ...newOptions.filter((o) => !existingByValue.has(o.value)),
          ];
        });
        setCompanyPage(page);
        setHasMoreCompanies(Boolean(result.data.next));
      } catch {
        if (!append) setCompanyOptions([]);
        setHasMoreCompanies(false);
      } finally {
        setCompanyOptionsLoading(false);
      }
    },
    [mapCompaniesToOptions]
  );

  /** Debounced fetch: when user types in company dropdown, fetch page 1 with search. */
  useEffect(() => {
    if (companySearchDebounceRef.current) {
      clearTimeout(companySearchDebounceRef.current);
    }
    companySearchDebounceRef.current = setTimeout(() => {
      fetchCompaniesPage({
        search: companySearch,
        page: 1,
        append: false,
      });
    }, 500);
    return () => {
      if (companySearchDebounceRef.current) {
        clearTimeout(companySearchDebounceRef.current);
      }
    };
  }, [companySearch, fetchCompaniesPage]);

  /** Load next page when user scrolls to bottom of company dropdown menu. */
  const handleCompanyMenuScrollToBottom = useCallback(() => {
    if (companyOptionsLoading || !hasMoreCompanies) return;
    fetchCompaniesPage({
      search: companySearch,
      page: companyPage + 1,
      append: true,
    });
  }, [
    companyOptionsLoading,
    hasMoreCompanies,
    companySearch,
    companyPage,
    fetchCompaniesPage,
  ]);

  /** Options for company select: "All companies" first, then paginated list. */
  const companySelectOptions: SelectOption[] = [
    ALL_COMPANIES_OPTION,
    ...companyOptions,
  ];

  // Handle company filter change: update selection and apply filter to API
  const handleCompanyFilterChange = (option: SelectOption | null) => {
    setSelectedCompany(option ?? null);
    setFilters((prev) => {
      const next = { ...prev };
      const companyId = option?.value?.trim();
      if (companyId) {
        next.company = companyId;
      } else {
        delete next.company;
      }
      return next;
    });
    setCurrentPage(1);
  };

  // Handle search with controlled state (kept consistent with SubmittedSalesTable)
  const handleSearchChange = (searchValue: string) => {
    // Update local search term used for API query
    setSearchTerm(searchValue);
    // Reset to the first page whenever the search changes
    setCurrentPage(1);
  };

  // Handle filter changes with controlled state (kept consistent with SubmittedSalesTable)
  const handleFilterChange = (filterOptions: {
    condition: boolean;
    status: boolean;
  }) => {
    // Use functional state update to avoid stale `filters`
    setFilters((previousFilters) => ({
      ...previousFilters,
      // Backend uses `is_active` flag; currently mapping from the status toggle
      is_active: filterOptions.status,
    }));
    // Reset to the first page whenever filters change
    setCurrentPage(1);
  };

  const handleAdvancedFilterInputChange = (
    field: "mpanMprn" | "postcode" | "businessName" | "leadStatus",
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
    setFilters((prev) => {
      const next: TableFilters = { ...prev };

      const trimmedMpan = advancedFilterInputs.mpanMprn.trim();
      const trimmedPostcode = advancedFilterInputs.postcode.trim();
      const trimmedBusinessName = advancedFilterInputs.businessName.trim();
      const trimmedLeadStatus = advancedFilterInputs.leadStatus.trim();
      const normalizedLeadStatus =
        trimmedLeadStatus.length > 0
          ? trimmedLeadStatus
              .toLowerCase()
              // Convert "Work In Progress" / "work-in-progress" -> "work_in_progress"
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")
          : "";

      next.quote_mpan_mrpn_text = trimmedMpan || undefined;
      next.current_postcode = trimmedPostcode || undefined;
      next.company_name = trimmedBusinessName || undefined;
      next.lead_status = normalizedLeadStatus || undefined;

      return next;
    });
    setCurrentPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilterInputs({
      mpanMprn: "",
      postcode: "",
      businessName: "",
      leadStatus: "",
    });
    setFilters((prev) => {
      const {
        quote_mpan_mrpn_text,
        current_postcode,
        company_name,
        lead_status,
        ...rest
      } = prev;
      void quote_mpan_mrpn_text;
      void current_postcode;
      void company_name;
      void lead_status;
      return rest;
    });
    setCurrentPage(1);
  };

  const buildFullAddress = (company?: Company | null) => {
    if (!company) return "N/A";
    const parts = [
      company.current_address_line1,
      company.current_address_line2,
      company.current_address_line3,
      company.current_address_line4,
      company.current_postcode,
    ].filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(" ") : "N/A";
  };

  // const getAddress = (c: ContactRecord) => {
  //   return buildFullAddress(c.company ?? null);
  // };

  /** Coerce unknown (e.g. from ContactRecord index signature) to a string safe for ReactNode. */
  const toDisplayString = (value: unknown): string => {
    if (value == null) return "N/A";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "N/A";
  };

  /**
   * Lead status from the API may be a plain string on the contact row, or `{ id, name }`
   * on `submitted_sales` — normalize to a single display label.
   */
  const leadStatusToLabel = (raw: unknown): string | null => {
    if (raw == null) return null;
    if (typeof raw === "string" || typeof raw === "number") {
      const s = String(raw).trim();
      return s.length > 0 ? s : null;
    }
    if (typeof raw === "object" && raw !== null && "name" in raw) {
      const name = (raw as { name?: unknown }).name;
      if (typeof name === "string" && name.trim().length > 0) return name.trim();
    }
    return null;
  };

  const getCompanyName = (c: ContactRecord) => {
    return c.company?.company_name ?? "N/A";
  };

  // Display company id in the ID column; details still navigate with contact id.
  const getCompanyId = (c: ContactRecord): string => {
    const companyId = c.company?.id;
    if (companyId == null) return "N/A";
    return String(companyId).split("-")[0] ?? "N/A";
  };

  const getPostCode = (c: ContactRecord): string => {
    const value = c.company?.current_postcode ?? c.company?.current_postcode;
    return value != null && typeof value === "string" ? value : "N/A";
  };

  const getSupplierName = (c: ContactRecord): string => {
    const value = c.company?.sold_supplier_name;
    return value != null && typeof value === "string" ? value : "N/A";
  };

  const getContractType = (c: ContactRecord): string => {
    const value = c.company?.contract_type;
    return value != null && typeof value === "string" ? value : "N/A";
  };

  const getLatestSubmittedSale = (c: ContactRecord): SubmittedSale | null => {
    const sales = c.company?.submitted_sales ?? [];
    if (!sales || sales.length === 0) return null;
    const sorted = [...sales].sort((a, b) => {
      const da = a.submitted_datetime
        ? Date.parse(a.submitted_datetime)
        : -Infinity;
      const db = b.submitted_datetime
        ? Date.parse(b.submitted_datetime)
        : -Infinity;
      return db - da;
    });
    return sorted[0] ?? null;
  };

  /**
   * Display value for the MPAN/MPRN column: `bottomline` inside nested
   * `submitted_sales[].company_detail.sites[].meters[].mpan_mrpn_details`.
   */
  const getBottomlineFromContact = (c: ContactRecord): string | null => {
    type SaleWithDetail = SubmittedSale & { company_detail?: unknown };
    const trySale = (sale: SubmittedSale): string | null =>
      getBottomlineFromCompanyDetail((sale as SaleWithDetail).company_detail);

    const latest = getLatestSubmittedSale(c);
    if (latest) {
      const fromLatest = trySale(latest);
      if (fromLatest) return fromLatest;
    }
    for (const sale of c.company?.submitted_sales ?? []) {
      const bl = trySale(sale);
      if (bl) return bl;
    }
    return null;
  };

  /**
   * Lead status: prefer denormalized contact `lead_status`, then latest sale’s
   * `lead_status_revised` / `lead_status`, then contacts under `company_detail`, then other sales.
   */
  const getLeadStatusFromContact = (c: ContactRecord): string | null => {
    type SaleWithLead = SubmittedSale & {
      company_detail?: unknown;
      lead_status_revised?: string | null;
      lead_status?: unknown;
    };

    const record = c as Record<string, unknown>;
    const fromRoot = leadStatusToLabel(record.lead_status);
    if (fromRoot) return fromRoot;

    const trySale = (sale: SubmittedSale): string | null => {
      const s = sale as SaleWithLead;
      const revised = leadStatusToLabel(s.lead_status_revised);
      if (revised) return revised;
      return leadStatusToLabel(s.lead_status);
    };

    const latest = getLatestSubmittedSale(c);
    if (latest) {
      const fromLatestSale = trySale(latest);
      if (fromLatestSale) return fromLatestSale;

      const detail = (latest as SaleWithLead).company_detail;
      if (detail && typeof detail === "object") {
        const contacts = (detail as Record<string, unknown>).contacts;
        if (Array.isArray(contacts)) {
          for (const contact of contacts) {
            if (!contact || typeof contact !== "object") continue;
            const fromContact = leadStatusToLabel(
              (contact as Record<string, unknown>).lead_status
            );
            if (fromContact) return fromContact;
          }
        }
      }
    }

    for (const sale of c.company?.submitted_sales ?? []) {
      const label = trySale(sale);
      if (label) return label;
    }

    return null;
  };

  const getSubmittedDateTime = (c: ContactRecord) => {
    const latest = getLatestSubmittedSale(c);
    const raw =
      latest?.submitted_datetime ??
      c.company?.created_at ??
      c.created_at ??
      null;
    return formatDateTimeWithSeconds(raw);
  };

  /** Resolve submitter display name from nested `submitted_by` object or legacy scalar. */
  const getSubmittedBy = (c: ContactRecord): string => {
    const latest = getLatestSubmittedSale(c);
    const submittedBy =
      c.submitted_by ?? latest?.submitted_by ?? null;

    if (submittedBy == null) return "N/A";

    // API returns submitted_by as { id, name, username }
    if (typeof submittedBy === "object" && "name" in submittedBy) {
      return toDisplayString(submittedBy.name);
    }

    return toDisplayString(submittedBy);
  };

  // Toggle a single row's selection by id
  const handleRowCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Select all visible rows on current page, or clear selection
  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedIds(
        new Set(contracts.map((c) => (c.id ?? "").toString()).filter(Boolean))
      );
    } else {
      setSelectedIds(new Set());
    }
  };

  // Whether all visible rows are selected (for select-all checkbox state)
  const allVisibleSelected =
    contracts.length > 0 &&
    contracts.every((c) => c.id != null && selectedIds.has(c.id));
  const someVisibleSelected = contracts.some(
    (c) => c.id != null && selectedIds.has(c.id)
  );

  // Clear selection when data changes (e.g. page or filters) so we don't hold stale ids
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, searchTerm, filters]);

  const handleExport = async (format?: "csv" | "excel") => {
    try {
      setExportLoading(true);
      const loadingId = toast.loading("Preparing download...");
      const endpoint = `/api/v1/auth/web/core/contact/export/?export_format=${format}`;

      const res = await exportReports(endpoint);
      console.log(res, "res");
      if (res.success) {
        const { base64, contentType, filename } = res.data as {
          base64: string;
          contentType: string;
          filename: string;
        };
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++)
          byteNumbers[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type: contentType,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          filename || format === "csv" ? "export_contracts.csv" : "export_contracts.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Download started", { id: loadingId });
        // Notify when download link click has been triggered
        setTimeout(() => {
          toast.success("Download complete");
        }, 800);
      } else {
        toast.dismiss(loadingId);
        const errors = res.errors as
          | { status?: number; authError?: boolean }
          | undefined;
        if (errors?.authError || errors?.status === 401) {
          router.push("/login");
          return;
        }
        toast.error(res.message || "Failed to export reports");
      }
    } catch (err) {
      console.error("EXPORT error:", err);
      toast.error("An error occurred while exporting reports");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <TableHeaderComponent
        title="Export Contracts"
        onCSVExport={() => handleExport("csv")}
        onExcelExport={() => handleExport("excel")}
        exportLoading={exportLoading}
        onSearchChange={handleSearchChange}
        showDateRangePicker={false}
        onFilterChange={handleFilterChange}
        // Controlled state props with unique instance ID
        searchValue={currentState.searchValue}
        filterByCondition={currentState.filterByCondition}
        filterByStatus={currentState.filterByStatus}
        filterMenuOpen={currentState.filterMenuOpen}
        onSearchValueChange={(value) =>
          updateInstanceState("export-contract-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("export-contract-table", { filterMenuOpen: open })
        }
      />
      <Card className="">
        <div className="px-6 pt-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company filter dropdown */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <CustomSelect
                options={companySelectOptions}
                value={selectedCompany ?? ALL_COMPANIES_OPTION}
                onChange={handleCompanyFilterChange}
                placeholder={
                  companyOptionsLoading ? "Loading companies..." : "All companies"
                }
                isLoading={companyOptionsLoading}
                isDisabled={false}
                onInputChange={(inputValue, actionMeta) => {
                  if (actionMeta.action === "input-change") {
                    setCompanySearch(inputValue);
                  }
                  return inputValue;
                }}
                onMenuScrollToBottom={handleCompanyMenuScrollToBottom}
                className="min-w-[200px]"
              />
            </div>
            {/* Lead status filter dropdown */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Lead Status
              </label>
              <CustomSelect
                options={LEAD_STATUS_OPTIONS}
                value={
                  LEAD_STATUS_OPTIONS.find(
                    (o) => o.value === advancedFilterInputs.leadStatus
                  ) ?? ALL_LEAD_STATUSES_OPTION
                }
                onChange={(option) =>
                  handleAdvancedFilterInputChange(
                    "leadStatus",
                    option?.value ?? ""
                  )
                }
                placeholder="All lead statuses"
                isLoading={false}
                isDisabled={false}
                className="min-w-[200px]"
              />
            </div>
            <div className="flex flex-col">
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
            <div className="flex flex-col">
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
            <div className="flex flex-col">
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
            {/*<div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <DateRangePicker
                onRangeChange={(formattedRange, startDate, endDate) =>
                  console.log("Date range:", formattedRange, startDate, endDate)
                }
              />
            </div> */}
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
          {/* Send email button: shown when at least one row is selected */}
          {selectedIds.size > 0 && (
            <div className="px-6 pt-4 pb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  console.log("Send email for IDs:", ids);
                  // TODO: wire to actual send-email API/handler
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Send email
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAllChange(checked === true)
                    }
                    aria-label="Select all rows"
                    className="bg-white"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Submitted By</TableHead>
                {/* <TableHead>Company ID</TableHead> */}
                <TableHead>Company Name</TableHead>
                <TableHead className="w-48">Post Code</TableHead>
                <TableHead>AQ/EAC</TableHead>
                <TableHead>MPAN/MPRN</TableHead>
                <TableHead>CL</TableHead>
                <TableHead>Lead Status</TableHead>
                <TableHead>Reminder Date</TableHead>
                <TableHead>Window Open</TableHead>
                <TableHead>Con. End Date</TableHead>
                <TableHead>Submitted Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8">
                    Loading export contracts...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8">
                    No export contracts found
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract, idx) => (
                  <TableRow key={(contract.id ?? idx).toString()}>
                    <TableCell className="w-10">
                      <Checkbox
                        checked={contract.id != null && selectedIds.has(contract.id)}
                        onCheckedChange={(checked) =>
                          contract.id != null &&
                          handleRowCheckboxChange(contract.id, checked === true)
                        }
                        aria-label={`Select contract ${contract.id}`}
                        className="bg-white"
                      />
                    </TableCell>
                    <TableCell>
                      {contract.id ? (
                        <Link href={`/export-contract/${contract.id}`}>
                          <InfoButton>{getCompanyId(contract)}</InfoButton>
                        </Link>
                      ) : (
                        getCompanyId(contract)
                      )}
                    </TableCell>
                    <TableCell>{getSubmittedBy(contract)}</TableCell>
                    {/* <TableCell>{getCompanyId(contract)}</TableCell> */}
                    <TableCell>{getCompanyName(contract)}</TableCell>
                    <TableCell
                      className="w-48 max-w-48 break-words whitespace-normal"
                      title={getPostCode(contract)}
                    >
                      {getPostCode(contract)}
                    </TableCell>
                    <TableCell>{toDisplayString(contract.aq_eac)}</TableCell>
                    <TableCell>{toDisplayString(getBottomlineFromContact(contract))}</TableCell>
                    <TableCell>{toDisplayString(contract.cl)}</TableCell>
                    <TableCell>
                      {toDisplayString(getLeadStatusFromContact(contract))}
                    </TableCell>
                    <TableCell>{toDisplayString(contract.reminder_date)}</TableCell>
                    <TableCell>{toDisplayString(contract.window_open)}</TableCell>
                    <TableCell>{toDisplayString(contract.con_end_date)}</TableCell>
                    <TableCell>{getSubmittedDateTime(contract)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </section>
  );
};

export default ExportContractTable;
