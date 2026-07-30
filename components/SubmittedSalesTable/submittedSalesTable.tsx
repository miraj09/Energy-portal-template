"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import Link from "next/link";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";

/** Lazy-load date picker — pulls react-date-range CSS/JS only when this page mounts. */
const DateRangePicker = dynamic(() => import("@/ui/dateRangePicker"), {
  ssr: false,
  loading: () => (
    <div className="h-10 rounded border border-[#A0A0A0] bg-gray-50" />
  ),
});

type SubmittedSalesRecord = Omit<SubmittedSale, "company"> & {
  company?: Company | null;
  company_detail?: Company | null;
  quote_mpan_mrpn_text?: string | null;
};

/** Flat row ready for the table — avoids re-walking nested company_detail on every render. */
type SubmittedSalesDisplayRow = {
  id: string | number | null;
  hrefId: string | number | null;
  companyIdLabel: string;
  companyName: string;
  address: string;
  fuelType: string;
  supplierName: string;
  mpanMprn: string;
  submittedBy: string;
  leadStatus: string;
  submittedDateTime: string;
  subtitle: string;
};

const toDisplayString = (value: unknown): string => {
  if (value == null) return "N/A";
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : "N/A";
  }
  return "N/A";
};

function mapRecordToDisplayRow(
  record: SubmittedSalesRecord
): SubmittedSalesDisplayRow {
  const companyId = record.company_detail?.id ?? record.company?.id;
  const companyIdLabel =
    companyId == null ? "N/A" : (String(companyId).split("-")[0] ?? "N/A");

  const detail = record.company_detail;
  const address = detail
    ? [
        detail.current_address_line1,
        detail.current_address_line2,
        detail.current_address_line3,
        detail.current_address_line4,
        detail.current_postcode,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const submittedByRaw =
    record.submitted_by ?? record.company_detail?.submitted_by ?? null;
  let submittedBy = "N/A";
  if (submittedByRaw != null) {
    if (typeof submittedByRaw === "object" && "name" in submittedByRaw) {
      submittedBy = toDisplayString(
        (submittedByRaw as { name?: string | null }).name
      );
    } else {
      submittedBy = toDisplayString(submittedByRaw);
    }
  }

  const bottomlineValue = getBottomlineFromCompanyDetail(record.company_detail);
  const lead = record.lead_id != null ? String(record.lead_id) : "N/A";
  const ref = record.reference ?? "N/A";

  return {
    id: record.id ?? null,
    hrefId: record.id ?? null,
    companyIdLabel,
    companyName: record.company_detail?.company_name ?? "",
    address,
    fuelType: toDisplayString(record.company_detail?.contract_type),
    supplierName: toDisplayString(
      record.company?.sold_supplier_name ??
        record.company_detail?.sold_supplier_name
    ),
    mpanMprn: toDisplayString(
      bottomlineValue ?? record.company_detail?.quote_mpan_mrpn_text
    ),
    submittedBy,
    leadStatus: toDisplayString(record.lead_status_revised),
    submittedDateTime: formatDateTimeWithSeconds(
      record.submitted_datetime ??
        record.created_at ??
        record.updated_at ??
        record.company?.created_at ??
        null
    ),
    subtitle: [lead, ref].filter(Boolean).join(" - "),
  };
}

const itemsPerPageDefault = 10;

const SubmittedSalesTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(itemsPerPageDefault);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilters>({});
  const [advancedFilterInputs, setAdvancedFilterInputs] = useState({
    mpanMprn: "",
    postcode: "",
    businessName: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();
  const currentState = getInstanceState("submitted-sales-table");

  const {
    results: sales,
    totalItems,
    isLoading,
    isFetching,
  } = usePaginatedTableQuery<SubmittedSalesRecord>({
    resource: "submitted-sales",
    fetcher: getSubmittedSalesList,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters,
  });

  // Map nested API rows once when results change — not on every keystroke/re-render.
  const displayRows = useMemo(
    () => sales.map(mapRecordToDisplayRow),
    [sales]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCompanyName("");
    setSelectedSubtitle("");
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <TableHeaderComponent
        title="Submitted Sales"
        onCSVExport={() => undefined}
        onExcelExport={() => undefined}
        onSearchChange={handleSearchChange}
        showDateRangePicker={false}
        onFilterChange={handleFilterChange}
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
                onRangeChange={() => undefined}
              />
            </div>
            <div className="flex flex-col justify-end gap-2 md:flex-row md:items-end md:justify-end md:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={handleApplyAdvancedFilters}
                className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearAdvancedFilters}
                className="border border-primary text-primary px-4 py-2 rounded text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {isFetching && !isLoading ? (
            <p className="px-6 py-2 text-xs text-gray-500">Updating…</p>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead className="w-72 min-w-72">Address</TableHead>
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
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No submitted sales found
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row, idx) => (
                  <TableRow key={(row.id ?? idx).toString()}>
                    <TableCell>
                      {row.hrefId != null ? (
                        <Link href={`/submitted-sales/${row.hrefId}`}>
                          <InfoButton>{row.companyIdLabel}</InfoButton>
                        </Link>
                      ) : (
                        row.companyIdLabel
                      )}
                    </TableCell>
                    <TableCell>{row.companyName}</TableCell>
                    <TableCell
                      className="w-72 min-w-72 max-w-72 break-words whitespace-normal py-2"
                      title={row.address}
                    >
                      {row.address}
                    </TableCell>
                    <TableCell>{row.fuelType}</TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell>{row.mpanMprn}</TableCell>
                    <TableCell>{row.submittedBy}</TableCell>
                    <TableCell>{row.leadStatus}</TableCell>
                    <TableCell>{row.submittedDateTime}</TableCell>
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

      <NotesAttachmentsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        companyName={selectedCompanyName}
        subtitle={selectedSubtitle}
        attachments={[]}
        notes={[]}
      />
    </section>
  );
};

export default SubmittedSalesTable;
