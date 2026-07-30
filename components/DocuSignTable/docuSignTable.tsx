"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import Pagination from "@/ui/pagination";
import TableHeaderComponent from "@/components/TableHeader";
import { useMultipleTableHeaders } from "@/hooks/useTableHeaderState";
import { getCompanyList, type TableFilters } from "@/composable/getTableData";
import { usePostApiCall } from "@/composable/postApiCall";
import type {
  Company,
  ContactRecord,
} from "@/components/ExportContractTable/type";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/ui/modal";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { toast } from "sonner";
import { usePaginatedTableQuery } from "@/hooks/usePaginatedTableQuery";
import { useMemo } from "react";

// Local helper type that augments `Company` with an optional `contacts` array.
// The backend response for the company list may or may not include contacts,
// so we keep this as a best-effort extension and always guard at runtime.
type CompanyWithContacts = Company & {
  contacts?: ContactRecord[] | null;
};

// Row model for the DocuSign table. We keep the raw `companyId` on each row so
// that row-level actions (like sending an LOA) can reliably call APIs using the
// correct identifier without having to re-derive it from display-only fields.
// Only companies with `loaEnvelopeId` (sent to LOA) are shown; tab is driven by `loaEsignStatus`.
type DocuSignRow = {
  companyId?: string;
  /** DocuSign envelope ID – only rows with this set are "sent to LOA" and shown in the table. */
  loaEnvelopeId?: string | null;
  /** Backend status for LOA e-sign: used to show row under Pending / Approved / Cancelled tab. */
  loaEsignStatus?: string | null;
  companyName?: string;
  telephoneNumber?: string;
  emailAddress?: string;
  creationDate?: string;
  expirationDate?: string;
  voidReason?: string | null;
};

// Action button SVG as a React component
const ActionIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 19.75C4.62366 19.75 0.25 15.376 0.25 10C0.25 4.62402 4.62366 0.25 10 0.25C15.3763 0.25 19.75 4.62402 19.75 10C19.75 15.376 15.3763 19.75 10 19.75ZM10 1.75C5.45093 1.75 1.75 5.45093 1.75 10C1.75 14.5491 5.45093 18.25 10 18.25C14.5491 18.25 18.25 14.5491 18.25 10C18.25 5.45093 14.5491 1.75 10 1.75Z"
      fill="white"
    />
    <path
      d="M16.3647 17.114C16.1729 17.114 15.981 17.0408 15.8345 16.8943L3.10645 4.16626C2.81348 3.87329 2.81348 3.39868 3.10645 3.10571C3.39941 2.81274 3.87402 2.81274 4.16699 3.10571L16.895 15.8337C17.188 16.1267 17.188 16.6013 16.895 16.8943C16.7485 17.0408 16.5566 17.114 16.3647 17.114Z"
      fill="white"
    />
  </svg>
);

// Removed mock data - using API data only

const FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Cancelled", value: "cancelled" },
];

/**
 * Tab persistence:
 * - **URL query param**: allows browser reload + sharing deep-links.
 * - **localStorage**: fallback when URL param isn't present.
 *
 * We use a specific query param name to avoid collisions with other pages/components.
 */
const DOCUSIGN_TAB_QUERY_PARAM = "docusignTab";
const DOCUSIGN_TAB_STORAGE_KEY = "docusignTable.activeTab";

function isValidDocuSignTab(value: string | null | undefined): value is string {
  if (!value) return false;
  return FILTERS.some((filter) => filter.value === value);
}

function getInitialDocuSignTab(): string {
  // Guard for environments without `window` (SSR/tests).
  if (typeof window === "undefined") return "pending";

  const queryTab = new URLSearchParams(window.location.search).get(
    DOCUSIGN_TAB_QUERY_PARAM
  );
  if (isValidDocuSignTab(queryTab)) return queryTab;

  const storedTab = window.localStorage.getItem(DOCUSIGN_TAB_STORAGE_KEY);
  if (isValidDocuSignTab(storedTab)) return storedTab;

  return "pending";
}

/** API status values for LOA e-sign; backend uses uppercase. */
const LOA_STATUS = {
  SENT: "SENT",
  SIGNED_BACK: "SIGNED_BACK",
  VOID: "VOID",
} as const;

/**
 * Maps tab value to the backend loa_esign_status query parameter.
 * Each tab triggers a separate API call with the corresponding status filter.
 */
function getLoaStatusForTab(tabValue: string): string {
  switch (tabValue) {
    case "pending":
      return LOA_STATUS.SENT;
    case "approved":
      return LOA_STATUS.SIGNED_BACK;
    case "cancelled":
      return LOA_STATUS.VOID;
    default:
      return LOA_STATUS.SENT;
  }
}

/**
 * Maps API company list to DocuSign rows. Only includes companies that have
 * an LOA envelope ID (sent to DocuSign). API already filters by status per tab.
 */
