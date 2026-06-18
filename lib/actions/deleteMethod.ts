"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

async function parseDeleteResponse(res: Response): Promise<Record<string, unknown>> {
  if (res.status === 204) {
    return {};
  }

  const text = await res.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatDeleteSuccess(responseData: Record<string, unknown>) {
  if (responseData.success !== undefined) {
    return {
      success: Boolean(responseData.success),
      data: responseData.data,
      message: responseData.message as string | undefined,
      errors: responseData.errors,
    };
  }

  if (responseData.code !== undefined) {
    const code = Number(responseData.code);
    const isSuccess = code >= 200 && code < 300;
    return {
      success: isSuccess,
      data: responseData.data,
      message: responseData.message as string | undefined,
      errors: responseData.errors,
    };
  }

  return {
    success: true,
    data: responseData.data ?? responseData,
    message: (responseData.message as string | undefined) || "Request successful",
  };
}

/**
 * Generic DELETE method for making authenticated API calls.
 * Automatically handles token refresh and 24-hour session validation.
 */
export async function deleteMethod(
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
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = await parseDeleteResponse(res);

    if (!res.ok) {
      // Check for authentication errors (401/403)
      if (res.status === 401 || res.status === 403) {
        // Try to refresh the token before failing
        try {
          const { refreshTokenAction } = await import("@/lib/auth");
          const refreshResult = await refreshTokenAction();
          
          if (refreshResult.success) {
            // Token refreshed successfully, retry the original request
            console.log("Token refreshed, retrying DELETE request...");
            
            // Get the new access token
            const newEncryptedToken = cookieStore.get("access_token")?.value;
            if (newEncryptedToken) {
              const newAccessToken = await decryptToken(newEncryptedToken);
              
              if (newAccessToken) {
                // Retry the request with the new token
                const retryRes = await fetch(`${process.env.BASE_URL}${endpoint}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                    "Content-Type": "application/json",
                  },
                });

                const retryResponseData = await parseDeleteResponse(retryRes);

                if (retryRes.ok) {
                  return formatDeleteSuccess(retryResponseData);
                }
              }
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed during DELETE retry:", refreshError);
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
        message:
          (responseData.message as string | undefined) ||
          (responseData.error as string | undefined) ||
          "Request failed",
        errors: responseData.errors || {},
      };
    }

    return formatDeleteSuccess(responseData);
  } catch (error) {
    console.error("DELETE request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}