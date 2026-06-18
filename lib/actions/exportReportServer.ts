"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Authenticated GET for report exports, returns base64 + metadata.
 */
export async function exportReport(endpoint: string): Promise<{
  success: boolean;
  data?: { base64: string; contentType: string; filename: string };
  message?: string;
  errors?: unknown;
}> {
  try {
    const cookieStore = await cookies();
    const encryptedToken = cookieStore.get("access_token")?.value;

    if (!encryptedToken) {
      return {
        success: false,
        message: "Authentication required",
        errors: { authError: true, status: 401 },
      };
    }

    const accessToken = await decryptToken(encryptedToken);
    if (!accessToken) {
      return {
        success: false,
        message: "Invalid authentication token",
        errors: { authError: true, status: 401 },
      };
    }

    const fullUrl = `${process.env.BASE_URL}${endpoint}`;
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      let responseText = "";
      try {
        responseText = await res.text();
      } catch {}

      if (res.status === 401 || res.status === 403) {
        try {
          // Try manual refresh using refresh token (same pattern as getDropdown.ts)
          const refreshEncrypted = cookieStore.get("refresh_token")?.value;
          if (refreshEncrypted) {
            const refreshToken = await decryptToken(refreshEncrypted);
            if (refreshToken) {
              const refreshRes = await fetch(
                `${process.env.BASE_URL}/api/v1/auth/web/token/refresh/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ refresh_token: refreshToken }),
                }
              );

              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newAccessToken =
                  (refreshData?.data?.access_token as string) || "";
                if (newAccessToken) {
                  const retryRes = await fetch(fullUrl, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${newAccessToken}` },
                  });
                  if (retryRes.ok) {
                    const contentType =
                      retryRes.headers.get("content-type") ||
                      "application/octet-stream";
                    const contentDisposition =
                      retryRes.headers.get("content-disposition") ||
                      'attachment; filename="download"';
                    const match = /filename="?([^";]+)"?/i.exec(
                      contentDisposition || ""
                    );
                    const filename = match?.[1] || "download";
                    const arrayBuffer = await retryRes.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString("base64");
                    return {
                      success: true,
                      data: { base64, contentType, filename },
                      message: "Download ready",
                    };
                  } else {
                    const txt = await retryRes.text();
                    return {
                      success: false,
                      message: txt || "Request failed",
                      errors: { status: retryRes.status },
                    };
                  }
                }
              }
            }
          }
        } catch (refreshError) {
          console.error(
            "Token refresh failed during export report retry:",
            refreshError
          );
        }
        return {
          success: false,
          message: "Authentication failed",
          errors: { authError: true, status: res.status },
        };
      }

      return {
        success: false,
        message: responseText || "Request failed",
        errors: { status: res.status },
      };
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      res.headers.get("content-disposition") ||
      'attachment; filename="download"';
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition || "");
    const filename = match?.[1] || "download";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return {
      success: true,
      data: { base64, contentType, filename },
      message: "Download ready",
    };
  } catch (error) {
    console.error("GET export request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}

// Direct export without specifying format (server decides content)
export async function exportReports(endpoint: string): Promise<{
  success: boolean;
  data?: { base64: string; contentType: string; filename: string };
  message?: string;
  errors?: unknown;
}> {
  return exportReport(endpoint);
}
