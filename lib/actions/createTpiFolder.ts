"use server";

import { postMethod } from "./postMethod";

export interface CreateTpiFolderRequest {
  name: string;
  parent?: number | null;
}

export interface CreateTpiFolderResponse {
  success: boolean;
  data?: {
    id: number;
    name: string;
    slug: string;
    parent: number | null;
    path: string;
    children_count: number;
    documents_count: number;
    created_at: string;
  };
  message?: string;
  errors?: { authError?: boolean; status?: number } | unknown;
}

/**
 * Create a new TPI folder
 * @param folderData - The folder data to create
 * @returns Promise with the created folder or error
 */
export async function createTpiFolder(
  folderData: CreateTpiFolderRequest
): Promise<CreateTpiFolderResponse> {
  try {
    const response = await postMethod(
      folderData,
      "/api/v1/auth/web/utility/tpi-folders/"
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data as CreateTpiFolderResponse["data"],
        message: response.message || "Folder created successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create folder",
      errors: response.errors,
    };
  } catch (error) {
    console.error("Error creating TPI folder:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
