"use client";

import { useState, useCallback } from "react";
import { apiGet, handleAuthError } from "@/lib/auth";

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: { authError?: boolean; status?: number } | unknown;
}

interface UseGetRequestOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (message: string, errors?: unknown) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  autoFetch?: boolean;
}

interface UseGetRequestReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: unknown;
  executeGet: (endpoint: string) => Promise<ApiResponse>;
  reset: () => void;
}

/**
 * Dynamic API call composable that handles GET requests
 * with automatic token expiration handling and redirects
 */
export function useGetRequest(options: UseGetRequestOptions = {}): UseGetRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const {
    onSuccess,
    onError,
    showSuccessMessage = true,
    showErrorMessage = true,
    autoFetch = false,
  } = options;

  const handleResponse = useCallback((response: ApiResponse): ApiResponse => {
    if (response.success) {
      setSuccess(true);
      setError(null);
      setData(response.data);

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
  }, [onSuccess, onError, showSuccessMessage, showErrorMessage]);

  const executeGet = useCallback(async (endpoint: string): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiGet(endpoint);
      
      // Handle auth errors
      if (handleAuthError(response)) {
        return response;
      }
      
      return handleResponse(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Network error occurred";
      setError(errorMessage);
      setSuccess(false);

      if (showErrorMessage) {
        console.error("GET Error:", errorMessage);
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
  }, [handleResponse, onError, showErrorMessage]);

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setData(null);
  };

  return {
    loading,
    error,
    success,
    data,
    executeGet,
    reset,
  };
}
