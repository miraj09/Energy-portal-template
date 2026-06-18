"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

/** Result of uploading a file to the generic upload endpoint. */
export interface UploadLoaFileResult {
  success: boolean;
  /** URL of the uploaded file; only set when success is true. */
  fileUrl?: string;
  message?: string;
  errors?: unknown;
}

/**
 * Uploads a file to the generic upload endpoint and returns its URL.
 * Same pattern as uploadSubmittedSaleDocument: POST to /api/v1/auth/web/upload-file/,
 * then return the file_url from the response for use in other APIs (e.g. LOA send-signing-loa-manual).
 */
export async function uploadLoaFileAction(
  file: File
): Promise<UploadLoaFileResult> {
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

    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/upload-file/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      return {
        success: false,
        message:
          uploadData?.message ||
          uploadData?.error ||
          "Failed to upload file",
        errors: uploadData?.errors ?? {},
      };
    }

    const fileUrl =
      uploadData?.file_url ??
      uploadData?.url ??
      uploadData?.file?.file_url ??
      uploadData?.data?.file_url ??
      uploadData?.data?.url ??
      (Array.isArray(uploadData)
        ? uploadData[0]?.file_url || uploadData[0]?.url
        : undefined);

    if (!fileUrl || typeof fileUrl !== "string") {
      return {
        success: false,
        message: "File uploaded but no file_url returned from server",
        errors: uploadData,
      };
    }

    return {
      success: true,
      fileUrl,
      message: "File uploaded successfully",
    };
  } catch (error) {
    console.error("LOA file upload failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
