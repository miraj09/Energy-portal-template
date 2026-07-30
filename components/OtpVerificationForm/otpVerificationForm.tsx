"use client";
import React, { useState, useRef, JSX } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Card, CardContent } from "@/ui/card";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { resetPasswordAction } from "@/lib/actions/resetPassword";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { branding } from "@/lib/config/branding";

export default function OtpVerificationForm(): JSX.Element {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Changed to 6 digits
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    // Move focus to next input if value entered
    if (value && idx < otp.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Move focus to previous input if value is cleared
    if (!value && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < otp.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(["", "", "", "", "", ""]); // Reset to 6 digits
    inputRefs.current[0]?.focus();
    // Add resend logic here
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    // if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string): string => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
    // Re-validate confirm password if it exists
    if (confirmPassword && confirmPassword !== value) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else if (confirmPassword && confirmPassword === value) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Clear confirm password error when user starts typing
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleResetPassword = async () => {
    // Validate both fields
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // If there are no errors, proceed with password reset
    if (!passwordError && !confirmPasswordError) {
      const otpValue = otp.join(""); // Will now be 6 digits
      const passwordValue = password;
      // Get email from localStorage
      const emailForReset =
        typeof window !== "undefined"
          ? localStorage.getItem("emailForReset")
          : null;

      if (!emailForReset) {
        setErrors((prev) => ({
          ...prev,
          password: "Email not found. Please try again.",
        }));
        return;
      }

      // Call API
      const result = await resetPasswordAction(
        emailForReset,
        otpValue,
        passwordValue
      );

      if (result.success) {
        // Redirect to login page
        toast.success("Password reset successful. Please log in.");
        localStorage.removeItem("emailForReset"); 
        router.push("/login");
      } else {
        setErrors((prev) => ({
          ...prev,
          password: result.message || "Failed to reset password",
        }));
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7faff] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-[749px]">
        <Card className="relative mt-[50px] sm:mt-[60px] lg:mt-[70px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] rounded-[10px]">
          <CardContent className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-48 py-8 sm:py-10 lg:py-14">
            <div className="flex flex-col items-center px-2 sm:px-4 py-6 sm:py-8 lg:py-10 max-w-[360px] mx-auto">
              {/* Header */}
              <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e9f0fb] rounded-sm flex items-center justify-center mb-2">
                  <svg
                    width="28"
                    height="9"
                    viewBox="0 0 33 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-2 sm:w-8 sm:h-3 text-primary"
                  >
                    <rect
                      x="0.4"
                      y="0.4"
                      width="32.2"
                      height="10.2"
                      rx="1.6"
                      stroke="currentColor"
                      strokeWidth="0.8"
                    />
                    <circle
                      cx="7.57143"
                      cy="5.57143"
                      r="1.07143"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                    <circle
                      cx="13.8571"
                      cy="5.57143"
                      r="1.07143"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                    <circle
                      cx="20.1427"
                      cy="5.57143"
                      r="1.07143"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                    <circle
                      cx="26.4284"
                      cy="5.57143"
                      r="1.07143"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </svg>
                </div>
                <h2 className="text-center font-inter text-xl sm:text-2xl lg:text-[30px] font-semibold text-[#2b2f38] leading-tight sm:leading-[38px] tracking-normal px-2">
                  OTP Verification
                </h2>
                <div className="text-gray-500 text-xs sm:text-sm px-2">
                  We sent a code to{" "}
                  <span className="text-primary">su***00@gmail.com</span>
                </div>
              </div>
            </div>

            {/* OTP Input */}
            <div className="flex gap-2 sm:gap-3 justify-center">
              {otp.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleChange(e.target.value.replace(/[^0-9]/g, ""), idx)
                  }
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border-[#cfd4dc] shadow-sm font-body-1-regular text-[#2b2f38] focus:border-[#346fb6] focus:ring-2 focus:ring-[#346fb6]/20 focus:outline-none"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <div className="flex flex-col w-full gap-4 mt-6 sm:gap-5">
              <div className="w-full space-y-3 sm:space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Set new Password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-shadow-xs font-body-1-regular text-sm sm:text-base text-[#2b2f38] pr-10 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto w-auto bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    size="sm"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs font-inter mt-1">
                    {errors.password}
                  </p>
                )}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-shadow-xs font-body-1-regular text-sm sm:text-base text-[#2b2f38] pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto w-auto bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    size="sm"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs font-inter mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <Button
                onClick={handleResetPassword}
                className="w-full bg-[#346fb6] hover:bg-[#2a5c9a] text-white font-body-1-medium text-sm sm:text-base tracking-[0.01em] leading-6"
              >
                Reset Password
              </Button>
            </div>

            {/* Continue Button */}
            {/* <Button
              onClick={handleContinue}
              className="w-full bg-[#346fb6] hover:bg-[#2a5c9a] text-white font-body-1-medium text-sm sm:text-base mt-5"
            >
              Continue
            </Button> */}

            {/* Timer and Resend */}
            <div className="text-center text-gray-500 text-xs sm:text-sm mt-2 px-2">
              {timer > 0 ? (
                <span>
                  <span className="text-[#346fb6] font-medium">
                    {timer} Second
                  </span>{" "}
                  Timer after that resend button will be visible.
                </span>
              ) : (
                <span>
                  Didn&apos;t receive the email?{" "}
                  <button
                    className="text-[#346fb6] font-medium hover:underline focus:outline-none"
                    onClick={handleResend}
                  >
                    Resend
                  </button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[250px] sm:w-[280px] lg:w-[304px] h-[80px] sm:h-[90px] lg:h-[101px] bg-white rounded-[20px] border border-solid border-[#0066ff] shadow-[0px_4px_10px_rgba(0,0,0,0.25)] flex items-center justify-center">
          <Image
            width={187}
            height={70}
            className="w-[150px] sm:w-[170px] lg:w-[187px] h-[55px] sm:h-[65px] lg:h-[70px] object-contain"
            alt={branding.logoAlt}
            src={branding.logoSrc}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
