"use client";

/**
 * Client-side utility to handle auth errors and redirects
 */
export function handleAuthError(response: unknown): boolean {
  // Check if response has authError flag
  if (
    response &&
    typeof response === "object" &&
    "errors" in response &&
    response.errors &&
    typeof response.errors === "object" &&
    "authError" in response.errors &&
    response.errors.authError === true
  ) {
    // Redirect to login after a brief delay to show any toast messages
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
    return true; // Indicates auth error was handled
  }
  return false; // No auth error
}

/**
 * Check if response indicates authentication failure
 */
export function isAuthError(response: unknown): boolean {
  return Boolean(
    response &&
    typeof response === "object" &&
    "errors" in response &&
    response.errors &&
    typeof response.errors === "object" &&
    "authError" in response.errors &&
    response.errors.authError === true
  );
}

/**
 * Logout and redirect to login
 */
export function logoutAndRedirect(): void {
  // Clear any client-side storage if needed
  localStorage.clear();
  sessionStorage.clear();
  
  // Redirect to login
  window.location.href = "/login";
}
