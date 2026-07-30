"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import Pagination from "@/ui/pagination";
import { getTicketsList, type TableFilters } from "@/composable/getTableData";
import { formatDate } from "@/composable/getFormatedDate";
import { useRouter } from "next/navigation";
import { Ticket } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { TICKET_STATUS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/modal";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";

// Action button SVG as a React component
const PendingActionIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_241_4055)">
      <path
        d="M8.33333 9.16667V11.6667C8.33333 12.5875 9.07917 13.3333 10 13.3333H12.0575L13.9858 14.895C14.0983 14.9667 14.22 15 14.3392 15C14.6817 15 14.9983 14.7275 14.9992 14.3408L15.0008 9.16667C15.0008 8.24583 14.255 7.49917 13.3342 7.49917H10.0008C9.08 7.49917 8.33417 8.245 8.33417 9.16583L8.33333 9.16667ZM10.8333 4.16667H6.66667C5.74583 4.16667 5 4.91333 5 5.83333L5.00167 11.4242C5.00167 11.81 5.31917 12.0833 5.66167 12.0833C5.78 12.0833 5.90167 12.0508 6.015 11.9783L6.6675 11.45V9.16667C6.6675 7.32583 8.16 5.83333 10.0008 5.83333H12.5008C12.5008 4.9125 11.755 4.16667 10.8342 4.16667H10.8333ZM20 10C20 15.5142 15.5142 20 10 20C6.62083 20 3.50417 18.2842 1.67 15.525L1.66667 16.6667C1.66667 17.1275 1.29333 17.5 0.833333 17.5C0.373333 17.5 0 17.1275 0 16.6667V14.1742C0 13.2517 0.750833 12.5 1.67333 12.5H4.16667C4.62667 12.5 5 12.8725 5 13.3333C5 13.7942 4.62667 14.1667 4.16667 14.1667H2.8025C4.2825 16.7167 7.0125 18.3333 10 18.3333C14.595 18.3333 18.3333 14.595 18.3333 10C18.3333 9.53917 18.7058 9.16667 19.1667 9.16667C19.6275 9.16667 20 9.53917 20 10ZM19.1667 2.5C18.7058 2.5 18.3333 2.8725 18.3333 3.33333L18.33 4.4625C16.5058 1.7 13.4225 0 10 0C4.48583 0 0 4.48583 0 10C0 10.4608 0.373333 10.8333 0.833333 10.8333C1.29333 10.8333 1.66667 10.4608 1.66667 10C1.66667 5.405 5.405 1.66667 10 1.66667C13.0333 1.66667 15.75 3.2675 17.2217 5.83333H15.8333C15.3725 5.83333 15 6.20583 15 6.66667C15 7.1275 15.3725 7.5 15.8333 7.5H18.3258C19.2483 7.5 20 6.74917 20 5.82583V3.33333C20 2.8725 19.6275 2.5 19.1667 2.5Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_241_4055">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
//  Closed Action button SVG as a React Component
const ClosedActionIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.8507 9.3175C19.1191 7.7175 16.2499 2.5 9.99989 2.5C3.74989 2.5 0.880726 7.7175 0.149059 9.3175C0.0508413 9.53192 0 9.76499 0 10.0008C0 10.2367 0.0508413 10.4697 0.149059 10.6842C0.880726 12.2825 3.74989 17.5 9.99989 17.5C16.2499 17.5 19.1191 12.2825 19.8507 10.6825C19.9487 10.4683 19.9995 10.2355 19.9995 10C19.9995 9.76446 19.9487 9.53168 19.8507 9.3175ZM9.99989 15C9.01099 15 8.04429 14.7068 7.22204 14.1573C6.3998 13.6079 5.75893 12.827 5.3805 11.9134C5.00206 10.9998 4.90304 9.99445 5.09597 9.02455C5.28889 8.05464 5.7651 7.16373 6.46436 6.46447C7.16362 5.7652 8.05454 5.289 9.02444 5.09607C9.99435 4.90315 10.9997 5.00216 11.9133 5.3806C12.8269 5.75904 13.6078 6.3999 14.1572 7.22215C14.7066 8.04439 14.9999 9.01109 14.9999 10C14.9986 11.3257 14.4714 12.5967 13.534 13.5341C12.5966 14.4715 11.3256 14.9987 9.99989 15Z"
      fill="white"
    />
    <path
      d="M9.99935 13.3334C11.8403 13.3334 13.3327 11.841 13.3327 10C13.3327 8.15907 11.8403 6.66669 9.99935 6.66669C8.1584 6.66669 6.66602 8.15907 6.66602 10C6.66602 11.841 8.1584 13.3334 9.99935 13.3334Z"
      fill="white"
    />
  </svg>
);

const FILTERS = [
  { label: "Pending Tickets", value: "pending" },
  { label: "Close Tickets", value: "closed" },
  { label: "All Tickets", value: "all" },
];

