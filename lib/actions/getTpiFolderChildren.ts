"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";
import type { TpiFolder } from "./getTpiFolders";

export interface TpiDocument {
  id: number;
  folder: number | null;
  name: string;
  file: string;
  file_url: string;
  size: number;
  content_type: string;
  extension: string;
  uploaded_at: string;
}

export interface TpiFolderChildrenResponse {
  code: number;
  status: string;
  message: string | null;
  data: {
    folders: TpiFolder[];
    documents: TpiDocument[];
  };
  errors?: Record<string, unknown>;
}

export interface TpiFolderChildrenApiResponse {
  success: boolean;
  data?: {
    folders: TpiFolder[];
    documents: TpiDocument[];
  };
  message?: string;
  errors?: { authError?: boolean; status?: number } | unknown;
}

/**
 * Fetch TPI folder children (folders and documents) by folder ID
 * @param folderId - The folder ID to fetch children for
 * @returns Promise with the folder children or error
 */
export async function getTpiFolderChildren(folderId: number): Promise<TpiFolderChildrenApiResponse> {
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

    // Make API request to fetch folder children
    const res = await fetch(`${process.env.BASE_URL}/api/v1/auth/web/utility/tpi-folders/${folderId}/children/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData: TpiFolderChildrenResponse = await res.json();

    if (!res.ok) {
      // Check for authentication errors (401/403)
      if (res.status === 401 || res.status === 403) {
        // Try to refresh the token before failing
        try {
          const { refreshTokenAction } = await import("@/lib/auth");
          const refreshResult = await refreshTokenAction();
          
          if (refreshResult.success) {
            // Token refreshed successfully, retry the original request
            console.log("Token refreshed, retrying folder children request...");
            
            // Get the new access token
            const newEncryptedToken = cookieStore.get("access_token")?.value;
            if (newEncryptedToken) {
              const newAccessToken = await decryptToken(newEncryptedToken);
              
              if (newAccessToken) {
                // Retry the request with the new token
                const retryRes = await fetch(`${process.env.BASE_URL}/api/v1/auth/web/utility/tpi-folders/${folderId}/children/`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                    "Content-Type": "application/json",
                  },
                });

                const retryResponseData: TpiFolderChildrenResponse = await retryRes.json();

                if (retryRes.ok) {
                  return {
                    success: true,
                    data: retryResponseData.data,
                    message: retryResponseData.message || "Folder children fetched successfully",
                  };
                }
              }
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed during folder children retry:", refreshError);
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
        message: typeof responseData.message === "string" && responseData.message
          ? responseData.message
          : "Failed to fetch folder children",
        errors: responseData.errors || {},
      };
    }

    return {
      success: true,
      data: responseData.data,
      message: responseData.message || "Folder children fetched successfully",
    };
  } catch (error) {
    console.error("Folder children request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
