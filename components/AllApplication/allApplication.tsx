"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { getCompanyList, type TableFilters } from "@/composable/getTableData";
import Link from "next/link";
import DateRangePicker, { type SelectedDateRange } from "@/ui/dateRangePicker";
import { format } from "date-fns";
import { Application } from "./type";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";
import { useAgentUserIdParam } from "@/hooks/useAgentUserIdParam";

/**
 * Query-param names the company list API expects for the "Created Date" range.
 * Kept in one place so renaming to match the backend is a one-line change.
 * TODO(backend): confirm these names with the `/core/company/` filterset.
 */
const CREATED_DATE_FILTER_PARAMS = {
  from: "created_at__gte",
  to: "created_at__lte",
} as const;

/** Calendar-date format sent to the API (no time component). */
const API_DATE_FORMAT = "yyyy-MM-dd";

/** Every filter key owned by the advanced-filter panel; removed together on "Clear". */
const ADVANCED_FILTER_PARAM_KEYS = [
  "quote_mpan_mrpn_text",
  "current_postcode",
  "company_name",
  CREATED_DATE_FILTER_PARAMS.from,
  CREATED_DATE_FILTER_PARAMS.to,
] as const;

const AllApplicationTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    businessName: "",
  });
  // Draft date range picked in the panel; like the text inputs it is only sent
  // to the API once "Apply Filters" is clicked.
  const [selectedDateRange, setSelectedDateRange] =
    useState<SelectedDateRange | null>(null);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();
  const currentState = getInstanceState("all-application-table");
  const { agentUserIdFilter, isReady: isAgentUserIdReady } =
    useAgentUserIdParam();

  const queryFilters = useMemo(
    () => ({ ...filters, ...agentUserIdFilter }),
    [filters, agentUserIdFilter]
  );

  const {
    results: companies,
    totalItems,
    isLoading,
  } = usePaginatedTableQuery<Application>({
    resource: "all-applications",
    fetcher: (queryFiltersArg) =>
      getCompanyList(queryFiltersArg) as Promise<
        import("@/composable/getTableData").TableDataResult<Application>
      >,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters: queryFilters,
    enabled: isAgentUserIdReady,
  });

  const formatCompanyDates = useCallback(async (companyList: Application[]) => {
    const datePromises = companyList.map(async (company) => {
      if (company.created_at) {
        const date = new Date(company.created_at);
        const day = date.getDate().toString().padStart(2, "0");
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");

        const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
        return { companyId: company.id, formattedDate };
      }
      return { companyId: company.id, formattedDate: "N/A" };
    });

    try {
      const results = await Promise.all(datePromises);
      const newFormattedDates: Record<string, string> = {};
      results.forEach(({ companyId, formattedDate }) => {
        newFormattedDates[companyId] = formattedDate;
      });
      setFormattedDates(newFormattedDates);
    } catch (error) {
      console.error("Error formatting dates:", error);
    }
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      formatCompanyDates(companies);
    }
  }, [companies, formatCompanyDates]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (searchValue: string) => {
    setSearchTerm(searchValue);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterOptions: {
    condition: boolean;
    status: boolean;
  }) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      is_active: filterOptions.status,
    }));
    setCurrentPage(1);
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

  /**
   * The picker reports an empty `formattedRange` when its own inline "Clear"
   * link is used, so treat that as "no range selected".
   */
  const handleDateRangeChange = (
    formattedRange: string,
    startDate: Date,
    endDate: Date
  ) => {
    setSelectedDateRange(formattedRange ? { startDate, endDate } : null);
  };

  const handleApplyAdvancedFilters = () => {
    setFilters((prevFilters) => {
      const nextFilters: TableFilters = { ...prevFilters };

      const trimmedMpan = advancedFilterInputs.mpanMprn.trim();
      const trimmedPostcode = advancedFilterInputs.postcode.trim();
      const trimmedBusinessName = advancedFilterInputs.businessName.trim();

      nextFilters.quote_mpan_mrpn_text = trimmedMpan || undefined;
      nextFilters.current_postcode = trimmedPostcode || undefined;
      nextFilters.company_name = trimmedBusinessName || undefined;

      // `undefined` values are dropped by getTableData, so an unset range
      // simply omits both params from the request.
      nextFilters[CREATED_DATE_FILTER_PARAMS.from] = selectedDateRange
        ? format(selectedDateRange.startDate, API_DATE_FORMAT)
        : undefined;
      nextFilters[CREATED_DATE_FILTER_PARAMS.to] = selectedDateRange
        ? format(selectedDateRange.endDate, API_DATE_FORMAT)
        : undefined;

      return nextFilters;
    });
    setCurrentPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilterInputs({
      mpanMprn: "",
      postcode: "",
      businessName: "",
    });
    // Passing `null` down as the controlled value resets the picker's text
    setSelectedDateRange(null);
    setFilters((prevFilters) => {
      const remainingFilters: TableFilters = { ...prevFilters };
      ADVANCED_FILTER_PARAM_KEYS.forEach((filterKey) => {
        delete remainingFilters[filterKey];
      });
      return remainingFilters;
    });
    setCurrentPage(1);
  };

  const buildFullAddress = (company: Application): string => {
    const addressParts = [
      company.current_address_line1,
      company.current_address_line2,
      company.current_address_line3,
      company.current_address_line4,
      company.current_postcode,
    ].filter(Boolean);
    return addressParts.join(" ");
  };

  const truncateAddress = (address: string, maxLength: number = 50): string => {
    if (address.length <= maxLength) {
      return address;
    }
    return address.substring(0, maxLength) + "...";
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <TableHeaderComponent
        title="All Applications"
        showCSVButton={false}
        showExcelButton={false}
        // Keep search behaviour identical to SubmittedSalesTable
        onSearchChange={handleSearchChange}
        showDateRangePicker={false}
        // Keep filter behaviour identical to SubmittedSalesTable
        onFilterChange={handleFilterChange}
        // Controlled state props with unique instance ID
        searchValue={currentState.searchValue}
        filterByCondition={currentState.filterByCondition}
        filterByStatus={currentState.filterByStatus}
        filterMenuOpen={currentState.filterMenuOpen}
        onSearchValueChange={(value) =>
          updateInstanceState("all-application-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("all-application-table", { filterMenuOpen: open })
        }
      />
      <Card className="">
        <div className="px-6 pt-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                MPAN / MPRN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={advancedFilterInputs.mpanMprn}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  handleAdvancedFilterInputChange("mpanMprn", numericValue);
                }}
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
                  handleAdvancedFilterInputChange(
                    "businessName",
                    e.target.value
                  )
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
                value={selectedDateRange}
                onRangeChange={handleDateRangeChange}
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
                className="border border-primary text-primary px-4 py-2 rounded text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
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
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead className="w-48">Address</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading companies...
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company: Application, idx: number) => (
                  <TableRow key={company.id || idx}>
                    <TableCell>
                      <Link href={`/all-applications/${company.id}`}>
                        <InfoButton>
                          {company.lead_id != null && company.lead_id !== ""
                            ? String(company.lead_id)
                            : "N/A"}
                        </InfoButton>
                      </Link>
                    </TableCell>
                    <TableCell>{company.company_name}</TableCell>
                    <TableCell
                      className="py-2 w-48 max-w-48 break-words whitespace-normal"
                      title={buildFullAddress(company)}
                    >
                      {truncateAddress(buildFullAddress(company))}
                    </TableCell>
                    <TableCell>{company.sold_supplier_name || "N/A"}</TableCell>
                    <TableCell>{company.created_by_name || "N/A"}</TableCell>
                    <TableCell>
                      {formattedDates[company.id] || "Loading..."}
                    </TableCell>
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
          onPageChange={handlePageChange}
        />
      </Card>
    </section>
  );
};

export default AllApplicationTable;
