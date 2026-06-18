"use client";
import React, { useCallback, useEffect, useState } from "react";
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
import { NotesAttachmentsModal } from "@/components/NotesAttachmentsModal";
import {
  getSubmittedSalesList,
  type TableFilters,
} from "@/composable/getTableData";
import { getBottomlineFromCompanyDetail } from "@/composable/getBottomlineFromCompanyDetail";
import { Company, SubmittedSale } from "@/components/ExportContractTable/type";
import { formatDateTimeWithSeconds } from "@/composable/getFormatedDate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/ui/dateRangePicker";
import Link from "next/link";

type SubmittedSalesRecord = Omit<SubmittedSale, "company"> & {
  company?: Company | null;
  company_detail?: Company | null;
  quote_mpan_mrpn_text?: string | null;
};

const toDisplayString = (value: unknown): string => {
  if (value == null) return "N/A";
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : "N/A";
  }
  return "N/A";
};

// API-driven table state
const itemsPerPageDefault = 10;

// Removed mock data - using API data only

const SubmittedSalesTable = () => {
  const router = useRouter();
  const [sales, setSales] = useState<SubmittedSalesRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(itemsPerPageDefault);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    businessName: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<SubmittedSalesRecord | null>(null);

  // Use multiple table headers hook with unique instance ID
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();

  const currentState = getInstanceState("submitted-sales-table");

  const fetchSales = useCallback(
    async (
      page: number = 1,
      search: string = "",
      additionalFilters: TableFilters = {}
    ) => {
      setIsLoading(true);
      try {
        const query: TableFilters = {
          page,
          page_size: itemsPerPage,
          search,
          ...additionalFilters,
        };
        const result = await getSubmittedSalesList<SubmittedSalesRecord>(query);
        if (result.success && result.data) {
          setSales(result.data.results);
          console.log("Submitted sales:", result.data.results);
          setTotalItems(result.data.count);
        } else {
          toast.error(result.message || "Failed to fetch submitted sales");
          if (
            result.message?.includes("authentication") ||
            result.message?.includes("token") ||
            (result.errors &&
              typeof result.errors === "object" &&
              "status" in (result.errors as Record<string, unknown>) &&
              (result.errors as { status?: number }).status === 401)
          ) {
            router.push("/login");
          }
          setSales([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching submitted sales:", error);
        toast.error("An error occurred while fetching submitted sales");
        setSales([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage, router]
  );

  useEffect(() => {
    fetchSales(currentPage, searchTerm, filters);
  }, [fetchSales, currentPage, searchTerm, filters]);

  // Handle search with controlled state
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle filter changes with controlled state
  const handleFilterChange = (filterOptions: {
    condition: boolean;
    status: boolean;
  }) => {
    setFilters((prev) => ({
      ...prev,
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

  const handleApplyAdvancedFilters = () => {
    setFilters((prevFilters) => {
      const nextFilters: TableFilters = { ...prevFilters };

      const trimmedMpan = advancedFilterInputs.mpanMprn.trim();
      const trimmedPostcode = advancedFilterInputs.postcode.trim();
      const trimmedBusinessName = advancedFilterInputs.businessName.trim();

      // Map UI advanced filters to API query params
      // NOTE: backend expects `quote_mpan_mrpn_text` (not nested under company)
      nextFilters.quote_mpan_mrpn_text = trimmedMpan || undefined;
      nextFilters.current_postcode = trimmedPostcode || undefined;
      nextFilters.company_name = trimmedBusinessName || undefined;

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

  // Handle info button click
  // const handleInfoClick = (record: SubmittedSalesRecord) => {
  //   setSelectedRecord(record);
  //   setIsModalOpen(true);
  // };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // Get current state for this specific table instance
  const getCompanyName = (r: SubmittedSalesRecord): string =>
    r.company_detail?.company_name ?? "";
  const getAddress = (r: SubmittedSalesRecord) => {
    const c = r.company_detail;
    if (!c) return "";
    return [
      c.current_address_line1,
      c.current_address_line2,
      c.current_address_line3,
      c.current_address_line4,
      c.current_postcode,
    ].filter(Boolean).join(" ");
  };
  const getFuelType = (r: SubmittedSalesRecord) =>
    toDisplayString(r.company_detail?.contract_type);
  const getSupplierName = (r: SubmittedSalesRecord): string =>
    toDisplayString(
      r.company?.sold_supplier_name ?? r.company_detail?.sold_supplier_name,
    );
  const getMpanMprn = (r: SubmittedSalesRecord): string => {
    const bottomlineValue = getBottomlineFromCompanyDetail(r.company_detail);
    return toDisplayString(bottomlineValue ?? r.company_detail?.quote_mpan_mrpn_text);
  };
  const getSubmittedBy = (r: SubmittedSalesRecord): string =>
    toDisplayString(r.submitted_by);
  const getLeadStatus = (r: SubmittedSalesRecord): string =>
    toDisplayString(r.lead_status_revised);
  const getSubmittedDateTime = (r: SubmittedSalesRecord) =>
    formatDateTimeWithSeconds(
      r.submitted_datetime ??
        r.created_at ??
        r.updated_at ??
        r.company?.created_at ??
        null
    );
  const getSubtitle = (r: SubmittedSalesRecord) => {
    const lead = r.lead_id != null ? String(r.lead_id) : "N/A";
    const ref = r.reference ?? "N/A";
    return [lead, ref].filter(Boolean).join(" - ");
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <TableHeaderComponent
        title="Submitted Sales"
        onCSVExport={() => console.log("CSV Export clicked")}
        onExcelExport={() => console.log("Excel Export clicked")}
        onSearchChange={handleSearchChange}
        showDateRangePicker={false}
        onFilterChange={handleFilterChange}
        // Controlled state props with unique instance ID
        searchValue={currentState.searchValue}
        filterByCondition={currentState.filterByCondition}
        filterByStatus={currentState.filterByStatus}
        filterMenuOpen={currentState.filterMenuOpen}
        onSearchValueChange={(value) =>
          updateInstanceState("submitted-sales-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("submitted-sales-table", { filterMenuOpen: open })
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
                <TableHead>Notes</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead className="w-48">Address</TableHead>
                <TableHead>Full Type</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>MPAN/MPRN</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Lead Status</TableHead>
                <TableHead>Submitted Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading submitted sales...
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No submitted sales found
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((record, idx) => (
                  <TableRow key={(record.id ?? idx).toString()}>
                    <TableCell>
                      <Link href={`/submitted-sales/${record.id}`}>
                        <InfoButton>
                          {record.company_detail?.lead_id?.toString() ?? "N/A"}
                        </InfoButton>
                      </Link>
                    </TableCell>
                    <TableCell>{getCompanyName(record)}</TableCell>
                    <TableCell
                      className="w-48 max-w-48 break-words whitespace-normal py-2"
                      title={getAddress(record)}
                    >
                      {getAddress(record)}
                    </TableCell>
                    <TableCell>{getFuelType(record)}</TableCell>
                    <TableCell>{getSupplierName(record)}</TableCell>
                    <TableCell>{getMpanMprn(record)}</TableCell>
                    <TableCell>{getSubmittedBy(record)}</TableCell>
                    <TableCell>{getLeadStatus(record)}</TableCell>
                    <TableCell>{getSubmittedDateTime(record)}</TableCell>
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

      {/* Notes and Attachments Modal */}
      <NotesAttachmentsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        companyName={selectedRecord ? getCompanyName(selectedRecord) : ""}
        subtitle={selectedRecord ? getSubtitle(selectedRecord) : ""}
        attachments={[]}
        notes={[]}
      />
    </section>
  );
};

export default SubmittedSalesTable;
