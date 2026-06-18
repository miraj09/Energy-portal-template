"use server";

import { getAccessToken, getRefreshToken, clearTokens, storeTokens } from "./token-manager";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}

/**
 * Make authenticated API call with automatic token refresh
 */
export async function authenticatedFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL environment variable is not set");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  try {
    // Get current access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return {
        success: false,
        message: "Authentication required",
        errors: { authError: true, status: 401 }
      };
    }

    // Make the API call
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    // If successful, return the response
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    }

    // Handle authentication errors (401/403)
    if (response.status === 401 || response.status === 403) {
      console.log("🔄 API call failed with 401/403, attempting token refresh...");
      // Try to refresh the token
      const refreshResult = await refreshAccessToken();
      
      if (refreshResult.success && refreshResult.data) {
        console.log("✅ API token refresh successful, retrying request...");
        // Retry the original request with new token
        const newAccessToken = refreshResult.data.access_token;
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newAccessToken}`,
            ...options.headers,
          },
        });

        if (retryResponse.ok) {
          console.log("✅ API retry successful after token refresh");
          const data = await retryResponse.json();
          return {
            success: true,
            data: data.data || data,
            message: data.message,
          };
        } else {
          console.log("❌ API retry failed after token refresh:", retryResponse.status);
        }
      } else {
        console.log("❌ API token refresh failed:", refreshResult.message);
      }

      // If refresh failed or retry failed, clear tokens and return auth error
      await clearTokens();
      return {
        success: false,
        message: "Authentication failed",
        errors: { authError: true, status: response.status }
      };
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || errorData.error || "Request failed",
      errors: errorData.errors || {},
    };

  } catch (error) {
    console.error("API request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<ApiResponse<{ access_token: string; refresh_token?: string }>> {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        message: "No refresh token available",
        errors: { authError: true, status: 401 }
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
        errors: { authError: true, status: response.status }
      };
    }

    // Store new tokens
    const newTokens = {
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
    };

    await storeTokens(newTokens);
    console.log("Token refreshed")

    return {
      success: true,
      data: newTokens,
      message: "Token refreshed successfully",
    };

  } catch (error) {
    console.error("Token refresh failed:", error);
    return {
      success: false,
      message: "Token refresh failed",
      errors: { authError: true, status: 401 }
    };
  }
}

/**
 * Make a GET request
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return authenticatedFetch<T>(endpoint, { method: "GET" });
}

/**
 * Make a POST request
 */
export async function apiPost<T = unknown>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
  return authenticatedFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Make a PATCH request
 */
export async function apiPatch<T = unknown>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
  return authenticatedFetch<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return authenticatedFetch<T>(endpoint, { method: "DELETE" });
}
