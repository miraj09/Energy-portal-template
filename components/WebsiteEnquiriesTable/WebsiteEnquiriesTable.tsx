"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import Pagination from "@/ui/pagination";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";
import type { TableFilters } from "@/composable/getTableData";
import { getWebsiteEnquiriesList } from "@/composable/websiteEnquiry";
import { formatDateTimeWithSeconds } from "@/composable/getFormatedDate";
import type {
  WebsiteEnquiry,
  WebsiteEnquiryFormType,
  WebsiteEnquiryStatus,
} from "@/lib/types/websiteEnquiry";
import {
  WEBSITE_ENQUIRY_STATUSES,
  WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES,
  getWebsiteEnquiryStatusLabel,
} from "@/lib/constants/websiteEnquiry";
import { Loader2, Search } from "lucide-react";

type FormTypeTab = "all" | WebsiteEnquiryFormType;

const FORM_TYPE_TABS: { label: string; value: FormTypeTab }[] = [
  { label: "All", value: "all" },
  { label: "Quote Requests", value: "quote" },
  { label: "Partner Requests", value: "partner" },
];

function displayValue(value: string | null | undefined): string {
  if (value == null) return "—";
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : "—";
}

function StatusBadge({
  status,
  formType,
}: {
  status: WebsiteEnquiryStatus;
  formType: WebsiteEnquiryFormType;
}) {
  const classes =
    WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES[status] ??
    WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES.closed;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {getWebsiteEnquiryStatusLabel(status, formType)}
    </span>
  );
}

const WebsiteEnquiriesTable = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<FormTypeTab>("all");
  const [statusFilter, setStatusFilter] = useState<"" | WebsiteEnquiryStatus>(
    ""
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filters = useMemo<TableFilters>(() => {
    const next: TableFilters = {};
    if (activeTab !== "all") {
      next.form_type = activeTab;
    }
    if (statusFilter) {
      next.status = statusFilter;
    }
    return next;
  }, [activeTab, statusFilter]);

  const {
    results: enquiries,
    totalItems,
    isLoading,
  } = usePaginatedTableQuery<WebsiteEnquiry>({
    resource: "website-enquiries",
    fetcher: getWebsiteEnquiriesList,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters,
  });

  const hidePostcode = activeTab === "partner";
  const columnCount = hidePostcode ? 6 : 7;

  const handleTabChange = (tab: FormTypeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(
      value === "" ? "" : (value as WebsiteEnquiryStatus)
    );
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRowClick = (enquiry: WebsiteEnquiry) => {
    router.push(`/website-enquiries/${enquiry.id}`);
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h1 className="text-xl font-semibold text-[#222]">
            Website Enquiries
          </h1>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full border border-[#A0A0A0] rounded pl-9 pr-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Search website enquiries"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {FORM_TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="website-enquiry-status-filter"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Status
            </label>
            <select
              id="website-enquiry-status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">All</option>
              {WEBSITE_ENQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {/* Filter options keep API value; partner rename only on badges/detail */}
                  {status === "quoted"
                    ? "Quoted / Onboarding"
                    : getWebsiteEnquiryStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary text-primary-foreground text-xs font-medium">
              <TableHead>Submitted</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {!hidePostcode && <TableHead>Postcode</TableHead>}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center py-10">
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading enquiries…
                  </span>
                </TableCell>
              </TableRow>
            ) : enquiries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="text-center py-10 text-gray-500"
                >
                  No website enquiries found.
                </TableCell>
              </TableRow>
            ) : (
              enquiries.map((enquiry) => (
                <TableRow
                  key={enquiry.id}
                  className="cursor-pointer hover:bg-blue-50/60"
                  onClick={() => handleRowClick(enquiry)}
                >
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTimeWithSeconds(enquiry.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {displayValue(enquiry.name)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {displayValue(enquiry.business_name)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {displayValue(enquiry.email)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {displayValue(enquiry.phone)}
                  </TableCell>
                  {!hidePostcode && (
                    <TableCell className="text-sm">
                      {displayValue(enquiry.postcode)}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusBadge
                      status={enquiry.status}
                      formType={enquiry.form_type}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </section>
  );
};

export default WebsiteEnquiriesTable;
