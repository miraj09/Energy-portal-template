"use server";

import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

interface UploadSubmittedSaleDocumentResult {
  success: boolean;
  message?: string;
  errors?: unknown;
}

/**
 * Uploads an additional document for submitted sales.
 *
 * 1. Uploads the raw file to `/api/v1/auth/web/upload-file/`.
 * 2. Sends the uploaded file URL and provided title to
 *    `/api/v1/auth/web/core/submitted-sales/{id}/` in the
 *    `additional_documents` key as payload.
 */
export async function uploadSubmittedSaleDocumentAction(
  file: File,
  submittedSaleId: string,
  title: string
): Promise<UploadSubmittedSaleDocumentResult> {
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

    if (!file) {
      return {
        success: false,
        message: "No file provided",
      };
    }

    // Prepare multipart form data for the upload-file endpoint
    const formData = new FormData();
    // Append under both common keys to be robust against backend expectations
    formData.append("file", file);
    // formData.append("files", file);
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
        errors: uploadData?.errors || {},
      };
    }

    // Try to extract the uploaded file URL from a few common shapes
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

    // Now send the file details to submitted-sales detail endpoint in additional_documents key
    const payload = {
      additional_documents: [
        {
          title: title.trim(),
          file_url: fileUrl,
        },
      ],
    } as const;

    // NOTE:
    // We use PATCH here instead of PUT because the backend
    // submitted-sales endpoint expects a partial update. Using PUT
    // would require sending all existing fields and can cause
    // validation failures, which then surface as "failed" in the UI
    // even though the file upload itself succeeded.
    const submittedRes = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/core/submitted-sales/${submittedSaleId}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const submittedData = await submittedRes.json().catch(() => ({}));

    if (!submittedRes.ok) {
      return {
        success: false,
        message:
          submittedData?.message ||
          submittedData?.error ||
          "Failed to register additional document with submitted sales",
        errors: submittedData?.errors || {},
      };
    }

    return {
      success: true,
      message:
        submittedData?.message ||
        "Additional document uploaded and linked successfully",
    };
  } catch (error) {
    console.error("Submitted sale document upload failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
