"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Generic GET method for making authenticated API calls.
 * Returns authError flag for client-side token refresh handling.
 */
export async function getDropdown(
  endpoint: string
): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown;
}> {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const encryptedToken = cookieStore.get("access_token")?.value;

    if (!encryptedToken) {
      return {
        success: false,
        message: "Authentication required",
        errors: { authError: true, status: 401 },
      };
    }

    // Decrypt the token
    const accessToken = await decryptToken(encryptedToken);

    if (!accessToken) {
      return {
        success: false,
        message: "Invalid authentication token",
        errors: { authError: true, status: 401 },
      };
    }

    // Make API request
    const res = await fetch(`${process.env.BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = await res.json();

    if (!res.ok) {
      // Check for authentication errors (401/403)
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          message: "Authentication failed",
          errors: { authError: true, status: res.status },
        };
      }

      return {
        success: false,
        message: responseData.message || responseData.error || "Request failed",
        errors: responseData.errors || {},
      };
    }

    // Handle different API response formats
    if (responseData.success !== undefined) {
      return {
        success: responseData.success,
        data: responseData.data,
        message: responseData.message,
        errors: responseData.errors,
      };
    }

    if (responseData.code !== undefined) {
      const isSuccess = responseData.code >= 200 && responseData.code < 300;
      return {
        success: isSuccess,
        data: responseData.data,
        message: responseData.message,
        errors: responseData.errors,
      };
    }

    // Default success response
    return {
      success: true,
      data: responseData.data || responseData,
      message: responseData.message || "Request successful",
    };
  } catch (error) {
    console.error("GET request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}

/**
 * Get quote header
 */
export async function getQuoteHeader(quoteId: string) {
  return getDropdown(`/api/v1/auth/web/utility/quotes/${quoteId}/header/`);
}