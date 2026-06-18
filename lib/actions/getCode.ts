"use server";

/**
 * Calls the forget password API with the provided email.
 * Stores the email in localStorage as 'emailForReset' on the client side.
 * @param {string} email - The user's email address
 * @returns {Promise<{ success: boolean; message?: string; errors?: any }>}
 */
export async function getCodeAction(email: string): Promise<{
  success: boolean;
  message?: string;
  errors?: unknown;
}> {
  try {
    const res = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/forget-password/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_or_phone: email }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || data.error || "Failed to send code",
        errors: data.errors || {},
      };
    }

    

    return {
      success: true,
      message: data.message || "Code sent successfully",
    };
  } catch (error) {
    console.error("Get code request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
