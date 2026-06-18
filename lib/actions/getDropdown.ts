"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Generic GET method for making authenticated API calls.
 * @param {string} endpoint - The API endpoint (without base URL)
 * @returns {Promise<{ success: boolean; data?: unknown; message?: string; errors?: unknown }>}
 */
export async function getDropdown(endpoint: string): Promise<{
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
        // Try to refresh token and retry
        try {
          const refreshToken = cookieStore.get("refresh_token")?.value;
          if (refreshToken) {
            const decryptedRefreshToken = await decryptToken(refreshToken);
            if (decryptedRefreshToken) {
              const refreshRes = await fetch(`${process.env.BASE_URL}/api/v1/auth/web/token/refresh/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: decryptedRefreshToken }),
              });

              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newAccessToken = refreshData.data.access_token;
                
                // Retry the original request with new token
                const retryRes = await fetch(`${process.env.BASE_URL}${endpoint}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                    "Content-Type": "application/json",
                  },
                });

                const retryResponseData = await retryRes.json();

                if (retryRes.ok) {
                  return {
                    success: true,
                    data: retryResponseData.data || retryResponseData,
                    message: retryResponseData.message || "Request successful",
                  };
                }
              }
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed during GET dropdown retry:", refreshError);
        }
      }

      return {
        success: false,
        message: responseData.message || responseData.error || "Request failed",
        errors: responseData.errors || {},
      };
    }

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