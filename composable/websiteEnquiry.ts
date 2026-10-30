"use client";

import { getDropdown } from "@/lib/actions/getDropdown";
import { patchMethod } from "@/lib/actions/patchMethod";
import { deleteMethod } from "@/lib/actions/deleteMethod";
import {
  getTableData,
  type TableFilters,
  type TableDataResult,
} from "@/composable/getTableData";
import { WEBSITE_ENQUIRY_ENDPOINT } from "@/lib/constants/websiteEnquiry";
import type {
  WebsiteEnquiry,
  WebsiteEnquiryStatus,
} from "@/lib/types/websiteEnquiry";

/**
 * Paginated website enquiries list.
 * Supports form_type, status, search, page, page_size.
 */
export async function getWebsiteEnquiriesList(
  filters: TableFilters = {}
): Promise<TableDataResult<WebsiteEnquiry>> {
  return getTableData<WebsiteEnquiry>(WEBSITE_ENQUIRY_ENDPOINT, filters);
}

/**
 * Lightweight count of enquiries with status=new (for sidebar badge).
 */
export async function getWebsiteEnquiryNewCount(): Promise<number> {
  const result = await getWebsiteEnquiriesList({
    status: "new",
    page: 1,
    page_size: 1,
  });
  if (!result.success || !result.data) return 0;
  return result.data.count ?? 0;
}

/** Single enquiry detail by id. */
export async function getWebsiteEnquiry(id: string | number) {
  try {
    const response = await getDropdown(
      `${WEBSITE_ENQUIRY_ENDPOINT}${id}/`
    );

    if (!response.success) {
      return {
        success: false as const,
        message: response.message || "Failed to fetch website enquiry",
        errors: response.errors,
      };
    }

    return {
      success: true as const,
      data: response.data as WebsiteEnquiry,
      message: response.message || "Website enquiry fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching website enquiry:", error);
    return {
      success: false as const,
      message: "An error occurred while fetching website enquiry",
      errors: error,
    };
  }
}

/** PATCH status only. */
export async function updateWebsiteEnquiryStatus(
  id: string | number,
  status: WebsiteEnquiryStatus
) {
  return patchMethod({ status }, `${WEBSITE_ENQUIRY_ENDPOINT}${id}/`);
}

/** Soft-delete via DELETE (server soft-deletes). */
export async function deleteWebsiteEnquiry(id: string | number) {
  return deleteMethod(`${WEBSITE_ENQUIRY_ENDPOINT}${id}/`);
}
