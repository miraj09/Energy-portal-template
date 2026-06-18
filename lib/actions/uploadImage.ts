"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Uploads an image file to the server.
 * Uses the access token from cookies for authentication.
 * @param {File} file - The image file to upload
 * @returns {Promise<{ success: boolean; message?: string; file_url?: string; errors?: any }>}
 */
export async function uploadImageAction(file: File): Promise<{
  success: boolean;
  message?: string;
  file_url?: string;
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

    // Check if file is provided
    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Create FormData and append the file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", "100");

    // Make API request to upload image endpoint
    const res = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/upload-image/`,
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
        message: data.message || data.error || "Failed to upload image",
        errors: data.errors || {},
      };
    }

    return {
      success: true,
      message: data.data.message || "File uploaded successfully",
      file_url: data.data.file_url,
    };
  } catch (error) {
    console.error("Image upload request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
