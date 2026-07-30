"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import { Card, CardContent } from "@/ui/card";
import Pagination from "@/ui/pagination";
import TableHeaderComponent from "@/components/TableHeader";
import { useMultipleTableHeaders } from "@/hooks/useTableHeaderState";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getReportsList, type TableFilters } from "@/composable/getTableData";
import { getBottomlineFromCompanyDetail } from "@/composable/getBottomlineFromCompanyDetail";
import { formatDateTimeWithSeconds } from "@/composable/getFormatedDate";
import { exportReports } from "@/lib/actions/exportReport";
import {
  type ContactRecord,
  type SubmittedSale,
} from "@/components/ExportContractTable/type";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { getDropdown } from "@/lib/actions/getDropdown";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";

interface AgentApiRecord {
  id?: number | string;
  name?: string;
}

const ALL_AGENTS_OPTION: SelectOption = { value: "", label: "All agents" };
const AGENT_DROPDOWN_PAGE_SIZE = 20;
const AGENT_DROPDOWN_SEARCH_DEBOUNCE_MS = 500;

const ReportsTable = () => {
  const router = useRouter();

  // State for table data and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    companyName: "",
  });
  const [selectedAgentOption, setSelectedAgentOption] =
    useState<SelectOption | null>(null);
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([]);
  const [isAgentOptionsLoading, setIsAgentOptionsLoading] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [agentCurrentPage, setAgentCurrentPage] = useState(1);
  const [hasMoreAgentOptions, setHasMoreAgentOptions] = useState(false);
  const agentSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  // Get current state for this specific table instance
  const currentState = getInstanceState("reports-table");

  const {
    results: reports,
    totalItems,
    isLoading,
  } = usePaginatedTableQuery<ContactRecord>({
    resource: "reports",
    fetcher: (queryFilters) =>
      getReportsList(queryFilters) as Promise<
        import("@/composable/getTableData").TableDataResult<ContactRecord>
      >,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters,
  });

  /** Coerce unknown API values to a string safe for table cells. */
  const toDisplayString = (value: unknown): string => {
    if (value == null) return "N/A";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "N/A";
  };

  /**
   * Lead status may be a plain string on the row or `{ id, name }` on submitted sales.
   */
  const leadStatusToLabel = (raw: unknown): string | null => {
    if (raw == null) return null;
    if (typeof raw === "string" || typeof raw === "number") {
      const label = String(raw).trim();
      return label.length > 0 ? label : null;
    }
    if (typeof raw === "object" && raw !== null && "name" in raw) {
      const name = (raw as { name?: unknown }).name;
      if (typeof name === "string" && name.trim().length > 0) return name.trim();
    }
    return null;
  };

  const getLatestSubmittedSale = (record: ContactRecord): SubmittedSale | null => {
    const sales = record.company?.submitted_sales ?? [];
    if (!sales.length) return null;
    const sorted = [...sales].sort((a, b) => {
      const dateA = a.submitted_datetime
        ? Date.parse(a.submitted_datetime)
        : -Infinity;
      const dateB = b.submitted_datetime
        ? Date.parse(b.submitted_datetime)
        : -Infinity;
      return dateB - dateA;
    });
    return sorted[0] ?? null;
  };

  const getSubmittedBy = (record: ContactRecord): string => {
    const latest = getLatestSubmittedSale(record);
    const submittedBy = record.submitted_by ?? latest?.submitted_by ?? null;

    if (submittedBy == null) return "N/A";

    // API returns submitted_by as { id, name, username }
    if (typeof submittedBy === "object" && "name" in submittedBy) {
      return toDisplayString(submittedBy.name);
    }

    return toDisplayString(submittedBy);
  };

  const getBottomlineFromContact = (record: ContactRecord): string | null => {
    type SaleWithDetail = SubmittedSale & { company_detail?: unknown };
    const trySale = (sale: SubmittedSale): string | null =>
      getBottomlineFromCompanyDetail((sale as SaleWithDetail).company_detail);

    const latest = getLatestSubmittedSale(record);
    if (latest) {
      const fromLatest = trySale(latest);
      if (fromLatest) return fromLatest;
    }
    for (const sale of record.company?.submitted_sales ?? []) {
      const bottomline = trySale(sale);
      if (bottomline) return bottomline;
    }
    return null;
  };

  const getLeadStatusFromContact = (record: ContactRecord): string | null => {
    type SaleWithLead = SubmittedSale & {
      company_detail?: unknown;
      lead_status_revised?: string | null;
      lead_status?: unknown;
    };

    const row = record as Record<string, unknown>;
    const fromRoot = leadStatusToLabel(row.lead_status);
    if (fromRoot) return fromRoot;

    const trySale = (sale: SubmittedSale): string | null => {
      const saleRow = sale as SaleWithLead;
      const revised = leadStatusToLabel(saleRow.lead_status_revised);
      if (revised) return revised;
      return leadStatusToLabel(saleRow.lead_status);
    };

    const latest = getLatestSubmittedSale(record);
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

    for (const sale of record.company?.submitted_sales ?? []) {
      const label = trySale(sale);
      if (label) return label;
    }

    return null;
  };

  const getCompanyName = (record: ContactRecord): string => {
    const row = record as Record<string, unknown>;
    const fromRoot = row.company_name;
    if (typeof fromRoot === "string" && fromRoot.trim()) return fromRoot.trim();
    return record.company?.company_name ?? "N/A";
  };

  const getPostCode = (record: ContactRecord): string => {
    const row = record as Record<string, unknown>;
    const fromRoot = row.post_code ?? row.postcode;
    if (typeof fromRoot === "string" && fromRoot.trim()) return fromRoot.trim();
    const fromCompany = record.company?.current_postcode;
    return fromCompany != null && typeof fromCompany === "string"
      ? fromCompany
      : "N/A";
  };

  /** MPAN/MPRN column shows `bottomline` from nested meter details, not full `mpan_mrpn_text`. */
  const getMpanMrpn = (record: ContactRecord): string =>
    toDisplayString(getBottomlineFromContact(record));

  const getSubmittedDateTime = (record: ContactRecord): string => {
    const row = record as Record<string, unknown>;
    const latest = getLatestSubmittedSale(record);
    const raw =
      (typeof row.submitted_datetime === "string"
        ? row.submitted_datetime
        : null) ??
      latest?.submitted_datetime ??
      record.company?.created_at ??
      record.created_at ??
      null;
    return formatDateTimeWithSeconds(raw);
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
          page_size: String(AGENT_DROPDOWN_PAGE_SIZE),
        });
        if (search.trim()) {
          queryParams.set("search", search.trim());
        }
        const response = await getDropdown(
          `/api/v1/auth/web/user/?${queryParams.toString()}`
        );
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
        const userResults = Array.isArray(responseRecord.results)
          ? responseRecord.results
          : [];
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
          const existingOptionValues = new Set(
            previousOptions.map((option) => option.value)
          );
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

  /** Debounced agent search (same pattern as InvoiceTable commission section). */
  useEffect(() => {
    if (agentSearchDebounceRef.current) {
      clearTimeout(agentSearchDebounceRef.current);
    }
    agentSearchDebounceRef.current = setTimeout(() => {
      void fetchAgentOptions({
        page: 1,
        search: agentSearchTerm,
        append: false,
      });
    }, AGENT_DROPDOWN_SEARCH_DEBOUNCE_MS);

    return () => {
      if (agentSearchDebounceRef.current) {
        clearTimeout(agentSearchDebounceRef.current);
      }
    };
  }, [agentSearchTerm, fetchAgentOptions]);

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

  /** Keep the selected agent in options after paginated search refreshes. */
  const agentSelectOptions = useMemo(() => {
    const optionsByValue = new Map<string, SelectOption>();
    if (selectedAgentOption?.value) {
      optionsByValue.set(selectedAgentOption.value, selectedAgentOption);
    }
    for (const agentOption of agentOptions) {
      optionsByValue.set(agentOption.value, agentOption);
    }
    return [ALL_AGENTS_OPTION, ...Array.from(optionsByValue.values())];
  }, [agentOptions, selectedAgentOption]);

  const handleAgentFilterChange = (option: SelectOption | null) => {
    const nextOption =
      option?.value?.trim() ? option : null;
    setSelectedAgentOption(nextOption);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search change (kept consistent with other tables)
  const handleSearchChange = (searchValue: string) => {
    // Update local search term used for API query
    setSearchTerm(searchValue);
    // Always reset to first page when search changes
    setCurrentPage(1);
  };

  // Handle filter changes (extend mapping as needed, but use functional update)
  const handleFilterChange = (newFilters: {
    condition: boolean;
    status: boolean;
  }) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      status: newFilters.status,
      condition: newFilters.condition,
    }));
    // Reset pagination so results stay predictable
    setCurrentPage(1);
  };

  const handleAdvancedFilterInputChange = (
    field: "mpanMprn" | "postcode" | "companyName",
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
    setFilters((prevFilters) => {
      const nextFilters: TableFilters = { ...prevFilters };

      const trimmedMpan = advancedFilterInputs.mpanMprn.trim();
      const trimmedPostcode = advancedFilterInputs.postcode.trim();
      const trimmedCompanyName = advancedFilterInputs.companyName.trim();

      nextFilters.quote_mpan_mrpn_text = trimmedMpan || undefined;
      nextFilters.current_postcode = trimmedPostcode || undefined;
      nextFilters.company_name = trimmedCompanyName || undefined;
      nextFilters.submitted_by = selectedAgentOption?.value?.trim() || undefined;

      return nextFilters;
    });
    setCurrentPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilterInputs({
      mpanMprn: "",
      postcode: "",
      companyName: "",
    });
    setSelectedAgentOption(null);
    setFilters((prevFilters) => {
      const {
        quote_mpan_mrpn_text,
        current_postcode,
        company_name,
        submitted_by,
        ...rest
      } = prevFilters;
      void quote_mpan_mrpn_text;
      void current_postcode;
      void company_name;
      void submitted_by;
      return rest;
    });
    setCurrentPage(1);
  };

  const handleExport = async (format?: "csv" | "excel") => {
    try {
      setExportLoading(true);
      const loadingId = toast.loading("Preparing download...");
      const endpoint = `/api/v1/auth/web/utility/report/export/?export_format=${format}`;

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
          filename || format === "csv" ? "reports.csv" : "reports.xlsx";
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
      <style jsx global>{`
        .reports-status-select [class*="react-select__control"] {
          border-color: #A0A0A0 !important;
        }
        .reports-status-select [class*="react-select__control"]:hover {
          border-color: #A0A0A0 !important;
        }
        .reports-status-select [class*="react-select__control--is-focused"] {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 1px #3b82f6 !important;
        }
        .reports-status-select [class*="react-select__option--is-selected"] {
          background-color: var(--primary) !important;
          color: white !important;
        }
        .reports-status-select [class*="react-select__option--is-focused"]:not([class*="react-select__option--is-selected"]) {
          background-color: var(--primary-soft) !important;
        }
      `}</style>
      <TableHeaderComponent
        title="Reports"
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
          updateInstanceState("reports-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("reports-table", { filterMenuOpen: open })
        }
      />
      <Card className="mb-4">
        <div className="px-6 pt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* <div className="flex flex-col reports-status-select">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <CustomSelect
                options={[
                  { value: "all", label: "All" },
                  ...availableStatuses.map((status) => ({
                    value: status,
                    label: status,
                  })),
                ]}
                value={
                  statusFilter === "all"
                    ? { value: "all", label: "All" }
                    : availableStatuses
                        .map((status) => ({ value: status, label: status }))
                        .find((opt) => opt.value === statusFilter) || null
                }
                onChange={(selected) =>
                  handleStatusFilterChange(selected?.value || "all")
                }
                placeholder="Select status"
                className="w-full"
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: state.isFocused ? "#3b82f6" : "#A0A0A0",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px #3b82f6"
                      : "none",
                    "&:hover": {
                      borderColor: state.isFocused ? "#3b82f6" : "#A0A0A0",
                    },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "var(--primary)"
                      : state.isFocused
                      ? "var(--primary-soft)"
                      : "white",
                    color: state.isSelected ? "white" : "#48505e",
                    "&:hover": {
                      backgroundColor: state.isSelected
                        ? "var(--primary)"
                        : "var(--primary-soft)",
                    },
                  }),
                }}
              />
            </div> */}
            <div className="flex flex-col reports-status-select">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Agent
              </label>
              <CustomSelect
                options={agentSelectOptions}
                value={selectedAgentOption ?? ALL_AGENTS_OPTION}
                onChange={handleAgentFilterChange}
                placeholder={
                  isAgentOptionsLoading ? "Loading agents..." : "All agents"
                }
                isLoading={isAgentOptionsLoading}
                isDisabled={false}
                onInputChange={(inputValue, actionMeta) => {
                  if (actionMeta.action === "input-change") {
                    setAgentSearchTerm(inputValue);
                  }
                  return inputValue;
                }}
                onMenuScrollToBottom={handleAgentMenuScrollToBottom}
                className="w-full"
                classNamePrefix="react-select"
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
                value={advancedFilterInputs.companyName}
                onChange={(e) =>
                  handleAdvancedFilterInputChange("companyName", e.target.value)
                }
                placeholder="Enter business name"
                className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {/* <div className="flex flex-col">
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
      </Card>
      <Card className="">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
                <TableHead>Submitted By</TableHead>
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
                  <TableCell colSpan={11} className="text-center py-8">
                    Loading reports...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report, idx) => {
                  const row = report as Record<string, unknown>;
                  return (
                  <TableRow key={report.id || idx}>
                    <TableCell>{getSubmittedBy(report)}</TableCell>
                    <TableCell>{getCompanyName(report)}</TableCell>
                    <TableCell
                      className="w-48 max-w-48 break-words whitespace-normal"
                      title={getPostCode(report)}
                    >
                      {getPostCode(report)}
                    </TableCell>
                    <TableCell>{toDisplayString(row.aq_eac)}</TableCell>
                    <TableCell>{getMpanMrpn(report)}</TableCell>
                    <TableCell>{toDisplayString(row.cl)}</TableCell>
                    <TableCell>
                      {toDisplayString(getLeadStatusFromContact(report))}
                    </TableCell>
                    <TableCell>{toDisplayString(row.reminder_date)}</TableCell>
                    <TableCell>{toDisplayString(row.window_open)}</TableCell>
                    <TableCell>{toDisplayString(row.con_end_date)}</TableCell>
                    <TableCell>{getSubmittedDateTime(report)}</TableCell>
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

export default ReportsTable;
