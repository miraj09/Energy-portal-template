"use server";

import { storeTokens, clearTokens, hasValidToken, getRefreshToken } from "./token-manager";
import { apiGet } from "./api-client";
import { mapLoginUserData, type TokenUserPayload } from "@/lib/user/mapLoginUserData";
import type { UserRecord } from "@/lib/types/user";
import { getDefaultRouteForPermissions } from "@/lib/navigation/defaultRoute";
import { loadUserPermissions } from "@/lib/permissions/permissionUtils";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  userData?: UserRecord;
  defaultRoute?: string;
}

/**
 * Login action - validates credentials and stores tokens
 */
export async function loginAction(
  prevState: LoginResponse | null,
  formData: FormData
): Promise<LoginResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required",
      errors: {
        email: !email ? ["Email is required"] : [],
        password: !password ? ["Password is required"] : [],
      },
    };
  }

  try {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }

    const response = await fetch(`${baseUrl}/api/v1/auth/web/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || "Authentication failed",
        errors: data.errors || {},
      };
    }

    // Store tokens
    await storeTokens({
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
    });

    const userData = mapLoginUserData(data.data as TokenUserPayload);
    const permissions = await loadUserPermissions();
    const defaultRoute = getDefaultRouteForPermissions(permissions);

    return {
      success: true,
      userData,
      defaultRoute,
    };

  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}

/**
 * Logout action - clears all tokens
 */
export async function logoutAction(): Promise<{ success: boolean; message?: string }> {
  try {
    await clearTokens();
    return { success: true, message: "Successfully logged out" };
  } catch (error) {
    console.error("Logout failed:", error);
    return { success: false, message: "Logout failed. Please try again." };
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return await hasValidToken();
}

/**
 * Get user profile (example API call)
 */
export async function getUserProfile() {
  return await apiGet("/api/v1/auth/web/user/profile/");
}

/**
 * Get suppliers list (example API call)
 */
export async function getSuppliers() {
  return await apiGet("/api/v1/auth/web/suppliers/");
}

/**
 * Get invoices list (example API call)
 */
export async function getInvoices(params: Record<string, string> = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString
    ? `/api/v1/auth/web/core/invoice/?${queryString}`
    : "/api/v1/auth/web/core/invoice/";
  console.log("📋 Fetching invoices from:", endpoint);
  const result = await apiGet(endpoint);
  console.log("📋 Invoices API response:", result);
  return result;
}

/**
 * Get grouped invoices list (grouped by company)
 */
export async function getGroupedInvoices(params: Record<string, string> = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString
    ? `/api/v1/auth/web/core/invoice-grouped/?${queryString}`
    : "/api/v1/auth/web/core/invoice-grouped/";
  console.log("📋 Fetching grouped invoices from:", endpoint);
  const result = await apiGet(endpoint);
  console.log("📋 Grouped invoices API response:", result);
  return result;
}

/**
 * Get grouped invoice details by company ID
 */
export async function getGroupedInvoiceByCompanyId(companyId: string) {
  if (!companyId) {
    return {
      success: false,
      message: "Company ID is required",
    };
  }

  const endpoint = `/api/v1/auth/web/core/invoice-grouped/${companyId}/`;
  console.log("📄 Fetching grouped invoice details from:", endpoint);
  const result = await apiGet(endpoint);
  console.log("📄 Grouped invoice details API response:", result);
  return result;
}

/**
 * Get invoice details by invoice ID
 */
export async function getInvoiceById(invoiceId: string) {
  if (!invoiceId) {
    return {
      success: false,
      message: "Invoice ID is required",
    };
  }

  const endpoint = `/api/v1/auth/web/core/invoice/${invoiceId}/`;
  console.log("📄 Fetching invoice details from:", endpoint);
  const result = await apiGet(endpoint);
  console.log("📄 Invoice details API response:", result);
  return result;
}

/**
 * Get invoice backing data by company ID.
 */
export async function getInvoiceBackingDataByCompanyId(companyId: string) {
  if (!companyId) {
    return {
      success: false,
      message: "Company ID is required",
    };
  }

  const queryString = new URLSearchParams({ company_id: companyId }).toString();
  const endpoint = `/api/v1/auth/web/core/invoice_backing_data/?${queryString}`;
  console.log("📄 Fetching invoice backing data from:", endpoint);
  const result = await apiGet(endpoint);
  console.log("📄 Invoice backing data API response:", result);
  return result;
}

/**
 * Refresh token action
 */
export async function refreshTokenAction(): Promise<{ success: boolean; message?: string; data?: unknown }> {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        message: "No refresh token available",
      };
    }

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL environment variable is not set");
    }

    const response = await fetch(`${baseUrl}/api/v1/auth/web/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || "Token refresh failed",
      };
    }

    // Store new tokens
    await storeTokens({
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token || refreshToken,
    });

    console.log("🔑 New access token stored successfully");

    return {
      success: true,
      message: "Token refreshed successfully",
      data: data.data,
    };

  } catch (error) {
    console.error("Token refresh failed:", error);
    return {
      success: false,
      message: "Token refresh failed",
    };
  }
}
