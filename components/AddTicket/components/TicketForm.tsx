"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { usePostApiCall } from "@/composable";
import { uploadTicketAttachmentAction } from "@/lib/actions/uploadTicketAttachment";
import { getDropdown } from "@/lib/actions/getDropdown";

// NOTE:
// This component intentionally does NOT render the "Query Type" selector.
// `AddTicket.tsx` owns query-type selection and passes it down via props.

interface TicketFormProps {
  /** Ticket query type selected in `AddTicket.tsx` */
  queryType: string;
}

interface TicketCreationResponse {
  public_id?: string;
  id?: string;
  [key: string]: unknown;
}

interface Company {
  id: number | string;
  company_name?: string;
}

interface CompanyApiResponse {
  count: number;
  previous: string | null;
  next: string | null;
  results: Company[];
}

const CONTACT_PREFERENCE_OPTIONS: SelectOption[] = [
  { value: "EMAIL", label: "EMAIL" },
  { value: "PHONE", label: "PHONE" },
  { value: "SMS", label: "SMS" },
];

export default function TicketForm({ queryType }: TicketFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    contactPreference: "",
    fileAttachment: null as File | null,
    subject: "",
    description: "",
    companyId: "",
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const companySearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Maps raw company API results into `SelectOption[]`.
   */
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
   * Fetches a page of companies from the backend using pagination + optional search.
   * - `search` is matched by `company_name` on the API.
   * - `append` controls whether we append to the existing options (for "load more")
   *   or replace them (for a fresh search).
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
    const PAGE_SIZE = 10;

    try {
      setIsCompanyLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (search.trim()) {
        params.set("company_name", search.trim());
      }

      const endpoint = `/api/v1/auth/web/core/company/?${params.toString()}`;
      const response = await getDropdown(endpoint);

      if (!response.success || !response.data) {
        console.error("Failed to fetch companies:", response.message);
        if (!append) {
          setCompanyOptions([]);
        }
        setHasMoreCompanies(false);
        return;
      }

      const data = response.data as CompanyApiResponse;
      const newOptions = mapCompaniesToOptions(data.results);

      setCompanyOptions((prev) => {
        if (!append) {
          return newOptions;
        }

        // Append while avoiding duplicates by `value`.
        const existingByValue = new Set(prev.map((opt) => opt.value));
        const merged = [
          ...prev,
          ...newOptions.filter((opt) => !existingByValue.has(opt.value)),
        ];
        return merged;
      });

      setCompanyPage(page);
      setHasMoreCompanies(Boolean(data.next));
    } catch (error) {
      console.error("Error fetching companies:", error);
      if (!append) {
        setCompanyOptions([]);
      }
      setHasMoreCompanies(false);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  /**
   * Initial load + debounced search when the user types in the company select.
   * We always reset to page 1 on a new search term.
   */
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
    }, 500);

    return () => {
      if (companySearchDebounceRef.current) {
        clearTimeout(companySearchDebounceRef.current);
      }
    };
    // We deliberately depend only on `companySearch` here to debounce it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySearch]);

  const { loading, executePost } = usePostApiCall({
    onSuccess: async (data) => {
      try {
        // Extract public_id from the response
        const responseData = data as TicketCreationResponse;
        const publicId = responseData?.public_id || responseData?.id;

        if (!publicId) {
          toast.error(
            "Ticket created but no ID received for attachment upload"
          );
          router.push("/tickets");
          return;
        }

        // If there's a file attachment, upload it
        if (formData.fileAttachment) {
          toast.loading("Uploading attachment...");

          const uploadResult = await uploadTicketAttachmentAction(
            formData.fileAttachment,
            publicId
          );

          toast.dismiss();

          if (uploadResult.success) {
            toast.success(
              "Ticket created and attachment uploaded successfully!"
            );
          } else {
            toast.warning(
              "Ticket created but attachment upload failed: " +
                uploadResult.message
            );
          }
        } else {
          toast.success("Ticket created successfully!");
        }

        router.push("/tickets");
      } catch (error) {
        console.error("Error handling ticket creation success:", error);
        toast.success("Ticket created successfully!");
        router.push("/tickets");
      }
    },
    onError: (message) => {
      toast.error(message || "Failed to create ticket");
    },
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, fileAttachment: file }));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0] || null;
    if (!file) return;

    setFormData((prev) => ({ ...prev, fileAttachment: file }));
  };

  /**
   * When user scrolls to bottom of the company dropdown menu,
   * load the next page if available.
   */
  const handleCompanyMenuScrollToBottom = () => {
    if (isCompanyLoading || !hasMoreCompanies) return;

    fetchCompaniesPage({
      search: companySearch,
      page: companyPage + 1,
      append: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Query type is controlled by the parent. If it's missing, the page UI is in a bad state.
    if (!queryType) {
      toast.error("Please select a query type");
      return;
    }

    if (!formData.contactPreference || !formData.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: Record<string, unknown> = {
      query_type: queryType,
      contact_preference: formData.contactPreference,
      subject: formData.subject,
      description: (formData.description || "").trim(),
    };

    // Include company in payload if selected
    if (formData.companyId) {
      payload.company = formData.companyId;
    }

    await executePost("/api/v1/auth/web/utility/tickets/", payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company" className="text-sm font-medium text-gray-700">
          Company
        </Label>
        <CustomSelect
          placeholder="Select Company"
          options={companyOptions}
          value={companyOptions.find(
            (option) => option.value === formData.companyId
          )}
          isLoading={isCompanyLoading}
          // `onInputChange` is called by react-select when the user types in the search box.
          // We update our local search state and let the debounced effect handle API calls.
          onInputChange={(inputValue, actionMeta) => {
            // Ignore changes not caused by actual typing (e.g. menu close).
            if (actionMeta.action === "input-change") {
              setCompanySearch(inputValue);
            }
            return inputValue;
          }}
          // Infinite scroll: load next page when the user hits the bottom of the menu.
          onMenuScrollToBottom={handleCompanyMenuScrollToBottom}
          onChange={(selectedOption) => {
            handleInputChange(
              "companyId",
              selectedOption ? selectedOption.value : ""
            );
          }}
          className="w-1/3"
        />
      </div>

      {/* Contact Preference */}
      <div className="space-y-2">
        <Label
          htmlFor="contactPreference"
          className="text-sm font-medium text-gray-700"
        >
          Contact Preference <span className="text-red-500" aria-hidden> *</span>
        </Label>
        <CustomSelect
          placeholder="Select Contact Preference"
          options={CONTACT_PREFERENCE_OPTIONS}
          value={CONTACT_PREFERENCE_OPTIONS.find(
            (option) => option.value === formData.contactPreference
          )}
          onChange={(selectedOption) => {
            handleInputChange(
              "contactPreference",
              selectedOption ? selectedOption.value : ""
            );
          }}
          className="w-1/3"
        />
      </div>

      {/* File Attachment */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          File Attachment
        </Label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors w-2/5 ${
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="fileAttachment"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="fileAttachment" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="text-sm text-gray-600">
                {isDragOver ? (
                  <span className="font-medium text-blue-600">
                    Drop file here
                  </span>
                ) : (
                  <>
                    <span className="font-medium">Drag & drop file</span> or
                    browse
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formData.fileAttachment ? (
                  <div className="text-center">
                    <div className="font-medium text-gray-700">
                      {formData.fileAttachment.name}
                    </div>
                    <div className="text-gray-500">
                      {Math.round(
                        (formData.fileAttachment.size / 1024 / 1024) * 100
                      ) / 100}{" "}
                      MB
                    </div>
                  </div>
                ) : (
                  "No file selected"
                )}
              </div>
            </div>
          </label>
        </div>

        {formData.fileAttachment && (
          <div className="flex items-center justify-between w-2/5 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {formData.fileAttachment.name}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(
                    (formData.fileAttachment.size / 1024 / 1024) * 100
                  ) / 100}{" "}
                  MB
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, fileAttachment: null }))
              }
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              title="Remove file"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
          Subject <span className="text-red-500" aria-hidden> *</span>
        </Label>
        <Input
          id="subject"
          type="text"
          value={formData.subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("subject", e.target.value)
          }
          className="w-1/3 border-gray-300 bg-white text-gray-900"
          placeholder="Enter subject"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleInputChange("description", e.target.value)
          }
          className="w-full min-h-[120px] resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Add Ticket"}
        </Button>
      </div>
    </form>
  );
}