const QUERY_TYPE_OPTIONS = [
  { value: "CONTRACT_STATUS_QUERY", label: "CONTRACT STATUS QUERY" },
  { value: "INVOICE", label: "INVOICE" },
  { value: "RE_APPLY_REQUEST", label: "RE APPLY REQUEST" },
  { value: "BESPOKE_PRICE_QUERY", label: "BESPOKE PRICE QUERY" },
  { value: "PRE_CREDIT_CHECK", label: "PRE-CREDIT CHECK" },
  { value: "COMMISSION_QUERY", label: "COMMISSION QUERY" },
  { value: "LOA", label: "LOA (Letter Of Authority)"},
  { value: "OBJECTION", label: "OBJECTION" },
  { value: "OTHERS", label: "OTHERS" },
];

const TicketsTable = () => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isQueryTypeModalOpen, setIsQueryTypeModalOpen] = useState(false);
  const [isQueryTypeLoading, setIsQueryTypeLoading] = useState(false);
  const [filters, setFilters] = useState<TableFilters>({ status: "pending" });

  const {
    results: tickets,
    totalItems,
    isLoading,
  } = usePaginatedTableQuery<Ticket>({
    resource: "tickets",
    fetcher: (queryFilters) =>
      getTicketsList(queryFilters) as Promise<
        import("@/composable/getTableData").TableDataResult<Ticket>
      >,
    page: currentPage,
    pageSize: itemsPerPage,
    search: "",
    filters,
  });

  const handleViewDetails = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.public_id}`);
  };

  const formatTicketDates = useCallback(async (ticketList: Ticket[]) => {
    const datePromises = ticketList.map(async (ticket) => {
      if (ticket.created_at) {
        const formattedDate = await formatDate(ticket.created_at);
        return { ticketId: ticket.public_id, formattedDate };
      }
      return { ticketId: ticket.public_id, formattedDate: "N/A" };
    });

    try {
      const results = await Promise.all(datePromises);
      const newFormattedDates: Record<string, string> = {};
      results.forEach(({ ticketId, formattedDate }) => {
        newFormattedDates[ticketId] = formattedDate;
      });
    } catch (error) {
      console.error("Error formatting dates:", error);
    }
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      formatTicketDates(tickets);
    }
  }, [tickets, formatTicketDates]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterClick = (filterValue: string) => {
    if (isFilterLoading) return;

    setActiveFilter(filterValue);
    setIsFilterLoading(true);

    const newFilters: TableFilters = { ...filters };

    if (filterValue === "pending") {
      newFilters.status = "pending";
    } else if (filterValue === "closed") {
      newFilters.status = "closed";
    } else {
      delete newFilters.status;
    }

    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterLoading(false);
  };

  const handleAddTicket = () => {
    setIsQueryTypeModalOpen(true);
  };

  const handleQueryTypeSelect = (queryType: string) => {
    setIsQueryTypeLoading(true);
    router.push(`/tickets/add-ticket?queryType=${encodeURIComponent(queryType)}`);
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleFilterClick(filter.value)}
              disabled={isFilterLoading}
              className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  activeFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-gray-300 bg-white text-gray-700"
                }
              `}
              tabIndex={0}
            >
              {isFilterLoading && activeFilter === filter.value ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading...
                </>
              ) : (
                filter.label
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddTicket}
          className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors flex items-center gap-2"
        >
          Add Ticket
        </button>
      </div>

      {/* Query Type Selection Modal */}
      <Dialog 
        open={isQueryTypeModalOpen} 
        onOpenChange={(open) => {
          if (!isQueryTypeLoading) {
            setIsQueryTypeModalOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Select Query Type
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 relative">
            {isQueryTypeLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Please select a query type to create a new ticket:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {QUERY_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleQueryTypeSelect(option.value)}
                  disabled={isQueryTypeLoading}
                  className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary text-primary-foreground text-xs font-medium">
              <TableHead>Ticket ID</TableHead>
              <TableHead>Query Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading tickets...
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket: Ticket, idx: number) => (
                <TableRow key={ticket.tracking_id || idx}>
                  <TableCell className="font-inter text-[#363636] text-sm">
                    {ticket.tracking_id}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-[#363636] text-sm">
                      {ticket.query_type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-[#363636] text-sm">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1.5 text-[#363636] text-sm ${
                        ticket.status === TICKET_STATUS.Closed
                          ? "bg-[#FF605C] text-white"
                          : "bg-[#FFC62A] text-white rounded-sm"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>
                  {/* <TableCell>
                    <button 
                      onClick={() => handleViewDetails(ticket)}
                      className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                  </TableCell> */}
                  <TableCell>
                    <button
                      className={`p-2 rounded ${
                        ticket.status === TICKET_STATUS.Closed
                          ? "bg-primary text-primary-foreground"
                          : "bg-[#2DB9EB] text-white"
                      }`}
                      onClick={() => handleViewDetails(ticket)}
                    >
                      {ticket.status === TICKET_STATUS.Closed ? (
                        <ClosedActionIcon />
                      ) : (
                        <PendingActionIcon />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
};

export default TicketsTable;
