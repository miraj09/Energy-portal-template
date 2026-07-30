"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePostApiCall } from "@/composable";
import { getDropdown } from "@/lib/actions/getDropdown";
import { postMethod } from "@/lib/actions/postMethod";
import { uploadLoaFileAction } from "@/lib/actions/uploadLoaFile";

/** Ticket API path used by TicketForm; same payload shape for LOA-created tickets. */
const TICKETS_API_ENDPOINT = "/api/v1/auth/web/utility/tickets/";

/**
 * Optional prefill values from Submitted Sales Details (or similar).
 * Only non-empty values are applied, and only onto fields the user has not edited yet.
 */
export interface LoaFormInitialValues {
  customerName?: string | null;
  mpanMprn?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  designation?: string | null;
  businessName?: string | null;
  companyRegNo?: string | null;
  currentSupplier?: string | null;
  businessAddress?: string | null;
  /** Maps to Yes/No radios; omit when unknown. */
  microBusiness?: "yes" | "no" | null;
  /** Service checkboxes; only applied when none are checked yet. */
  services?: {
    electricity?: boolean;
    gas?: boolean;
    waste?: boolean;
  };
}

/** LOA form: company selection and Generate LOA action only. */
interface LOAFormProps {
  /** Selected query type from `AddTicket.tsx` (e.g. "OTHERS"). Kept for future use. */
  queryType: string;
  /**
   * Optional initial company id coming from the Add Ticket URL
   * (e.g. /tickets/add-ticket?queryType=OTHERS&companyId=123).
   * When provided, the LOA form will pre-select this company.
   */
  initialCompanyId?: string | null;
  /**
   * Prefill LOA fields from submitted sale / company detail.
   * Empty / null / "N/A" values are ignored; existing user input is not overwritten.
   */
  initialValues?: LoaFormInitialValues | null;
  /**
   * Optional callback when LOA is sent successfully. When provided, this is
   * called instead of redirecting to the tickets page (e.g. to close a modal
   * and refetch details so the user stays on the current page).
   */
  onSuccessCallback?: () => void | Promise<void>;
}

/** Treat blank / "N/A" display placeholders as missing for autofill. */
function presentPrefill(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.toUpperCase() === "N/A") return "";
  return trimmed;
}

interface Company {
  id: number | string;
  company_name?: string;
}

interface CompanyApiResponse {
  results: Company[];
  next: string | null;
}

/**
 * Shape of the LOA form fields shown in the UI and sent to the
 * `/send-signing-loa-manual/` endpoint.
 */
interface LoaFormFields {
  customerName: string;
  mpanMprn: string;
  contactNumber: string;
  email: string;
  designation: string;
  businessName: string;
  companyRegNo: string;
  currentSupplier: string;
  businessAddress: string;
  typeOfRequest: string;
  services: {
    electricity: boolean;
    gas: boolean;
    // water: boolean;
    // telecom: boolean;
    // paymentTerminal: boolean;
    waste: boolean;
  };
  microBusiness: "yes" | "no" | null;
  subject: string;
  description: string;
  /** Multiple files selected via the file input (multiselect). */
  attachments: File[];
}
/**
 * Manual LOA signing endpoint specified by backend:
 * POST /api/v1/auth/web/core/send-signing-loa-manual/
 */
const SEND_SIGNING_LOA_ENDPOINT =
  "/api/v1/auth/web/core/send-signing-loa-manual/";

const TICKETS_PAGE_PATH = "/tickets";

const COMPANY_PAGE_SIZE = 10;
const COMPANY_SEARCH_DEBOUNCE_MS = 500;

