"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Generic PATCH method for making authenticated API calls with JSON data.
 * Automatically handles token refresh and 24-hour session validation.
 */
export async function patchMethod(
  data: object,
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
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      // Check for authentication errors (401/403)
      if (res.status === 401 || res.status === 403) {
        // Try to refresh the token before failing
        try {
          const { refreshTokenAction } = await import("@/lib/auth");
          const refreshResult = await refreshTokenAction();
          
          if (refreshResult.success) {
            // Token refreshed successfully, retry the original request
            console.log("Token refreshed, retrying PATCH request...");
            
            // Get the new access token
            const newEncryptedToken = cookieStore.get("access_token")?.value;
            if (newEncryptedToken) {
              const newAccessToken = await decryptToken(newEncryptedToken);
              
              if (newAccessToken) {
                // Retry the request with the new token
                const retryRes = await fetch(`${process.env.BASE_URL}${endpoint}`, {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(data),
                });

                const retryResponseData = await retryRes.json();

                if (retryRes.ok) {
                  // Handle different API response formats for retry
                  if (retryResponseData.success !== undefined) {
                    return {
                      success: retryResponseData.success,
                      data: retryResponseData.data,
                      message: retryResponseData.message,
                      errors: retryResponseData.errors,
                    };
                  }

                  if (retryResponseData.code !== undefined) {
                    const isSuccess = retryResponseData.code >= 200 && retryResponseData.code < 300;
                    return {
                      success: isSuccess,
                      data: retryResponseData.data,
                      message: retryResponseData.message,
                      errors: retryResponseData.errors,
                    };
                  }

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
          console.error("Token refresh failed during PATCH retry:", refreshError);
        }
        
        // If refresh failed or retry failed, return auth error
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

    // Handle APIs that return code/status format
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
    console.error("PATCH request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}