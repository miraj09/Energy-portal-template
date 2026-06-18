"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/**
 * Uploads a file attachment to a ticket.
 * Uses the access token from cookies for authentication.
 * @param {File} file - The file to upload
 * @param {string} publicId - The public_id of the ticket
 * @returns {Promise<{ success: boolean; message?: string; errors?: any }>}
 */
export async function uploadTicketAttachmentAction(
  file: File,
  publicId: string
): Promise<{
  success: boolean;
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

    // Check if file is provided
    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Check if publicId is provided
    if (!publicId) {
      return {
        success: false,
        message: "No ticket ID provided",
      };
    }

    // Create FormData and append the file
    const formData = new FormData();
    formData.append("files", file);

    // Make API request to upload ticket attachment endpoint
    const res = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/utility/tickets/${publicId}/add_attachment/`,
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
        message: data.message || data.error || "Failed to upload attachment",
        errors: data.errors || {},
      };
    }

    return {
      success: true,
      message: data.message || "Attachment uploaded successfully",
    };
  } catch (error) {
    console.error("Ticket attachment upload request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
