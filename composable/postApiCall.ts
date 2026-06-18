"use client";

import { useState } from "react";
import { postMethod } from "@/lib/actions/postMethod";

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown;
}

interface UsePostApiCallOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (message: string, errors?: unknown) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

interface UsePostApiCallReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  executePost: (endpoint: string, payload: object) => Promise<ApiResponse>;
  reset: () => void;
}

/**
 * Dynamic API call composable that handles POST requests
 * with automatic token expiration handling and redirects
 */
export function usePostApiCall(options: UsePostApiCallOptions = {}): UsePostApiCallReturn {
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

  const executePost = async (
    endpoint: string,
    payload: object
  ): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await postMethod(payload, endpoint);
      return await handleResponse(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Network error occurred";
      setError(errorMessage);
      setSuccess(false);

      if (showErrorMessage) {
        console.error("POST Error:", errorMessage);
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
    executePost,
    reset,
  };
}