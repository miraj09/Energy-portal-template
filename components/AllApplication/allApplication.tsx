"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DateRangePicker from "@/ui/dateRangePicker";
import { Application } from "./type";

const AllApplicationTable = () => {
  const router = useRouter();

  // State for table data and pagination
  const [companies, setCompanies] = useState<Application[]>([]);
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

  // State for formatted dates
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  // Get current state for this specific table instance
  const currentState = getInstanceState("all-application-table");

  // Fetch companies data from API
  const fetchCompanies = useCallback(
    async (
      page: number = 1,
      search: string = "",
      additionalFilters: TableFilters = {}
    ) => {
      setIsLoading(true);
      try {
        const filters: TableFilters = {
          page,
          page_size: itemsPerPage,
          search,
          ...additionalFilters,
        };

        const result = await getCompanyList(filters);

        if (result.success && result.data) {
          setCompanies(result.data.results as Application[]);
          setTotalItems(result.data.count);
        } else {
          toast.error(result.message || "Failed to fetch companies");
          // If authentication error, redirect to login
          if (
            result.message?.includes("authentication") ||
            result.message?.includes("token") ||
            (result.errors &&
              typeof result.errors === "object" &&
              "status" in result.errors &&
              result.errors.status === 401)
          ) {
            router.push("/login");
          }
          setCompanies([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("An error occurred while fetching companies");
        setCompanies([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage, router]
  );

  // Format dates for companies
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

  // Load initial data
  useEffect(() => {
    fetchCompanies(currentPage, searchTerm, filters);
  }, [fetchCompanies, currentPage, searchTerm, filters]);

  // Format dates when companies change
  useEffect(() => {
    if (companies.length > 0) {
      formatCompanyDates(companies);
    }
  }, [companies, formatCompanyDates]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search change (kept consistent with SubmittedSalesTable)
  const handleSearchChange = (searchValue: string) => {
    // Update local search term used for API query
    setSearchTerm(searchValue);
    // Whenever search changes, start again from the first page
    setCurrentPage(1);
  };

  // Handle filter change (kept consistent with SubmittedSalesTable)
  const handleFilterChange = (filterOptions: {
    condition: boolean;
    status: boolean;
  }) => {
    // Use functional update to avoid stale state issues
    setFilters((previousFilters) => ({
      ...previousFilters,
      // Backend expects `is_active` flag; we currently only map `status`
      is_active: filterOptions.status,
    }));

    // Reset to the first page whenever filters change so results stay predictable
    setCurrentPage(1);
  };

  // Handle advanced filter input changes
  const handleAdvancedFilterInputChange = (
    field: "mpanMprn" | "postcode" | "businessName",
    value: string
  ) => {
    // Ensure only numeric data is stored for MPAN/MPRN just like in SubmittedSalesTable
    const sanitizedValue =
      field === "mpanMprn" ? value.replace(/\D/g, "") : value;

    setAdvancedFilterInputs((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  // Apply advanced filters to API filters state
  const handleApplyAdvancedFilters = () => {
    setFilters((prevFilters) => {
      const nextFilters: TableFilters = { ...prevFilters };

      const trimmedMpan = advancedFilterInputs.mpanMprn.trim();
      const trimmedPostcode = advancedFilterInputs.postcode.trim();
      const trimmedBusinessName = advancedFilterInputs.businessName.trim();

      nextFilters.quote_mpan_mrpn_text = trimmedMpan || undefined;
      nextFilters.current_postcode = trimmedPostcode || undefined;
      nextFilters.company_name = trimmedBusinessName || undefined;

      return nextFilters;
    });
    setCurrentPage(1);
  };

  // Clear advanced filters
  const handleClearAdvancedFilters = () => {
    setAdvancedFilterInputs({
      mpanMprn: "",
      postcode: "",
      businessName: "",
    });
    setFilters((prevFilters) => {
      const {
        quote_mpan_mrpn_text,
        current_postcode,
        company_name,
        ...rest
      } = prevFilters;
      void quote_mpan_mrpn_text;
      void current_postcode;
      void company_name;
      return rest;
    });
    setCurrentPage(1);
  };

  // Helper function to build full address
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

  // Helper function to truncate address for display
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
                        <InfoButton>{company.lead_id.toString()}</InfoButton>
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
