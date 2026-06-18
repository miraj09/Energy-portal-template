"use client";

import { getDropdown } from "@/lib/actions/getDropdown";
import { Ticket } from "@/lib/types";

export interface TableDataResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TableFilters {
  page?: number;
  page_size?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined; // Allow additional filter parameters
}

export interface TableDataResult<T> {
  success: boolean;
  data?: TableDataResponse<T>;
  message?: string;
  errors?: unknown;
}

/**
 * Generic function to fetch table data with pagination, search, and filtering
 * @param endpoint - The API endpoint (without base URL)
 * @param filters - Object containing pagination, search, and filter parameters
 * @returns Promise<TableDataResult<T>> - Table data with pagination info
 */
export async function getTableData<T>(
  endpoint: string,
  filters: TableFilters = {}
): Promise<TableDataResult<T>> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    if (filters.page) {
      queryParams.append("page", filters.page.toString());
    }
    if (filters.page_size) {
      queryParams.append("page_size", filters.page_size.toString());
    }

    // Add search parameter
    if (filters.search && filters.search.trim()) {
      queryParams.append("search", filters.search.trim());
    }

    // Add additional filter parameters
    Object.keys(filters).forEach((key) => {
      if (
        key !== "page" &&
        key !== "page_size" &&
        key !== "search" &&
        filters[key] !== undefined
      ) {
        queryParams.append(key, filters[key].toString());
      }
    });

    // Construct full endpoint with query parameters
    const fullEndpoint = queryParams.toString()
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint;

    console.log("📋 Fetching table data from:", fullEndpoint);
    const response = await getDropdown(fullEndpoint);
    console.log("📋 Table data response:", response);

    if (!response.success) {
      // Check for authentication errors
      const errors = response.errors as {
        authError?: boolean;
        status?: number;
      };
      if (errors?.authError) {
        // This will be handled by the client-side hook
        return {
          success: false,
          message: "Authentication failed",
          errors: response.errors,
        };
      }

      console.error("Failed to fetch table data:", response.message);
      return {
        success: false,
        message: response.message || "Failed to fetch data",
        errors: response.errors,
      };
    }

    // Handle the response structure
    const tableData = response.data as TableDataResponse<T>;

    if (!tableData || typeof tableData !== "object") {
      console.error("Invalid table data response structure");
      return {
        success: false,
        message: "Invalid response structure",
      };
    }

    return {
      success: true,
      data: tableData,
    };
  } catch (error) {
    console.error("Error fetching table data:", error);
    return {
      success: false,
      message: "An error occurred while fetching data",
      errors: error,
    };
  }
}

/**
 * Helper function to get user list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<User>>
 */
export async function getUserList(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/user/", filters);
}

/**
 * Helper function to get role list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Role>>
 */
export async function getRoleListWithFilters(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/role/", filters);
}

/**
 * Helper function to get company list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Company>>
 */
export async function getCompanyList(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/core/company/", filters);
}

/**
 * Helper function to get invoice list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Invoice>>
 */
export async function getInvoiceList(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/utility/partner-invoice/", filters);
}

/**
 * Helper function to get tickets list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Ticket>>
 */
export async function getTicketsList(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/utility/tickets/", filters);
}

/**
 * Helper function to get a single ticket by ID with messages
 * @param ticketId - The ticket's public ID
 * @returns Promise<{ success: boolean; data?: Ticket; message?: string; errors?: unknown }>
 */
export async function getTicketById(ticketId: string) {
  try {
    const response = await getDropdown(`/api/v1/auth/web/utility/tickets/${ticketId}/`);
    
    if (!response.success) {
      return {
        success: false,
        message: response.message || "Failed to fetch ticket",
        errors: response.errors,
      };
    }

    return {
      success: true,
      data: response.data as Ticket,
      message: response.message || "Ticket fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
/**
 * Helper function to get reports list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Report>>
 */
export async function getReportsList(filters: TableFilters = {}) {
  return getTableData("/api/v1/auth/web/utility/report/", filters);
}

/**
 * Helper function to get contacts list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<T>>
 */
export async function getContactsList<T = unknown>(filters: TableFilters = {}) {
  return getTableData<T>("/api/v1/auth/web/core/contact/", filters);
}

/**
 * Helper function to get submitted sales list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<T>>
 */
export async function getSubmittedSalesList<T = unknown>(
  filters: TableFilters = {}
) {
  return getTableData<T>("/api/v1/auth/web/core/submitted-sales/", filters);
}

/**
 * Helper function to get announcements list with filters
 * @param filters - Table filters including pagination, search, etc.
 * @returns Promise<TableDataResult<Announcement>>
 */
export async function getAnnouncementsList(filters: TableFilters = {}) {
  return getTableData("/api/v1/frontend/announcement/", filters);
}

/**
 * Helper function to get any table data with custom endpoint
 * @param endpoint - Custom API endpoint
 * @param filters - Table filters
 * @returns Promise<TableDataResult<any>>
 */
export async function getCustomTableData(
  endpoint: string,
  filters: TableFilters = {}
) {
  return getTableData(endpoint, filters);
}
