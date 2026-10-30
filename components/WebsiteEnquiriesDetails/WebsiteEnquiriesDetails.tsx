"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/ui/button";
import { DeleteConfirmationModal } from "@/ui/deleteModal";
import {
  deleteWebsiteEnquiry,
  getWebsiteEnquiry,
  updateWebsiteEnquiryStatus,
} from "@/composable/websiteEnquiry";
import { formatDateTimeWithSeconds } from "@/composable/getFormatedDate";
import type {
  WebsiteEnquiry,
  WebsiteEnquiryStatus,
} from "@/lib/types/websiteEnquiry";
import {
  WEBSITE_ENQUIRY_FORM_TYPE_LABELS,
  WEBSITE_ENQUIRY_STATUSES,
  WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES,
  getWebsiteEnquiryStatusLabel,
} from "@/lib/constants/websiteEnquiry";

interface WebsiteEnquiriesDetailsProps {
  enquiryId: string;
}

function displayValue(value: string | null | undefined): string {
  if (value == null) return "—";
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : "—";
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="text-sm text-[#222] break-words">{children}</dd>
    </div>
  );
}

const WebsiteEnquiriesDetails: React.FC<WebsiteEnquiriesDetailsProps> = ({
  enquiryId,
}) => {
  const router = useRouter();
  const [enquiry, setEnquiry] = useState<WebsiteEnquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEnquiry = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getWebsiteEnquiry(enquiryId);

      if (response.success && response.data) {
        setEnquiry(response.data);
        return;
      }

      const errors = response.errors as
        | { authError?: boolean; status?: number }
        | undefined;
      if (errors?.authError) {
        toast.error("Token expired. Authentication required.");
        setTimeout(() => router.push("/login"), 500);
        return;
      }

      setError(response.message || "Failed to fetch enquiry details");
    } catch (err) {
      console.error("Error fetching website enquiry:", err);
      setError("Failed to fetch enquiry details");
    } finally {
      setIsLoading(false);
    }
  }, [enquiryId, router]);

  useEffect(() => {
    if (enquiryId) {
      void loadEnquiry();
    }
  }, [enquiryId, loadEnquiry]);

  const handleStatusChange = async (nextStatus: WebsiteEnquiryStatus) => {
    if (!enquiry || nextStatus === enquiry.status) return;

    const previous = enquiry;
    setEnquiry({ ...enquiry, status: nextStatus });
    setIsSavingStatus(true);

    try {
      const response = await updateWebsiteEnquiryStatus(
        enquiry.id,
        nextStatus
      );

      if (response.success) {
        toast.success("Status updated");
        if (response.data && typeof response.data === "object") {
          setEnquiry((current) =>
            current
              ? {
                  ...current,
                  ...(response.data as Partial<WebsiteEnquiry>),
                  status: nextStatus,
                }
              : current
          );
        }
        return;
      }

      setEnquiry(previous);
      const errors = response.errors as
        | { authError?: boolean; status?: number }
        | undefined;
      if (errors?.authError) {
        toast.error("Token expired. Authentication required.");
        setTimeout(() => router.push("/login"), 500);
        return;
      }
      toast.error(response.message || "Failed to update status");
    } catch (err) {
      console.error("Error updating enquiry status:", err);
      setEnquiry(previous);
      toast.error("Failed to update status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!enquiry) return;

    setIsDeleting(true);
    try {
      const response = await deleteWebsiteEnquiry(enquiry.id);

      if (response.success) {
        toast.success("Enquiry deleted");
        setIsDeleteOpen(false);
        router.push("/website-enquiries");
        return;
      }

      const errors = response.errors as
        | { authError?: boolean; status?: number }
        | undefined;
      if (errors?.authError) {
        toast.error("Token expired. Authentication required.");
        setTimeout(() => router.push("/login"), 500);
        return;
      }
      toast.error(response.message || "Failed to delete enquiry");
    } catch (err) {
      console.error("Error deleting website enquiry:", err);
      toast.error("Failed to delete enquiry");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading enquiry…
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="mx-auto my-8 px-6 lg:px-8 max-w-3xl">
        <div className="bg-white rounded shadow p-6 text-center">
          <p className="text-red-600 mb-4">
            {error || "Enquiry not found"}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/website-enquiries")}
          >
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const badgeClasses =
    WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES[enquiry.status] ??
    WEBSITE_ENQUIRY_STATUS_BADGE_CLASSES.closed;

  return (
    <section className="w-full mx-auto my-4 lg:my-8 px-6 lg:px-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => router.push("/website-enquiries")}
            className="text-sm text-primary hover:underline mb-2"
          >
            ← Back to Website Enquiries
          </button>
          <h1 className="text-xl font-semibold text-[#222]">
            {displayValue(enquiry.name)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {WEBSITE_ENQUIRY_FORM_TYPE_LABELS[enquiry.form_type] ??
              enquiry.form_type}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}
          >
            {getWebsiteEnquiryStatusLabel(enquiry.status, enquiry.form_type)}
          </span>
          <Button
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            htmlFor="enquiry-status"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Status
          </label>
          <div className="flex items-center gap-2 flex-1">
            <select
              id="enquiry-status"
              value={enquiry.status}
              disabled={isSavingStatus}
              onChange={(e) =>
                void handleStatusChange(e.target.value as WebsiteEnquiryStatus)
              }
              className="border border-[#A0A0A0] rounded px-3 py-2 text-sm bg-white text-[#222] focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[200px] disabled:opacity-60"
            >
              {WEBSITE_ENQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getWebsiteEnquiryStatusLabel(status, enquiry.form_type)}
                </option>
              ))}
            </select>
            {isSavingStatus && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DetailField label="Name">{displayValue(enquiry.name)}</DetailField>
          <DetailField label="Business name">
            {displayValue(enquiry.business_name)}
          </DetailField>
          <DetailField label="Email">
            {enquiry.email?.trim() ? (
              <a
                href={`mailto:${enquiry.email.trim()}`}
                className="text-primary hover:underline"
              >
                {enquiry.email.trim()}
              </a>
            ) : (
              "—"
            )}
          </DetailField>
          <DetailField label="Phone">
            {enquiry.phone?.trim() ? (
              <a
                href={`tel:${enquiry.phone.trim()}`}
                className="text-primary hover:underline"
              >
                {enquiry.phone.trim()}
              </a>
            ) : (
              "—"
            )}
          </DetailField>
          <DetailField label="Postcode">
            {displayValue(enquiry.postcode)}
          </DetailField>
          <DetailField label="Street address">
            {displayValue(enquiry.street_address)}
          </DetailField>
          <DetailField label="Town / city">
            {displayValue(enquiry.town_city)}
          </DetailField>
          <DetailField label="County">
            {displayValue(enquiry.county)}
          </DetailField>
          <DetailField label="Submitted">
            {formatDateTimeWithSeconds(enquiry.created_at)}
          </DetailField>
          <DetailField label="Updated">
            {formatDateTimeWithSeconds(enquiry.updated_at)}
          </DetailField>
        </dl>

        <DetailField label="Message">
          <p className="whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 min-h-[80px]">
            {displayValue(enquiry.message)}
          </p>
        </DetailField>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteOpen(false);
        }}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
        isDeleting={isDeleting}
        title="Delete enquiry"
        description="This will soft-delete the enquiry and remove it from the list. You can continue if this lead is no longer needed."
        itemName={enquiry.name}
        confirmButtonText="Delete enquiry"
      />
    </section>
  );
};

export default WebsiteEnquiriesDetails;
