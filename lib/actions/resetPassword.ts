"use server";

/**
 * Calls the reset password API with the provided email, OTP, and new password.
 * @param {string} emailOrPhone - The user's email or phone
 * @param {string} otp - The OTP code
 * @param {string} newPassword - The new password to set
 * @returns {Promise<{ success: boolean; message?: string; errors?: any }>}
 */
export async function resetPasswordAction(
  emailOrPhone: string,
  otp: string,
  newPassword: string
): Promise<{
  success: boolean;
  message?: string;
  errors?: unknown;
}> {
  try {
    const res = await fetch(
      `${process.env.BASE_URL}/api/v1/auth/web/forget-password-confirm/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_or_phone: emailOrPhone,
          otp,
          new_password: newPassword,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || data.error || "Failed to reset password",
        errors: data.errors || {},
      };
    }

    return {
      success: true,
      message: data.message || "Password reset successfully",
    };
  } catch (error) {
    console.error("Reset password request failed:", error);
    return {
      success: false,
      message: "Network error. Please check your connection.",
    };
  }
}
