"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Uploads a TPI document to the server.
 * Uses the access token from cookies for authentication.
 * @param {File} file - The file to upload
 * @param {string} name - The name of the document
 * @param {number | null} folder - The folder ID (null for top level)
 * @returns {Promise<{ success: boolean; message?: string; data?: any; errors?: any }>}
 */
export async function uploadTpiDocumentAction(
  file: File,
  name: string,
  folder: number | null = null
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    file: string;
    file_url?: string;
    size?: number;
    content_type?: string;
    extension?: string;
    uploaded_at?: string;
    folder?: number | null;
  };
  errors?: { authError?: boolean; status?: number } | Record<string, unknown>;
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

    // Check if file is provided
    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Check if name is provided
    if (!name.trim()) {
      return {
        success: false,
        message: "Document name is required",
      };
    }

    // Create FormData and append the file and other data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());
    formData.append("content_type", file.type);
    
    // Only append folder if it's not null
    if (folder !== null) {
      formData.append("folder", folder.toString());
    }

    // Make API request to upload TPI document endpoint
    const res = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/utility/tpi-documents/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    const data = await res.json();

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
        message: data.message || data.error || "Failed to upload document",
        errors: data.errors || {},
      };
    }

    return {
      success: true,
      message: data.message || "Document uploaded successfully",
      data: data.data || data,
    };
  } catch (error) {
    console.error("TPI document upload request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
