"use client";

import { useState } from "react";
import { deleteMethod } from "@/lib/actions/deleteMethod";

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown;
}

interface UseDeleteApiCallOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (message: string, errors?: unknown) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

interface UseDeleteApiCallReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  executeDelete: (endpoint: string) => Promise<ApiResponse>;
  reset: () => void;
}

/**
 * Dynamic API call composable that handles DELETE requests
 * with automatic token expiration handling and redirects
 */
export function useDeleteApiCall(
  options: UseDeleteApiCallOptions = {}
): UseDeleteApiCallReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    onSuccess,
    onError,
    showSuccessMessage = true,
    showErrorMessage = true,
  } = options;

  const handleResponse = async (response: ApiResponse): Promise<ApiResponse> => {
    if (response.success) {
      setSuccess(true);
      setError(null);

      if (showSuccessMessage && response.message) {
        // You can integrate with your toast/notification system here
        console.log("Success:", response.message);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
    } else {
      setSuccess(false);
      setError(response.message || "An error occurred");


      if (showErrorMessage && response.message) {
        // You can integrate with your toast/notification system here
        console.error("Error:", response.message);
      }

      if (onError) {
        onError(response.message || "An error occurred", response.errors);
      }
    }

    return response;
  };

  const executeDelete = async (endpoint: string): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await deleteMethod(endpoint);
      return await handleResponse(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Network error occurred";
      setError(errorMessage);
      setSuccess(false);

      if (showErrorMessage) {
        console.error("DELETE Error:", errorMessage);
      }

      if (onError) {
        onError(errorMessage);
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    loading,
    error,
    success,
    executeDelete,
    reset,
  };
}