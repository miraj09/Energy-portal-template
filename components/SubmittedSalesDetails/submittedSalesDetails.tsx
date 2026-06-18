"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { getDropdown } from "@/lib/actions/getDropdown";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { usePostApiCall } from "@/composable/postApiCall";
import { uploadSubmittedSaleDocumentAction } from "@/lib/actions/uploadSubmittedSaleDocument";
import { getTicketsList } from "@/composable/getTableData";
import { Ticket } from "@/lib/types";
import { TICKET_STATUS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/ui/modal";
import LOAForm from "@/components/AddTicket/components/LOAForm";

// Format date to match screenshot: "07 November 2025 3:14 pm"
const formatDateWithMonthName = (
  dateString: string | null | undefined,
): string => {
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString();

    return `${day} ${month} ${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

interface SubmittedSaleNote {
  id: number;
  created_at: string;
  updated_at: string;
  detail: string;
  created_by_name?: string;
  created_by?: number;
  created_by_email?: string;
}

interface SubmittedSaleDetails {
  id: number;
  reference?: string;
  created_at?: string;
  submitted_datetime?: string;
  contract_type?: string;
  status?: string;
  /** LOA e-sign status: not_sent | sent | signed_back | void */
  lead_status?: {
    id?: number;
    name?: string;
  };
  company?: {
    loa_esign_status?: "SENT" | "SIGNED_BACK" | "VOID" | "NOT_SENT" | null;
    id?: string;
    company_name?: string;
    registration_no?: string;
    current_address_line1?: string;
    current_address_line2?: string;
    current_address_line3?: string;
    current_address_line4?: string;
    current_postcode?: string;
    owner_partner_name?: string;
    number_of_employees?: string;
    estimated_turnover?: string;
    is_micro_business?: boolean;
    business_type_name?: string;
    contract_type?: string;
    sold_supplier_name_display?: string;
    contacts?: Array<{
      id?: string;
      title?: string;
      first_name?: string;
      last_name?: string;
      telephone1?: string;
      telephone2?: string;
      telephone3?: string;
      email_address?: string;
      job_title?: string;
      is_primary?: boolean;
    }>;
    notes?: SubmittedSaleNote[];
    update_histories?: Array<{
      id: number;
      created_at: string;
      updated_at: string;
      status: string;
      created_by_name?: string;
      created_by?: number;
      created_by_email?: string;
    }>;
    sites?: Array<{
      id: number;
      sitename?: string;
      postcode?: string;
      address_line_1?: string;
      address_line_2?: string | null;
      address_line_3?: string | null;
      address_line_4?: string | null;
      total_employee?: number;
      meters?: Array<{
        meterid: number;
        meter_type_name?: string;
        meter_reference?: string;
        latestSoldDayRate?: string;
        latestSoldEveningWeekendRate?: string;
        latestSoldNightRate?: string;
        latestSoldStandingCharge?: string;
        latestSoldWinterRate?: string;
        mpan_mrpn_details?: {
          profileclass?: string;
          MTC?: string;
          LLF?: string;
          Region?: string;
          bottomline?: string;
          is_mpan?: boolean;
          is_mrpn?: boolean;
          mpan_mrpn_text?: string;
        };
      }>;
    }>;
    banks?: Array<{
      id: number;
      bank_name?: string;
      sort_code?: string;
      account_name?: string;
      account_number?: string;
      company?: string;
      created_at?: string;
      updated_at?: string;
      is_deleted?: boolean;
      is_active?: boolean;
    }>;
  };
  // company?: {
  //   id?: string;
  //   company_name?: string;
  //   registration_no?: string;
  //   current_address_line1?: string;
  //   current_address_line2?: string;
  //   current_address_line3?: string;
  //   current_address_line4?: string;
  //   current_postcode?: string;
  //   billing_address_line1?: string;
  //   billing_address_line2?: string;
  //   billing_address_line3?: string;
  //   billing_address_line4?: string;
  //   billing_postcode?: string;
  //   director_first_name?: string;
  //   director_last_name?: string;
  //   number_of_employees?: string;
  //   estimated_turnover?: string;
  //   is_micro_business?: boolean;
  //   business_type_name?: string;
  // };
  contact?: {
    id?: string;
    title?: string;
    first_name?: string;
    last_name?: string;
    telephone1?: string;
    telephone2?: string;
    telephone3?: string;
    email_address?: string;
    job_title?: string;
  };
  supplier?: {
    id?: string;
    supplier_name?: string;
    supplier_code?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address_line1?: string;
    address_line2?: string;
    address_line3?: string;
    address_line4?: string;
    postcode?: string;
  };
  sold_supplier_name?: string;
  notes?: SubmittedSaleNote[];
  update_histories?: Array<{
    id: number;
    created_at: string;
    updated_at: string;
    status: string;
    created_by_name?: string;
    created_by?: number;
    created_by_email?: string;
  }>;
  additional_documents?: Array<{
    id?: number;
    title?: string;
    file_url?: string;
    created_at?: string;
  }>;
}

/** Paginated invoice list returned by GET /api/v1/auth/web/core/invoice/?company_id= */
interface CompanyInvoiceApiRow {
  id: string;
  invoice_datetime?: string | null;
  total_received?: string | null;
  vat?: string | null;
  total?: string | null;
  reference?: string | null;
  notes?: string | null;
  company?: { company_name?: string | null } | null;
}

interface CompanyInvoiceListPayload {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: CompanyInvoiceApiRow[];
}

interface SubmittedSalesDetailsProps {
  id: string;
}

const SubmittedSalesDetails = ({ id }: SubmittedSalesDetailsProps) => {
  const router = useRouter();
  const [details, setDetails] = useState<SubmittedSaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  // Contract status radio selection; start unselected by default
  const [contractStatus, setContractStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [companyNotes, setCompanyNotes] = useState<SubmittedSaleNote[]>([]);
  const [companyTickets, setCompanyTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isQueryTypeModalOpen, setIsQueryTypeModalOpen] = useState(false);
  const [isQueryTypeLoading, setIsQueryTypeLoading] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(
    null,
  );
  const [voidReason, setVoidReason] = useState("");
  /** When true, shows the LOA form modal; closed on success via onSuccessCallback. */
  const [isLoaFormOpen, setIsLoaFormOpen] = useState(false);
  /** Invoice / paid history for this company (from core invoice API). */
  const [isPaidHistoryModalOpen, setIsPaidHistoryModalOpen] = useState(false);
  const [paidHistoryInvoices, setPaidHistoryInvoices] = useState<
    CompanyInvoiceApiRow[]
  >([]);
  const [isLoadingPaidHistory, setIsLoadingPaidHistory] = useState(false);
  /**
   * Dedicated POST hook for voiding an existing DocuSign LOA envelope.
   * On success we close the modal, clear local state and refresh the details so
   * that the updated LOA status (for example, SENT → VOID) is reflected in the UI.
   */
  const { executePost: executeVoidEnvelope, loading: isVoidingEnvelope } =
    usePostApiCall({
      onSuccess: async () => {
        toast.success("Envelope voided successfully.");
        setIsVoidModalOpen(false);
        setVoidReason("");
        setSelectedEnvelopeId(null);
        await fetchDetails();
      },
      onError: (message) => {
        toast.error(message || "Failed to void envelope");
      },
    });

  const QUERY_TYPE_OPTIONS = [
    { value: "CONTRACT_STATUS_QUERY", label: "CONTRACT STATUS QUERY" },
    { value: "INVOICE", label: "INVOICE" },
    { value: "RE_APPLY_REQUEST", label: "RE APPLY REQUEST" },
    { value: "BESPOKE_PRICE_QUERY", label: "BESPOKE PRICE QUERY" },
    { value: "PRE_CREDIT_CHECK", label: "PRE-CREDIT CHECK" },
    { value: "COMMISSION_QUERY", label: "COMMISSION QUERY" },
    { value: "LOA", label: "LOA (Letter Of Authority)" },
    { value: "OBJECTION", label: "OBJECTION" },
    { value: "OTHERS", label: "OTHERS" },
  ] as const;

  const handleQueryTypeSelect = (queryType: string) => {
    setIsQueryTypeLoading(true);
    const companyId = details?.company?.id || details?.company?.id;
    const baseUrl = `/tickets/add-ticket?queryType=${encodeURIComponent(queryType)}`;
    const url = companyId ? `${baseUrl}&companyId=${companyId}` : baseUrl;
    router.push(url);
  };

  /**
   * Loads invoices for the current company and opens the paid history modal.
   * API: GET /api/v1/auth/web/core/invoice/?company_id=...
   */
  const handlePaidHistoryClick = useCallback(async () => {
    const companyId = details?.company?.id;
    if (!companyId) {
      toast.error("Company information is not available.");
      return;
    }

    setIsPaidHistoryModalOpen(true);
    setIsLoadingPaidHistory(true);
    setPaidHistoryInvoices([]);

    try {
      const response = await getDropdown(
        `/api/v1/auth/web/core/invoice/?company_id=${encodeURIComponent(companyId)}`,
      );

      if (!response.success) {
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          setIsPaidHistoryModalOpen(false);
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
          return;
        }
        toast.error(response.message || "Failed to load paid history");
        return;
      }

      const payload = response.data as CompanyInvoiceListPayload | undefined;
      setPaidHistoryInvoices(payload?.results ?? []);
    } catch (error) {
      console.error("Paid history fetch error:", error);
      toast.error("An error occurred while loading paid history");
    } finally {
      setIsLoadingPaidHistory(false);
    }
  }, [details?.company?.id, router]);

  // Fetch submitted sale details
  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getDropdown(
        `/api/v1/auth/web/core/submitted-sales/${id}/`,
      );

      if (!response.success) {
        if (
          response.errors &&
          typeof response.errors === "object" &&
          "authError" in response.errors
        ) {
          toast.error("Token expired. Authentication required.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push("/login");
          return;
        }

        console.error(
          "Failed to fetch submitted sale details:",
          response.message,
        );
        toast.error(response.message || "Failed to fetch details");
      } else {
        if (response.data) {
          const data = response.data as SubmittedSaleDetails;
          setDetails(data);
          // Set initial contract status from lead_status or status
          const initialStatus = data.lead_status?.name || data.status;
          if (initialStatus) {
            setContractStatus(initialStatus);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching submitted sale details:", error);
      toast.error("An error occurred while fetching details");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  // Fetch company notes from the company-notes API
  const fetchCompanyNotes = useCallback(
    async (companyId: string) => {
      try {
        const response = await getDropdown(
          `/api/v1/auth/web/core/company-notes/?company=${companyId}`,
        );

        if (!response.success) {
          if (
            response.errors &&
            typeof response.errors === "object" &&
            "authError" in response.errors
          ) {
            toast.error("Token expired. Authentication required.");
            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push("/login");
            return;
          }

          console.error("Failed to fetch company notes:", response.message);
          // Don't show error toast for notes, just log it
        } else {
          if (response.data) {
            // Handle both array response and paginated response
            const notesData = Array.isArray(response.data)
              ? response.data
              : (response.data as { results?: unknown[] }).results || [];

            setCompanyNotes(notesData as SubmittedSaleNote[]);
          }
        }
      } catch (error) {
        console.error("Error fetching company notes:", error);
        // Don't show error toast for notes, just log it
      }
    },
    [router],
  );

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, fetchDetails]);

  // Fetch company notes when company ID is available
  useEffect(() => {
    const companyId = details?.company?.id || details?.company?.id;
    if (companyId) {
      fetchCompanyNotes(companyId);
    }
  }, [details?.company?.id, fetchCompanyNotes]);

  // Fetch company tickets
  const fetchCompanyTickets = useCallback(
    async (companyId: string) => {
      try {
        setIsLoadingTickets(true);
        const result = await getTicketsList({
          company: companyId,
          page_size: 100, // Fetch a reasonable number of tickets
        });

        if (result.success && result.data) {
          setCompanyTickets(result.data.results as Ticket[]);
        } else {
          if (
            result.errors &&
            typeof result.errors === "object" &&
            "authError" in result.errors
          ) {
            toast.error("Token expired. Authentication required.");
            await new Promise((resolve) => setTimeout(resolve, 500));
            router.push("/login");
            return;
          }
          console.error("Failed to fetch company tickets:", result.message);
          // Don't show error toast for tickets, just log it
          setCompanyTickets([]);
        }
      } catch (error) {
        console.error("Error fetching company tickets:", error);
        // Don't show error toast for tickets, just log it
        setCompanyTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    },
    [router],
  );

  // Fetch company tickets when company ID is available
  useEffect(() => {
    const companyId = details?.company?.id;
    if (companyId) {
      fetchCompanyTickets(companyId);
    }
  }, [details?.company?.id, fetchCompanyTickets]);

  // Handle ticket click - navigate to ticket details
  const handleTicketClick = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.public_id}`);
  };

  // API hook for posting notes
  const { executePost, loading: isSubmittingNote } = usePostApiCall({
    onSuccess: () => {
      toast.success("Note added successfully!");
      setStatusNote("");
      // Refresh company notes to show the new note
      const companyId = details?.company?.id;
      if (companyId) {
        fetchCompanyNotes(companyId);
      }
    },
    onError: (message) => {
      toast.error(`Failed to add note: ${message}`);
    },
    showSuccessMessage: false,
    showErrorMessage: false,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    // Revoke previous preview URL if exists
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }

    if (file) {
      setSelectedFile(file);
      // Only create preview URL for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async () => {
    if (!fileTitle.trim()) {
      toast.error("Please enter a file title");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploadingFile(true);
      toast.loading("Uploading additional document...");

      const result = await uploadSubmittedSaleDocumentAction(
        selectedFile,
        id,
        fileTitle,
      );

      toast.dismiss();

      if (result.success) {
        toast.success(
          result.message || "Additional document uploaded successfully",
        );
        setFileTitle("");
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
        }
        setSelectedFile(null);
        setFilePreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh details to reflect any changes from backend
        await fetchDetails();
      } else {
        toast.error(result.message || "Failed to upload additional document");
      }
    } catch (error) {
      console.error("Error uploading additional document:", error);
      toast.dismiss();
      toast.error("An unexpected error occurred while uploading document");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusNote.trim()) {
      toast.error("Please enter a note for the status update");
      return;
    }

    if (statusNote.trim().length < 3) {
      toast.error("Note must be at least 3 characters long");
      return;
    }

    if (statusNote.trim().length > 1000) {
      toast.error("Note cannot exceed 1000 characters");
      return;
    }

    const companyId = details?.company?.id;
    if (!companyId) {
      toast.error("Company information not available");
      return;
    }

    // Add note with lead_status in payload
    const payload = {
      detail: statusNote.trim(),
      company: companyId,
      lead_status: contractStatus,
    };

    await executePost("/api/v1/auth/web/core/company-notes/", payload);
  };

  /**
   * Safely read the current DocuSign envelope ID from the submitted sale details.
   * Some backends attach it directly to the company payload, others at the root;
   * we support both and gracefully fall back to null when it's not present.
   */
  const getCurrentEnvelopeId = (): string | null => {
    const companyWithEnvelope = details?.company as unknown as {
      loa_envelope_id?: string | null;
    } | null;

    if (companyWithEnvelope?.loa_envelope_id) {
      return companyWithEnvelope.loa_envelope_id;
    }

    const rootWithEnvelope = details as unknown as {
      loa_envelope_id?: string | null;
    } | null;

    return rootWithEnvelope?.loa_envelope_id ?? null;
  };

  /**
   * Open the void LOA modal for the current company.
   * If we cannot resolve an envelope ID from the details payload, we block the
   * action and surface a clear error to the user instead of failing silently.
   */
  const handleOpenVoidModal = () => {
    const envelopeId = getCurrentEnvelopeId();

    if (!envelopeId) {
      toast.error("Envelope ID is missing for this company");
      console.error(
        "Cannot open void LOA modal from SubmittedSalesDetails: missing loa_envelope_id on details/company",
      );
      return;
    }

    setSelectedEnvelopeId(envelopeId);
    setVoidReason("");
    setIsVoidModalOpen(true);
  };

  /**
   * Close the void LOA modal and clear local envelope / reason state.
   */
  const handleCloseVoidModal = () => {
    setIsVoidModalOpen(false);
    setVoidReason("");
    setSelectedEnvelopeId(null);
  };

  /**
   * Submit handler for voiding the current LOA envelope.
   * Mirrors the DocuSign table behaviour by calling the same backend endpoint
   * with `envelope_id` and a mandatory `void_reason`.
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

  // Get primary contact or first contact from company
  const primaryContact =
    details?.company?.contacts?.find((contact) => contact.is_primary) ||
    details?.contact;

  // Combine notes and update histories for the timeline
  const updateHistories = details?.update_histories || [];
  const timelineItems = [
    ...updateHistories.map((history) => ({
      id: history.id,
      type: "status" as const,
      author: history.created_by_name || "Unknown",
      email: history.created_by_email || history.created_by_name || "",
      timestamp: formatDateWithMonthName(history.created_at),
      content: `Status update to : ${history.status}`,
      created_at: history.created_at,
    })),
    ...(companyNotes?.map((note) => ({
      id: note.id,
      type: "note" as const,
      author: note.created_by_name || "Unknown",
      email: note.created_by_email || note.created_by_name || "",
      timestamp: formatDateWithMonthName(note.created_at),
      content: note.detail,
      created_at: note.created_at,
    })) || []),
  ].sort((a, b) => {
    // Sort by created_at descending (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Format creation date - use created_at or submitted_datetime
  const formattedCreatedDate =
    details?.created_at || details?.submitted_datetime
      ? formatDateWithMonthName(
          details.created_at || details.submitted_datetime,
        )
      : "N/A";

  // Get contact details - prefer company_detail.contacts, fallback to contact
  const contactName = primaryContact
    ? `${primaryContact.first_name || ""} ${primaryContact.last_name || ""}`.trim() ||
      "N/A"
    : "N/A";
  const contactTitle = primaryContact?.title || "N/A";
  const contactLandline = primaryContact?.telephone1 || "N/A";
  const contactMobile =
    primaryContact?.telephone2 || primaryContact?.telephone3 || "N/A";
  const contactEmail = primaryContact?.email_address || "N/A";
  const contactJobTitle = primaryContact?.job_title || "N/A";

  // Get company details - prefer company_detail, fallback to company
  const companyData = details?.company;
  const businessName = companyData?.company_name || "N/A";
  const registrationNo = companyData?.registration_no || "N/A";
  const businessType = details?.company?.business_type_name || "N/A";
  const numberOfEmployees = details?.company?.number_of_employees || "N/A";
  const estimatedTurnover = details?.company?.estimated_turnover || "N/A";
  const isMicroBusiness = details?.company?.is_micro_business ? "Yes" : "No";

  // Get current address
  const currentAddress =
    [
      companyData?.current_address_line1,
      companyData?.current_address_line2,
      companyData?.current_address_line3,
      companyData?.current_address_line4,
      companyData?.current_postcode,
    ]
      .filter(Boolean)
      .join(", ") || "N/A";

  // Get billing address - use current address if billing not available
  const billingAddress = details?.company?.current_address_line1
    ? [
        details.company.current_address_line1,
        details.company.current_address_line2,
        details.company.current_address_line3,
        details.company.current_address_line4,
        details.company.current_postcode,
      ]
        .filter(Boolean)
        .join(", ") || "N/A"
    : currentAddress;

  // Get director details - use owner_partner_name from company_detail
  const ownerPartnerName = details?.company?.owner_partner_name || "";
  const ownerNameParts = ownerPartnerName
    ? ownerPartnerName.trim().split(/\s+/)
    : [];
  const directorFirstName =
    ownerNameParts.length > 0 ? ownerNameParts[0] : "N/A";
  const directorLastName =
    ownerNameParts.length > 1 ? ownerNameParts.slice(1).join(" ") : "N/A";
  const directorName =
    ownerPartnerName ||
    (directorFirstName !== "N/A" && directorLastName !== "N/A"
      ? `${directorFirstName} ${directorLastName}`
      : directorFirstName !== "N/A"
        ? directorFirstName
        : directorLastName !== "N/A"
          ? directorLastName
          : "N/A");

  // Get supplier details - use sold_supplier_name_display from company_detail
  const supplierName =
    details?.company?.sold_supplier_name_display ||
    details?.sold_supplier_name ||
    details?.supplier?.supplier_name ||
    "N/A";
  const supplierCode = details?.supplier?.supplier_code || "N/A";
  const supplierContactName = details?.supplier?.contact_name || "N/A";
  const supplierContactEmail = details?.supplier?.contact_email || "N/A";
  const supplierContactPhone = details?.supplier?.contact_phone || "N/A";
  const supplierAddress =
    [
      details?.supplier?.address_line1,
      details?.supplier?.address_line2,
      details?.supplier?.address_line3,
      details?.supplier?.address_line4,
      details?.supplier?.postcode,
    ]
      .filter(Boolean)
      .join(", ") || "N/A";

  // Get contract type (Electricity/Gas) - prefer company_detail.contract_type
  const contractType =
    details?.company?.contract_type || details?.contract_type || "Electricity";

  // Get status - use lead_status.name
  const status = details?.lead_status?.name || details?.status || "N/A";
  console.log(details, "details");
  if (isLoading) {
    return (
      <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Loading submitted sale details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8">
      {/* Query Type Selection Modal for creating tickets */}
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

      {/* Void LOA Envelope Modal */}
      <Dialog open={isVoidModalOpen} onOpenChange={handleCloseVoidModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Void LOA Envelope
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Please provide a reason for voiding this LOA. This action cannot
              be undone.
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
                placeholder="Enter the reason for voiding this LOA..."
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
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isVoidingEnvelope || !voidReason.trim()}
              >
                {isVoidingEnvelope ? "Voiding..." : "Yes, Void LOA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LOA Form Modal: on success we close and refetch so user stays on this page */}
      <Dialog open={isLoaFormOpen} onOpenChange={setIsLoaFormOpen}>
        <DialogContent className="account-modal sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Generate LOA (Letter of Authority)
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Fill in the details below to send the LOA for signing. The company
              is pre-selected from this submitted sale.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <LOAForm
              queryType="LOA"
              initialCompanyId={details?.company?.id ?? null}
              onSuccessCallback={async () => {
                setIsLoaFormOpen(false);
                // Force LOA status to SENT so "Generate LOA" hides and status badge shows (backend may not have updated yet)
                const applyLoaSent = () =>
                  setDetails((prev) => {
                    if (!prev?.company) return prev;
                    return {
                      ...prev,
                      company: {
                        ...prev.company,
                        loa_esign_status: "SENT",
                      },
                    };
                  });
                applyLoaSent();
                await fetchDetails();
                // Refetch overwrites state; patch in next tick so our update runs after refetch's setState
                setTimeout(applyLoaSent, 0);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Paid history: company invoices from core invoice API */}
      <Dialog
        open={isPaidHistoryModalOpen}
        onOpenChange={setIsPaidHistoryModalOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden bg-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Paid history
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Invoice records for this company (amounts as returned by the
              server).
            </DialogDescription>
          </DialogHeader>
          <div className="relative min-h-[200px]">
            {isLoadingPaidHistory && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Loading invoices…</p>
                </div>
              </div>
            )}
            {!isLoadingPaidHistory && paidHistoryInvoices.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                No invoice records found for this company.
              </p>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-white">
                        Company name
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-white">
                        Invoice date
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-white">
                        Total received
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-white">
                        VAT
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-white">
                        Total (incl. VAT)
                      </TableHead>
                      <TableHead className="min-w-[120px] text-white">
                        Notes
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-white">
                        Reference
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidHistoryInvoices.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.company?.company_name?.trim() || "—"}
                        </TableCell>
                        <TableCell>
                          {row.invoice_datetime
                            ? formatDateWithMonthName(row.invoice_datetime)
                            : "—"}
                        </TableCell>
                        <TableCell>{row.total_received ?? "—"}</TableCell>
                        <TableCell>{row.vat ?? "—"}</TableCell>
                        <TableCell>{row.total ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] break-words text-gray-700">
                          {row.notes?.trim() ? row.notes : "—"}
                        </TableCell>
                        <TableCell>{row.reference?.trim() || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contract Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Contract Details Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl font-semibold text-[#363636]">
                      Contract Details
                    </CardTitle>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {contractType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Created on : {formattedCreatedDate}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      status === "Closed"
                        ? "bg-red-100 text-red-800"
                        : status === "Ready for Processing" ||
                            "Work In Progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "Live"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {status}
                  </span>
                  {/* LOA e-sign status: button when not_sent, badges for sent/signed_back/void */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(details?.company?.loa_esign_status === "NOT_SENT" ||
                      details?.company?.loa_esign_status == null) && (
                      <Button
                        type="button"
                        onClick={() => setIsLoaFormOpen(true)}
                        className="bg-[#2DB9EB] hover:bg-[#1ca0cf] text-white text-sm font-medium"
                      >
                        Generate LOA
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => {
                        void handlePaidHistoryClick();
                      }}
                      className="bg-emerald-500 hover:bg-emerald-700 text-white text-sm font-medium"
                    >
                      Paid History
                    </Button>
                  </div>
                  {details?.company?.loa_esign_status === "SENT" && (
                    <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      LOA Not signed back
                    </span>
                  )}
                  {details?.company?.loa_esign_status === "SIGNED_BACK" && (
                    <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      LOA Signed
                    </span>
                  )}
                  {details?.company?.loa_esign_status === "VOID" && (
                    <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                      LOA Cancelled
                    </span>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary"
                    onClick={() => setIsQueryTypeModalOpen(true)}
                  >
                    Add Ticket
                  </Button>
                  {details?.company?.loa_esign_status === "SENT" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleOpenVoidModal}
                      disabled={isVoidingEnvelope}
                    >
                      {isVoidingEnvelope ? "Voiding..." : "Void"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Additional Documents Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Upload Additional Documents
                </h3>
                {details?.additional_documents &&
                  details.additional_documents.length > 0 && (
                    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        Existing documents
                      </p>
                      <div className="space-y-2">
                        {details.additional_documents.map((doc) => (
                          <div
                            key={doc.id ?? `${doc.title}-${doc.file_url}`}
                            className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              {doc.file_url &&
                                (/\.(png|jpe?g|gif|webp)$/i.test(
                                  doc.file_url,
                                ) ? (
                                  <img
                                    src={doc.file_url}
                                    alt={doc.title || "Document"}
                                    className="h-10 w-10 rounded border border-gray-200 object-cover bg-white"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-600">
                                    {doc.file_url
                                      .split(".")
                                      .pop()
                                      ?.toUpperCase() || "FILE"}
                                  </div>
                                ))}
                              <div className="flex flex-col">
                                <span className="max-w-[220px] truncate font-medium text-gray-800">
                                  {doc.title || "Untitled document"}
                                </span>
                                {doc.created_at && (
                                  <span className="text-xs text-gray-500">
                                    {formatDateWithMonthName(doc.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Open
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-title" className="mb-2 block">
                      File Title
                    </Label>
                    <Input
                      id="file-title"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="Enter file title"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <label
                      htmlFor="file-upload"
                      className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="file"
                        id="file-upload"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click here upload any document.
                      </p>
                      {selectedFile && (
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedFile.name}
                        </p>
                      )}
                    </label>
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      className="self-start text-primary border-primary"
                    >
                      Browse
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        {filePreviewUrl &&
                        selectedFile.type.startsWith("image/") ? (
                          <img
                            src={filePreviewUrl}
                            alt={selectedFile.name}
                            className="h-12 w-12 rounded border border-gray-200 object-cover bg-white"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-white text-[10px] font-semibold text-gray-600">
                            {(
                              selectedFile.name.split(".").pop() || "FILE"
                            ).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="max-w-[180px] truncate text-sm font-medium text-gray-800">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {`${(selectedFile.size / 1024).toFixed(1)} KB`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-2 rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove selected file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <Button
                    onClick={handleFileUpload}
                    disabled={isUploadingFile}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isUploadingFile
                      ? "Uploading additional document..."
                      : "Upload additional document"}
                  </Button>
                </div>
              </div>

              {/* Contract Status Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Contract Status
                </h3>
                <div className="space-y-4">
                  <RadioGroup
                    value={contractStatus}
                    onValueChange={setContractStatus}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Ready for Processing"
                        id="ready"
                        className="cursor-pointer"
                      />
                      <Label htmlFor="ready" className="cursor-pointer flex-1">
                        Ready for Processing
                      </Label>
                    </div>
                  </RadioGroup>
                  <div>
                    <Label htmlFor="status-note" className="mb-2 block">
                      Note
                    </Label>
                    <Textarea
                      id="status-note"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Enter status update note"
                      rows={4}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isSubmittingNote}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmittingNote ? "Submitting..." : "Update Status"}
                  </Button>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Contact details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="business-name" className="mb-2 block">
                      Business Name
                    </Label>
                    <Input
                      id="business-name"
                      value={businessName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-title" className="mb-2 block">
                      Title
                    </Label>
                    <Input
                      id="contact-title"
                      value={contactTitle}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-name" className="mb-2 block">
                      Contact Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-job-title" className="mb-2 block">
                      Job Title
                    </Label>
                    <Input
                      id="contact-job-title"
                      value={contactJobTitle}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email" className="mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-landline" className="mb-2 block">
                      Landline
                    </Label>
                    <Input
                      id="contact-landline"
                      value={contactLandline}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-mobile" className="mb-2 block">
                      Mobile
                    </Label>
                    <Input
                      id="contact-mobile"
                      value={contactMobile}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Details Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Supply details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supplier-name" className="mb-2 block">
                      Supplier Name
                    </Label>
                    <Input
                      id="supplier-name"
                      value={supplierName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-code" className="mb-2 block">
                      Supplier Code
                    </Label>
                    <Input
                      id="supplier-code"
                      value={supplierCode}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="supplier-contact-name"
                      className="mb-2 block"
                    >
                      Contact Name
                    </Label>
                    <Input
                      id="supplier-contact-name"
                      value={supplierContactName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="supplier-contact-email"
                      className="mb-2 block"
                    >
                      Contact Email
                    </Label>
                    <Input
                      id="supplier-contact-email"
                      type="email"
                      value={supplierContactEmail}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="supplier-contact-phone"
                      className="mb-2 block"
                    >
                      Contact Phone
                    </Label>
                    <Input
                      id="supplier-contact-phone"
                      value={supplierContactPhone}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-address" className="mb-2 block">
                      Address
                    </Label>
                    <Textarea
                      id="supplier-address"
                      value={supplierAddress}
                      disabled
                      rows={3}
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  {details?.company?.sites?.length ? (
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-[#363636] mb-3">
                        Meter details
                      </h4>
                      <div className="space-y-4">
                        {details.company.sites.map((site) => (
                          <div key={site.id} className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">
                              {site.sitename || "Site"}{" "}
                              {site.postcode ? `(${site.postcode})` : ""}
                            </p>
                            {site.meters?.map((meter) => {
                              const mpanDetails = meter.mpan_mrpn_details;
                              if (!mpanDetails) return null;

                              const isMpan = !!mpanDetails.is_mpan;
                              const isMrpn = !!mpanDetails.is_mrpn;
                              const mpanTopline =
                                isMpan &&
                                mpanDetails.LLF &&
                                mpanDetails.MTC &&
                                mpanDetails.Region
                                  ? `${mpanDetails.LLF}${mpanDetails.MTC}${mpanDetails.Region}`
                                  : "";

                              if (!isMpan && !isMrpn) {
                                return null;
                              }

                              return (
                                <div
                                  key={meter.meterid}
                                  className="space-y-3 rounded-md bg-[#F5F5F5] p-3"
                                >
                                  {meter.meter_type_name && (
                                    <p className="text-xs font-medium text-gray-600">
                                      {meter.meter_type_name}
                                    </p>
                                  )}

                                  {isMpan && (
                                    <>
                                      <div>
                                        <Label
                                          htmlFor={`mpan-topline-${meter.meterid}`}
                                          className="mb-1 block"
                                        >
                                          MPAN Topline
                                        </Label>
                                        <Input
                                          id={`mpan-topline-${meter.meterid}`}
                                          value={mpanTopline || "N/A"}
                                          disabled
                                          className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                        />
                                      </div>
                                      <div>
                                        <Label
                                          htmlFor={`mpan-bottomline-${meter.meterid}`}
                                          className="mb-1 block"
                                        >
                                          MPAN Bottomline
                                        </Label>
                                        <Input
                                          id={`mpan-bottomline-${meter.meterid}`}
                                          value={
                                            mpanDetails.bottomline || "N/A"
                                          }
                                          disabled
                                          className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {isMrpn && (
                                    <div>
                                      <Label
                                        htmlFor={`mprn-${meter.meterid}`}
                                        className="mb-1 block"
                                      >
                                        MPRN
                                      </Label>
                                      <Input
                                        id={`mprn-${meter.meterid}`}
                                        value={
                                          mpanDetails.mpan_mrpn_text ||
                                          mpanDetails.bottomline ||
                                          "N/A"
                                        }
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Billing Address Details Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Billing address details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billing-address" className="mb-2 block">
                      Billing Address
                    </Label>
                    <Textarea
                      id="billing-address"
                      value={billingAddress}
                      disabled
                      rows={4}
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Company Details Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Company details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="company-registration"
                      className="mb-2 block"
                    >
                      Registration Number
                    </Label>
                    <Input
                      id="company-registration"
                      value={registrationNo}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-address" className="mb-2 block">
                      Company Address
                    </Label>
                    <Textarea
                      id="company-address"
                      value={currentAddress}
                      disabled
                      rows={4}
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-type" className="mb-2 block">
                      Business Type
                    </Label>
                    <Input
                      id="business-type"
                      value={businessType}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number-of-employees" className="mb-2 block">
                      Number of Employees
                    </Label>
                    <Input
                      id="number-of-employees"
                      value={numberOfEmployees}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated-turnover" className="mb-2 block">
                      Estimated Turnover
                    </Label>
                    <Input
                      id="estimated-turnover"
                      value={estimatedTurnover}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="micro-business" className="mb-2 block">
                      Micro Business
                    </Label>
                    <Input
                      id="micro-business"
                      value={isMicroBusiness}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Director Details Section */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Director details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="director-first-name" className="mb-2 block">
                      Director First Name
                    </Label>
                    <Input
                      id="director-first-name"
                      value={directorFirstName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="director-last-name" className="mb-2 block">
                      Director Last Name
                    </Label>
                    <Input
                      id="director-last-name"
                      value={directorLastName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="director-full-name" className="mb-2 block">
                      Director Full Name
                    </Label>
                    <Input
                      id="director-full-name"
                      value={directorName}
                      disabled
                      className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Details Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Plan details
                </h3>
                {details?.company?.sites && details.company.sites.length > 0 ? (
                  <div className="space-y-4">
                    {details.company.sites.map((site) => (
                      <div key={site.id} className="space-y-4">
                        {site.meters && site.meters.length > 0 && (
                          <>
                            <p className="text-sm font-semibold text-gray-700">
                              {site.sitename}
                            </p>
                            {site.meters.map((meter) => {
                              return (
                                <div
                                  key={meter.meterid}
                                  className="space-y-4 rounded-md bg-[#F5F5F5] p-4"
                                >
                                  {meter.meter_type_name && (
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                      {meter.meter_type_name}
                                      {meter.meter_reference
                                        ? ` - Reference: ${meter.meter_reference}`
                                        : ""}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label
                                        htmlFor={`day-rate-${meter.meterid}`}
                                        className="mb-2 block"
                                      >
                                        Day Rate
                                      </Label>
                                      <Input
                                        id={`day-rate-${meter.meterid}`}
                                        value={meter.latestSoldDayRate || "N/A"}
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`evening-weekend-rate-${meter.meterid}`}
                                        className="mb-2 block"
                                      >
                                        Evening/Weekend Rate
                                      </Label>
                                      <Input
                                        id={`evening-weekend-rate-${meter.meterid}`}
                                        value={
                                          meter.latestSoldEveningWeekendRate ||
                                          "N/A"
                                        }
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`night-rate-${meter.meterid}`}
                                        className="mb-2 block"
                                      >
                                        Night Rate
                                      </Label>
                                      <Input
                                        id={`night-rate-${meter.meterid}`}
                                        value={
                                          meter.latestSoldNightRate || "N/A"
                                        }
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`standing-charge-${meter.meterid}`}
                                        className="mb-2 block"
                                      >
                                        Standing Charge
                                      </Label>
                                      <Input
                                        id={`standing-charge-${meter.meterid}`}
                                        value={
                                          meter.latestSoldStandingCharge ||
                                          "N/A"
                                        }
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                    <div>
                                      <Label
                                        htmlFor={`winter-rate-${meter.meterid}`}
                                        className="mb-2 block"
                                      >
                                        Winter Rate
                                      </Label>
                                      <Input
                                        id={`winter-rate-${meter.meterid}`}
                                        value={
                                          meter.latestSoldWinterRate || "N/A"
                                        }
                                        disabled
                                        className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No plan details available
                  </div>
                )}
              </div>

              {/* Bank Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#363636] mb-4">
                  Bank details
                </h3>
                {details?.company?.banks && details.company.banks.length > 0 ? (
                  <div className="space-y-4">
                    {details.company.banks
                      .filter((bank) => bank.is_active && !bank.is_deleted)
                      .map((bank, index) => (
                        <div
                          key={bank.id || index}
                          className="space-y-4 rounded-md bg-[#F5F5F5] p-4"
                        >
                          <div>
                            <Label
                              htmlFor={`bank-name-${bank.id || index}`}
                              className="mb-2 block"
                            >
                              Bank Name
                            </Label>
                            <Input
                              id={`bank-name-${bank.id || index}`}
                              value={bank.bank_name || "N/A"}
                              disabled
                              className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`account-name-${bank.id || index}`}
                              className="mb-2 block"
                            >
                              Account Name
                            </Label>
                            <Input
                              id={`account-name-${bank.id || index}`}
                              value={bank.account_name || "N/A"}
                              disabled
                              className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`account-number-${bank.id || index}`}
                              className="mb-2 block"
                            >
                              Account Number
                            </Label>
                            <Input
                              id={`account-number-${bank.id || index}`}
                              value={bank.account_number || "N/A"}
                              disabled
                              className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`sort-code-${bank.id || index}`}
                              className="mb-2 block"
                            >
                              Sort Code
                            </Label>
                            <Input
                              id={`sort-code-${bank.id || index}`}
                              value={bank.sort_code || "N/A"}
                              disabled
                              className="w-full bg-[#E4E4E4] text-gray-900 cursor-not-allowed disabled:opacity-100"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No bank details available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contract Notes */}
        <div>
          <Card>
            <CardContent className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold text-[#363636]">
                  Contract Notes
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Update Trail</p>
              </CardHeader>
              <ScrollArea className="h-[600px] w-full custom-scrollbar">
                <div className="px-3 sm:px-5 py-2">
                  {timelineItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No notes or updates available
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                      {timelineItems.map((item) => (
                        <div key={item.id} className="relative mb-6 pl-12">
                          {/* Avatar */}
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold z-10">
                            {item.author.charAt(0).toUpperCase()}
                          </div>
                          {/* Content */}
                          <Card className="bg-[#F5F5F5] rounded-[10px]">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-black">
                                      {item.email || item.author}
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {item.timestamp}
                                  </span>
                                </div>
                                <div className="text-xs text-black leading-relaxed">
                                  {item.content}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Company Tickets Section */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-semibold text-[#363636]">
                  Company Tickets
                </CardTitle>
              </CardHeader>
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading tickets...</p>
                  </div>
                </div>
              ) : companyTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tickets found for this company
                </div>
              ) : (
                <div className="space-y-3">
                  {companyTickets.map((ticket) => (
                    <div
                      key={ticket.public_id}
                      onClick={() => handleTicketClick(ticket)}
                      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#363636] mb-1 truncate">
                            {ticket.subject || "Untitled Ticket"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.tracking_id}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                            ticket.status === TICKET_STATUS.Closed
                              ? "bg-[#FF605C] text-white"
                              : "bg-[#FFC62A] text-white"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SubmittedSalesDetails;