const REQUEST_TYPE_OPTIONS = [
  {value: "Renewal Authorisation", label: "Renewal Authorisation"},
  {value: "Termination Request", label: "Termination Request"},
  {value: "Bill Copy Request", label: "Bill Copy Request"},
  {value: "Meter Reading Submission", label: "Meter Reading Submission"},
  {value: "LoA Send Request", label: "LoA Send Request"},
]
export default function LOAForm({
  queryType,
  initialCompanyId,
  initialValues,
  onSuccessCallback,
}: LOAFormProps) {
  const router = useRouter();
  const onSuccessCallbackRef = useRef(onSuccessCallback);
  onSuccessCallbackRef.current = onSuccessCallback;

  const [companyId, setCompanyId] = useState("");
  const [selectedCompanyLabel, setSelectedCompanyLabel] = useState<string>("");
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const companySearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Local state for the LOA request details form.
   */
  const [formFields, setFormFields] = useState<LoaFormFields>({
    customerName: "",
    mpanMprn: "",
    contactNumber: "",
    email: "",
    designation: "",
    businessName: "",
    companyRegNo: "",
    currentSupplier: "",
    businessAddress: "",
    typeOfRequest: "Renewal Authorisation",
    services: {
      electricity: false,
      gas: false,
      // water: false,
      // telecom: false,
      // paymentTerminal: false,
      waste: false,
    },
    microBusiness: null,
    subject: "",
    description: "",
    attachments: [],
  });

  /** Maps raw company API results into SelectOption[]. */
  const mapCompaniesToOptions = (results: Company[] | undefined | null) => {
    if (!results || !Array.isArray(results)) return [];
    return results
      .filter(
        (company) =>
          company &&
          company.company_name &&
          company.id !== undefined &&
          company.id !== null
      )
      .map((company) => ({
        value: String(company.id),
        label: company.company_name as string,
      }));
  };

  /**
   * Fetches a page of companies from the backend (pagination + optional search).
   * - search is sent as company_name query param.
   * - append: false = replace options; true = append for "load more".
   */
  const fetchCompaniesPage = async ({
    search,
    page,
    append,
  }: {
    search: string;
    page: number;
    append: boolean;
  }) => {
    try {
      setIsCompanyLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(COMPANY_PAGE_SIZE));
      if (search.trim()) {
        params.set("company_name", search.trim());
      }

      const endpoint = `/api/v1/auth/web/core/company/?${params.toString()}`;
      const response = await getDropdown(endpoint);

      if (!response.success || !response.data) {
        console.error("Failed to fetch companies:", response.message);
        if (!append) setCompanyOptions([]);
        setHasMoreCompanies(false);
        return;
      }

      const data = response.data as CompanyApiResponse;
      const newOptions = mapCompaniesToOptions(data.results);

      setCompanyOptions((prev) => {
        if (!append) return newOptions;
        const existingByValue = new Set(prev.map((opt) => opt.value));
        return [
          ...prev,
          ...newOptions.filter((opt) => !existingByValue.has(opt.value)),
        ];
      });

      setCompanyPage(page);
      setHasMoreCompanies(Boolean(data.next));
    } catch (error) {
      console.error("Error fetching companies:", error);
      if (!append) setCompanyOptions([]);
      setHasMoreCompanies(false);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  /**
   * If the parent (Add Ticket page) provided an initial company id from the URL,
   * use it to pre-select the company in this form. We deliberately do not assume
   * that there is an API to resolve the label by id; instead we keep a sensible
   * fallback label (`Company #<id>`) until the user changes it.
   */
  useEffect(() => {
    if (initialCompanyId && initialCompanyId !== companyId) {
      setCompanyId(initialCompanyId);
      // Only set a fallback label if we don't already have one from a user choice.
      setSelectedCompanyLabel((prev) =>
        prev ? prev : `Company #${initialCompanyId}`
      );
    }
  }, [initialCompanyId, companyId]);

  /**
   * Seed all LOA inputs from parent submitted details when values exist.
   * Only fill fields that are still empty so we do not overwrite user edits.
   * Depends on primitive fields (not the object identity) so parent re-renders
   * with a new `initialValues` literal do not keep re-applying.
   */
  useEffect(() => {
    if (!initialValues) return;

    const prefill = {
      customerName: presentPrefill(initialValues.customerName),
      mpanMprn: presentPrefill(initialValues.mpanMprn),
      contactNumber: presentPrefill(initialValues.contactNumber),
      email: presentPrefill(initialValues.email),
      designation: presentPrefill(initialValues.designation),
      businessName: presentPrefill(initialValues.businessName),
      companyRegNo: presentPrefill(initialValues.companyRegNo),
      currentSupplier: presentPrefill(initialValues.currentSupplier),
      businessAddress: presentPrefill(initialValues.businessAddress),
    };

    const microBusinessPrefill =
      initialValues.microBusiness === "yes" ||
      initialValues.microBusiness === "no"
        ? initialValues.microBusiness
        : null;
    const serviceElectricity = Boolean(initialValues.services?.electricity);
    const serviceGas = Boolean(initialValues.services?.gas);
    const serviceWaste = Boolean(initialValues.services?.waste);

    const hasTextPrefill = Object.values(prefill).some(Boolean);
    const hasMicroPrefill = microBusinessPrefill !== null;
    const hasServicePrefill =
      serviceElectricity || serviceGas || serviceWaste;

    if (!hasTextPrefill && !hasMicroPrefill && !hasServicePrefill) {
      return;
    }

    setFormFields((prev) => {
      const hasAnyServiceChecked =
        prev.services.electricity ||
        prev.services.gas ||
        prev.services.waste;

      return {
        ...prev,
        customerName: prev.customerName.trim()
          ? prev.customerName
          : prefill.customerName,
        mpanMprn: prev.mpanMprn.trim() ? prev.mpanMprn : prefill.mpanMprn,
        contactNumber: prev.contactNumber.trim()
          ? prev.contactNumber
          : prefill.contactNumber,
        email: prev.email.trim() ? prev.email : prefill.email,
        designation: prev.designation.trim()
          ? prev.designation
          : prefill.designation,
        businessName: prev.businessName.trim()
          ? prev.businessName
          : prefill.businessName,
        companyRegNo: prev.companyRegNo.trim()
          ? prev.companyRegNo
          : prefill.companyRegNo,
        currentSupplier: prev.currentSupplier.trim()
          ? prev.currentSupplier
          : prefill.currentSupplier,
        businessAddress: prev.businessAddress.trim()
          ? prev.businessAddress
          : prefill.businessAddress,
        microBusiness:
          prev.microBusiness !== null
            ? prev.microBusiness
            : (microBusinessPrefill ?? prev.microBusiness),
        services: hasAnyServiceChecked
          ? prev.services
          : {
              ...prev.services,
              electricity: serviceElectricity || prev.services.electricity,
              gas: serviceGas || prev.services.gas,
              waste: serviceWaste || prev.services.waste,
            },
      };
    });

    // Keep company id/label in sync when business name is prefilled from details.
    if (prefill.businessName) {
      setSelectedCompanyLabel((prev) => prev || prefill.businessName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive deps below avoid object-identity thrashing
  }, [
    initialValues?.customerName,
    initialValues?.mpanMprn,
    initialValues?.contactNumber,
    initialValues?.email,
    initialValues?.designation,
    initialValues?.businessName,
    initialValues?.companyRegNo,
    initialValues?.currentSupplier,
    initialValues?.businessAddress,
    initialValues?.microBusiness,
    initialValues?.services?.electricity,
    initialValues?.services?.gas,
    initialValues?.services?.waste,
  ]);

  /** Debounced search: reset to page 1 and fetch when companySearch changes. */
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
    }, COMPANY_SEARCH_DEBOUNCE_MS);

    return () => {
      if (companySearchDebounceRef.current) {
        clearTimeout(companySearchDebounceRef.current);
      }
    };
    // Intentionally depend only on companySearch for debounced search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySearch]);

  /** Load next page when user scrolls to bottom of company dropdown. */
  const handleCompanyMenuScrollToBottom = () => {
    if (isCompanyLoading || !hasMoreCompanies) return;
    fetchCompaniesPage({
      search: companySearch,
      page: companyPage + 1,
      append: true,
    });
  };

  /**
   * Generic handler for simple text/select inputs.
   * Keeps the form state update logic in one place so it is easier
   * to add/remove fields in the future.
   */
  const handleTextChange =
    (
      field: keyof Omit<
        LoaFormFields,
        "services" | "microBusiness" | "attachments"
      >
    ) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { value } = event.target;
      setFormFields((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  /** Toggles an individual service checkbox on or off. */
  const handleServiceToggle =
    (serviceKey: keyof LoaFormFields["services"]) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      setFormFields((prev) => ({
        ...prev,
        services: {
          ...prev.services,
          [serviceKey]: checked,
        },
      }));
    };

  /** Records whether the customer is a micro business. */
  const handleMicroBusinessChange = (value: "yes" | "no") => {
    setFormFields((prev) => ({
      ...prev,
      microBusiness: value,
    }));
  };

  /** Stores the selected files (multiselect); they are uploaded on form submit. */
  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    const files = fileList ? Array.from(fileList) : [];
    setFormFields((prev) => ({
      ...prev,
      attachments: files,
    }));
  };

  const { loading, executePost } = usePostApiCall({
    onSuccess: async () => {
      // Create a ticket with LOA query type so the submission is tracked (same API as TicketForm).
      const ticketPayload: Record<string, unknown> = {
        query_type: queryType,
        contact_preference: "EMAIL",
        subject: formFields.subject || "LOA submission",
        description: (formFields.description || "").trim(),
      };
      if (companyId) {
        ticketPayload.company = companyId;
      }
      const ticketResult = await postMethod(
        ticketPayload,
        TICKETS_API_ENDPOINT
      );
      if (!ticketResult.success) {
        toast.error(
          ticketResult.message ?? "LOA sent but ticket creation failed."
        );
      }
      toast.success("LOA sent for signing successfully.");
      const callback = onSuccessCallbackRef.current;
      if (callback) {
        await callback();
      } else {
        router.push(TICKETS_PAGE_PATH);
      }
    },
    onError: (message) => {
      toast.error(message || "Failed to generate LOA");
    },
  });

  const handleGenerateLoa = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert the selected services (checkbox map) to the string[]
    // the backend expects. We send the user-facing labels; if the
    // backend later requires specific enum values we can adjust here
    // without touching the UI.
    const selectedServices: string[] = [];
    if (formFields.services.electricity) selectedServices.push("Electricity");
    if (formFields.services.gas) selectedServices.push("Gas");
    // if (formFields.services.water) selectedServices.push("Water");
    // if (formFields.services.telecom) selectedServices.push("Telecom");
    // if (formFields.services.paymentTerminal)
    //   selectedServices.push("Payment Terminal");
    if (formFields.services.waste) selectedServices.push("Waste");

    // Map "yes"/"no" to boolean for the API.
    const microBusiness =
      formFields.microBusiness === null
        ? false
        : formFields.microBusiness === "yes";

    // Upload attachments first (same pattern as submitted-sale documents):
    // POST each file to /upload-file/, then send the returned URLs in the LOA payload.
    const uploadedUrls: string[] = [];
    for (const file of formFields.attachments) {
      const uploadResult = await uploadLoaFileAction(file);
      if (!uploadResult.success || !uploadResult.fileUrl) {
        toast.error(uploadResult.message ?? `Failed to upload ${file.name}`);
        return;
      }
      uploadedUrls.push(uploadResult.fileUrl);
    }

    await executePost(SEND_SIGNING_LOA_ENDPOINT, {
      customer_name: formFields.customerName,
      mpan_mprn: formFields.mpanMprn,
      contact_no: formFields.contactNumber,
      email: formFields.email,
      designation: formFields.designation,
      business_name: formFields.businessName,
      company_reg_no: formFields.companyRegNo,
      current_supplier: formFields.currentSupplier,
      business_address: formFields.businessAddress,
      type_of_request: formFields.typeOfRequest,
      upload_files: uploadedUrls,
      services: selectedServices,
      micro_business: microBusiness,
      subject: formFields.subject,
      description: formFields.description,
    });
  };

  return (
    <form onSubmit={handleGenerateLoa} className="account-light-surface space-y-6">
      {/* Company selection (required for LOA generation).
          This is intentionally commented out from the UI as per request,
          but kept in the file for easy rollback if needed. */}
      {/*
      <div className="space-y-2">
        <Label htmlFor="company" className="text-sm font-medium text-gray-700">
          Company
        </Label>
        <CustomSelect
          id="company"
          placeholder="Select Company"
          options={
            companyId && !companyOptions.some((o) => o.value === companyId)
              ? [
                  {
                    value: companyId,
                    label: selectedCompanyLabel || \`Company #\${companyId}\`,
                  },
                  ...companyOptions,
                ]
              : companyOptions
          }
          value={
            companyOptions.find((option) => option.value === companyId) ??
            (companyId
              ? {
                  value: companyId,
                  label: selectedCompanyLabel || \`Company #\${companyId}\`,
                }
              : null)
          }
          onChange={(selectedOption, actionMeta) => {
            // Update the selected company id/label from the chosen option.
            setCompanyId(selectedOption ? selectedOption.value : "");
            setSelectedCompanyLabel(
              selectedOption ? selectedOption.label : ""
            );

            // When the user clears the selection (via clear indicator or keyboard),
            // also reset the search text and reload the initial unfiltered list.
            if (!selectedOption && actionMeta.action === "clear") {
              if (companySearchDebounceRef.current) {
                clearTimeout(companySearchDebounceRef.current);
              }
              setCompanySearch("");
              void fetchCompaniesPage({
                search: "",
                page: 1,
                append: false,
              });
            }
          }}
          isLoading={isCompanyLoading}
          isClearable
          filterOption={() => true}
          onInputChange={(inputValue, actionMeta) => {
            if (actionMeta.action === "input-change") {
              setCompanySearch(inputValue);
            }
            return inputValue;
          }}
          onMenuScrollToBottom={handleCompanyMenuScrollToBottom}
          className="w-full md:w-1/3"
        />
      </div>
      */}

      {/* LOA request details */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label
            htmlFor="customerName"
            className="text-sm font-medium text-gray-700"
          >
            Customer Name
          </Label>
          <input
            id="customerName"
            type="text"
            placeholder="Customer Name"
            value={formFields.customerName}
            onChange={handleTextChange("customerName")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="mpanMprn"
            className="text-sm font-medium text-gray-700"
          >
            MPAN/MPRN
          </Label>
          <input
            id="mpanMprn"
            type="text"
            placeholder="MPAN/MPRN"
            value={formFields.mpanMprn}
            onChange={handleTextChange("mpanMprn")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="contactNumber"
            className="text-sm font-medium text-gray-700"
          >
            Contact No
          </Label>
          <input
            id="contactNumber"
            type="tel"
            placeholder="Contact Number"
            value={formFields.contactNumber}
            onChange={handleTextChange("contactNumber")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={formFields.email}
            onChange={handleTextChange("email")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="designation"
            className="text-sm font-medium text-gray-700"
          >
            Designation
          </Label>
          <input
            id="designation"
            type="text"
            placeholder="Designation"
            value={formFields.designation}
            onChange={handleTextChange("designation")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Business Name: dropdown of company names (same company API as other pages). */}
        <div className="space-y-2">
          <Label
            htmlFor="businessName"
            className="text-sm font-medium text-gray-700"
          >
            Business Name
          </Label>
          <CustomSelect
            inputId="businessName"
            placeholder={
              isCompanyLoading ? "Loading companies..." : "Select company"
            }
            options={
              formFields.businessName &&
              !companyOptions.some((opt) => opt.label === formFields.businessName)
                ? [
                    {
                      value: companyId || formFields.businessName,
                      label: formFields.businessName,
                    },
                    ...companyOptions,
                  ]
                : companyOptions
            }
            value={
              companyOptions.find(
                (opt) => opt.label === formFields.businessName
              ) ??
              (formFields.businessName
                ? {
                    value: companyId || formFields.businessName,
                    label: formFields.businessName,
                  }
                : null)
            }
            isLoading={isCompanyLoading}
            onInputChange={(inputValue, actionMeta) => {
              if (actionMeta.action === "input-change") {
                setCompanySearch(inputValue);
              }
              return inputValue;
            }}
            onMenuScrollToBottom={handleCompanyMenuScrollToBottom}
            onChange={(selectedOption) => {
              // Keep form field in sync and set company id so ticket payload gets company when submitted.
              setFormFields((prev) => ({
                ...prev,
                businessName: selectedOption ? selectedOption.label : "",
              }));
              if (selectedOption) {
                setCompanyId(selectedOption.value);
                setSelectedCompanyLabel(selectedOption.label);
              } else {
                setCompanyId("");
                setSelectedCompanyLabel("");
              }
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="companyRegNo"
            className="text-sm font-medium text-gray-700"
          >
            Company Reg No.
          </Label>
          <input
            id="companyRegNo"
            type="text"
            placeholder="Company Registration"
            value={formFields.companyRegNo}
            onChange={handleTextChange("companyRegNo")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="currentSupplier"
            className="text-sm font-medium text-gray-700"
          >
            Current Supplier
          </Label>
          <input
            id="currentSupplier"
            type="text"
            placeholder="Current Supplier"
            value={formFields.currentSupplier}
            onChange={handleTextChange("currentSupplier")}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="businessAddress"
          className="text-sm font-medium text-gray-700"
        >
          Business Address
        </Label>
        <input
          id="businessAddress"
          type="text"
          placeholder="Business Address"
          value={formFields.businessAddress}
          onChange={handleTextChange("businessAddress")}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor="typeOfRequest"
            className="text-sm font-medium text-gray-700"
          >
            Type of Request
          </Label>
          <select
            id="typeOfRequest"
            value={formFields.typeOfRequest}
            onChange={handleTextChange("typeOfRequest")}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="attachments"
            className="text-sm font-medium text-gray-700"
          >
            Upload Files
          </Label>
          <input
            id="attachments"
            type="file"
            multiple
            onChange={handleAttachmentChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
          {formFields.attachments.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {formFields.attachments.length} file(s) selected:{" "}
              {formFields.attachments.map((f) => f.name).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium text-gray-700">Services</Label>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.electricity}
              onChange={handleServiceToggle("electricity")}
            />
            <span>Electricity</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.gas}
              onChange={handleServiceToggle("gas")}
            />
            <span>Gas</span>
          </label>
          {/* <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.water}
              onChange={handleServiceToggle("water")}
            />
            <span>Water</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.telecom}
              onChange={handleServiceToggle("telecom")}
            />
            <span>Telecom</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.paymentTerminal}
              onChange={handleServiceToggle("paymentTerminal")}
            />
            <span>Payment Terminal</span>
          </label> */}
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formFields.services.waste}
              onChange={handleServiceToggle("waste")}
            />
            <span>Waste</span>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-medium text-gray-700">
          Micro Business
        </Label>
        <div className="flex gap-6 text-sm text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="microBusiness"
              value="yes"
              checked={formFields.microBusiness === "yes"}
              onChange={() => handleMicroBusinessChange("yes")}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="microBusiness"
              value="no"
              checked={formFields.microBusiness === "no"}
              onChange={() => handleMicroBusinessChange("no")}
              className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
            />
            <span>No</span>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="subject"
          className="text-sm font-medium text-gray-700"
        >
          Subject
        </Label>
        <input
          id="subject"
          type="text"
          placeholder="Subject"
          value={formFields.subject}
          onChange={handleTextChange("subject")}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Description
        </Label>
        <textarea
          id="description"
          placeholder="Description"
          value={formFields.description}
          onChange={handleTextChange("description")}
          rows={4}
          className="block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Generating...
            </>
          ) : (
            "Generate LOA"
          )}
        </Button>
      </div>
    </form>
  );
}