function mapCompaniesToDocuSignRows(
  companies: CompanyWithContacts[]
): DocuSignRow[] {
  type CompanyLoa = CompanyWithContacts & {
    loa_envelope_id?: string | null;
    loa_esign_status?: string | null;
  };
  return companies
    .map((company) => {
      const companyLoa = company as CompanyLoa;
      const loaEnvelopeId = companyLoa.loa_envelope_id?.trim() || null;
      const loaEsignStatus = companyLoa.loa_esign_status?.trim() || null;
      const contacts: ContactRecord[] = company.contacts ?? [];
      const primaryContact =
        contacts.find((c) => c.is_primary) ?? contacts[0];
      return {
        companyId: company.id,
        loaEnvelopeId,
        loaEsignStatus,
        companyName: company.company_name ?? "N/A",
        telephoneNumber: primaryContact?.telephone1 ?? "N/A",
        emailAddress: primaryContact?.email_address ?? "N/A",
        creationDate: company.created_at ?? "N/A",
        expirationDate: "N/A",
      };
    })
    .filter((row) => Boolean(row.loaEnvelopeId));
}

const DocuSignTable = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [activeFilter, setActiveFilter] = React.useState(getInitialDocuSignTab);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { getInstanceState, updateInstanceState } = useMultipleTableHeaders();
  const itemsPerPage = 10;

  const loaStatusFilters = useMemo<TableFilters>(
    () => ({
      loa_esign_status: getLoaStatusForTab(activeFilter),
    }),
    [activeFilter]
  );

  const {
    results: companyResults,
    totalItems,
    isLoading,
    refetch: refetchCompanies,
  } = usePaginatedTableQuery<CompanyWithContacts>({
    resource: "docusign-companies",
    fetcher: (queryFilters) =>
      getCompanyList(queryFilters) as Promise<
        import("@/composable/getTableData").TableDataResult<CompanyWithContacts>
      >,
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filters: loaStatusFilters,
    extraKey: [activeFilter],
  });

  const docuSignData = useMemo(
    () => mapCompaniesToDocuSignRows(companyResults),
    [companyResults]
  );

  // Void envelope modal state
  const [isVoidModalOpen, setIsVoidModalOpen] = React.useState(false);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<
    string | null
  >(null);
  const [voidReason, setVoidReason] = React.useState("");

  // Track which row is currently re-sending LOA so only that row shows a loading label.
  const [resendingCompanyId, setResendingCompanyId] = React.useState<
    string | null
  >(null);

  /**
   * POST helper for DocuSign-related actions, such as sending LOAs.
   * We deliberately keep the default messaging behaviour (console logging)
   * and focus on wiring the correct endpoint + payload from the table rows.
   */
  const {
    executePost: executeDocuSignPost,
    loading: isSendingLoa,
  } = usePostApiCall({
    showSuccessMessage: true,
    showErrorMessage: true,
  });

  /**
   * POST helper for voiding DocuSign envelopes.
   * Handles the void envelope API call with success/error toast notifications.
   */
  const {
    executePost: executeVoidEnvelope,
    loading: isVoidingEnvelope,
  } = usePostApiCall({
    onSuccess: () => {
      toast.success("Envelope voided successfully.");
      setIsVoidModalOpen(false);
      setVoidReason("");
      setSelectedEnvelopeId(null);
      void refetchCompanies();
    },
    onError: (message) => {
      toast.error(message || "Failed to void envelope");
    },
  });

  /**
   * POST helper for re-sending LOA (used on Cancelled tab).
   * Calls send-signing-loa endpoint with company_id; on success refreshes the table.
   */
  const {
    executePost: executeResendLoa,
    loading: isResendingLoa,
  } = usePostApiCall({
    onSuccess: () => {
      toast.success("LOA re-sent successfully.");
      void refetchCompanies();
    },
    onError: (message) => {
      toast.error(message || "Failed to re-send LOA");
    },
  });

  /** Current page rows from API; no client-side slice (pagination is server-side). */
  const paginatedDocuSignData = docuSignData;

  // Reset to page 1 when switching tabs so we don't land on an empty page
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  /**
   * Persist the active tab whenever it changes.
   * We keep URL + localStorage in sync; URL takes precedence on initial load.
   */
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(DOCUSIGN_TAB_STORAGE_KEY, activeFilter);

    const url = new URL(window.location.href);
    url.searchParams.set(DOCUSIGN_TAB_QUERY_PARAM, activeFilter);
    window.history.replaceState(null, "", url.toString());
  }, [activeFilter]);

  // Get current state for this specific table instance
  const currentState = getInstanceState("docusign-table");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: {
    condition: boolean;
    status: boolean;
  }) => {
    console.log("Filters:", filters);
  };

  /**
   * Opens the void envelope modal for the given envelope ID.
   * Resets the void reason input when opening a new modal.
   */
  const handleOpenVoidModal = (envelopeId: string) => {
    setSelectedEnvelopeId(envelopeId);
    setVoidReason("");
    setIsVoidModalOpen(true);
  };

  /**
   * Closes the void envelope modal and resets related state.
   */
  const handleCloseVoidModal = () => {
    setIsVoidModalOpen(false);
    setVoidReason("");
    setSelectedEnvelopeId(null);
  };

  /**
   * Handles the void envelope submission.
   * Validates that both envelope_id and void_reason are provided before making the API call.
   */
  const handleVoidEnvelope = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEnvelopeId) {
      toast.error("Envelope ID is missing");
      return;
    }

    if (!voidReason.trim()) {
      toast.error("Please provide a void reason");
      return;
    }

    await executeVoidEnvelope("/api/v1/auth/web/core/void-envelope/", {
      envelope_id: selectedEnvelopeId,
      void_reason: voidReason.trim(),
    });
  };

  /**
   * Re-sends LOA for a company (used on Cancelled tab).
   * Calls send-signing-loa endpoint with company_id; success/error and table refresh
   * are handled by the executeResendLoa hook config.
   */
  const handleResendLoa = async (companyId?: string) => {
    if (!companyId) {
      toast.error("Company ID is missing");
      return;
    }
    // Prevent multiple concurrent requests from the table.
    if (isResendingLoa) return;

    setResendingCompanyId(companyId);
    try {
      await executeResendLoa("/api/v1/auth/web/core/send-signing-loa/", {
        company_id: companyId,
      });
    } finally {
      setResendingCompanyId(null);
    }
  };

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      <TableHeaderComponent
        title=""
        showCSVButton={false}
        showExcelButton={false}
        onSearchChange={handleSearchChange}
        onDateRangeChange={(formattedRange, startDate, endDate) =>
          console.log("Date range:", formattedRange, startDate, endDate)
        }
        onFilterChange={handleFilterChange}
        // Controlled state props with unique instance ID
        searchValue={currentState.searchValue}
        filterByCondition={currentState.filterByCondition}
        filterByStatus={currentState.filterByStatus}
        filterMenuOpen={currentState.filterMenuOpen}
        onSearchValueChange={(value) =>
          updateInstanceState("docusign-table", { searchValue: value })
        }
        onFilterMenuToggle={(open) =>
          updateInstanceState("docusign-table", { filterMenuOpen: open })
        }
      />
      <div className="my-4 flex gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-colors
              ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-gray-300 bg-white text-gray-700"
              }
            `}
            tabIndex={0}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary text-primary-foreground">
              <TableHead>Company Name</TableHead>
              <TableHead>Telephone Number</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Creation Date</TableHead>
              { activeFilter === "cancelled" ? <TableHead>Void Reason</TableHead> : <TableHead>Expiration Date</TableHead>}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading DocuSign documents...
                </TableCell>
              </TableRow>
            ) : docuSignData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No DocuSign documents found
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocuSignData.map((doc, idx) => (
                <TableRow key={idx}>
                  <TableCell>{doc.companyName || "N/A"}</TableCell>
                  <TableCell>{doc.telephoneNumber || "N/A"}</TableCell>
                  <TableCell>{doc.emailAddress || "N/A"}</TableCell>
                  <TableCell>{doc.creationDate || "N/A"}</TableCell>
                  { activeFilter === "cancelled" ? <TableCell>{doc.voidReason || "N/A"}</TableCell> : <TableCell>{doc.expirationDate || "N/A"}</TableCell>}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* On Cancelled tab: show Re-sent to LOA (calls send-signing-loa with company_id). Otherwise: Void. */}
                      {activeFilter === "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => void handleResendLoa(doc.companyId)}
                          disabled={!doc.companyId || isResendingLoa}
                          className="bg-[#2DB9EB] py-2 px-2 rounded flex flex-row items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2DB9EB]/90 transition-colors"
                        >
                          {/* <ActionIcon /> */}
                          <span className="text-white ml-2">
                            {resendingCompanyId === doc.companyId
                              ? "Sending..."
                              : "Re-sent to LOA"}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (doc.loaEnvelopeId) {
                              handleOpenVoidModal(doc.loaEnvelopeId);
                            } else {
                              toast.error("Envelope ID is missing");
                            }
                          }}
                          disabled={!doc.loaEnvelopeId}
                          className="bg-[#2DB9EB] py-2 px-2 rounded flex flex-row items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2DB9EB]/90 transition-colors"
                        >
                          <ActionIcon />
                          <span className="text-white ml-2">Void</span>
                        </button>
                      )}
                      {/* <button
                        type="button"
                        onClick={() => void handleSendLoa(doc.companyId)}
                        disabled={isSendingLoa}
                        className={`border border-[#2DB9EB] text-[#2DB9EB] py-2 px-3 rounded text-sm font-medium transition-colors
                          ${
                            isSendingLoa
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-[#E6F7FD]"
                          }
                        `}
                      >
                        {isSendingLoa ? "Sending..." : "Send LOA"}
                      </button> */}
                    </div>
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
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Void Envelope Modal */}
      <Dialog open={isVoidModalOpen} onOpenChange={handleCloseVoidModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Void Envelope
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Please provide a reason for voiding this envelope. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVoidEnvelope} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="void-reason"
                className="text-sm font-medium text-gray-700"
              >
                Void Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="void-reason"
                placeholder="Enter the reason for voiding this envelope..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={4}
                className="resize-none"
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseVoidModal}
                disabled={isVoidingEnvelope}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"                >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVoidingEnvelope || !voidReason.trim()}
                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {isVoidingEnvelope ? "Voiding..." : "Yes, Void Envelope"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DocuSignTable;
