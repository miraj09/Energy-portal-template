"use client";

import React, { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { branding } from "@/lib/config/branding";

export default function NewPasswordForm(): JSX.Element {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

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
      setErrors(prev => ({ ...prev, password: "" }));
    }
    // Re-validate confirm password if it exists
    if (confirmPassword && confirmPassword !== value) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (confirmPassword && confirmPassword === value) {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Clear confirm password error when user starts typing
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleResetPassword = () => {
    // Validate both fields
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // If there are no errors, proceed with password reset
    if (!passwordError && !confirmPasswordError) {
      console.log("Reset Password button clicked");
      router.push("/login");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7faff] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-[749px]">
        <Card className="relative mt-[50px] sm:mt-[60px] lg:mt-[70px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] rounded-[10px]">
          <CardContent className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-48 py-8 sm:py-10 lg:py-14">
            <div className="flex flex-col items-center px-2 sm:px-4 py-6 sm:py-8 lg:py-10 max-w-[360px] mx-auto">
              <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e9f0fb] rounded-sm flex items-center justify-center mb-2">
                  <svg
                    width="28"
                    height="20"
                    viewBox="0 0 33 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-4 sm:w-8 sm:h-6 text-primary"
                  >
                    <path
                      d="M21.0834 4.914V4.08333C21.0834 3.00037 20.6532 1.96175 19.8874 1.19598C19.1217 0.430207 18.083 0 17.0001 0C15.9171 0 14.8785 0.430207 14.1127 1.19598C13.347 1.96175 12.9167 3.00037 12.9167 4.08333V4.914C12.3972 5.14074 11.955 5.51397 11.6442 5.98804C11.3334 6.46211 11.1675 7.01647 11.1667 7.58333V11.0833C11.1677 11.8566 11.4753 12.5979 12.022 13.1447C12.5688 13.6915 13.3102 13.9991 14.0834 14H19.9167C20.69 13.9991 21.4313 13.6915 21.9781 13.1447C22.5249 12.5979 22.8325 11.8566 22.8334 11.0833V7.58333C22.8327 7.01647 22.6668 6.46211 22.356 5.98804C22.0452 5.51397 21.603 5.14074 21.0834 4.914ZM14.0834 4.08333C14.0834 3.30979 14.3907 2.56792 14.9377 2.02094C15.4847 1.47396 16.2265 1.16667 17.0001 1.16667C17.7736 1.16667 18.5155 1.47396 19.0625 2.02094C19.6095 2.56792 19.9167 3.30979 19.9167 4.08333V4.66667H14.0834V4.08333ZM21.6667 11.0833C21.6667 11.5475 21.4824 11.9926 21.1542 12.3208C20.826 12.649 20.3809 12.8333 19.9167 12.8333H14.0834C13.6193 12.8333 13.1742 12.649 12.846 12.3208C12.5178 11.9926 12.3334 11.5475 12.3334 11.0833V7.58333C12.3334 7.1192 12.5178 6.67408 12.846 6.3459C13.1742 6.01771 13.6193 5.83333 14.0834 5.83333H19.9167C20.3809 5.83333 20.826 6.01771 21.1542 6.3459C21.4824 6.67408 21.6667 7.1192 21.6667 7.58333V11.0833Z"
                      fill="currentColor"
                    />
                    <path
                      d="M17.0001 8.1665C16.8454 8.1665 16.697 8.22796 16.5876 8.33736C16.4782 8.44675 16.4167 8.59513 16.4167 8.74984V9.9165C16.4167 10.0712 16.4782 10.2196 16.5876 10.329C16.697 10.4384 16.8454 10.4998 17.0001 10.4998C17.1548 10.4998 17.3032 10.4384 17.4126 10.329C17.522 10.2196 17.5834 10.0712 17.5834 9.9165V8.74984C17.5834 8.59513 17.522 8.44675 17.4126 8.33736C17.3032 8.22796 17.1548 8.1665 17.0001 8.1665Z"
                      fill="currentColor"
                    />
                    <rect
                      x="0.4"
                      y="13.4"
                      width="32.2"
                      height="10.2"
                      rx="1.6"
                      stroke="currentColor"
                      strokeWidth="0.8"
                    />
                    <circle
                      cx="7.57143"
                      cy="18.5714"
                      r="1.57143"
                      fill="currentColor"
                    />
                    <circle
                      cx="13.8571"
                      cy="18.5714"
                      r="1.57143"
                      fill="currentColor"
                    />
                    <circle
                      cx="20.143"
                      cy="18.5714"
                      r="1.57143"
                      fill="currentColor"
                    />
                    <circle
                      cx="26.4286"
                      cy="18.5714"
                      r="1.57143"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h2 className="text-center font-inter text-xl sm:text-2xl lg:text-[30px] font-semibold text-[#2b2f38] leading-tight sm:leading-[38px] tracking-normal w-max px-2">
                  Create a new Password
                </h2>
                <div className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 px-2">
                  Please choose a password that hasn&apos;t been used before.
                  Must be at least 8 characters.
                </div>
              </div>

              <div className="flex flex-col w-full gap-4 sm:gap-5">
                <div className="w-full space-y-3 sm:space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Set new Password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-shadow-xs font-body-1-regular text-sm sm:text-base text-[#2b2f38] pr-10 ${
                        errors.password ? "border-red-500 focus:border-red-500" : ""
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
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-shadow-xs font-body-1-regular text-sm sm:text-base text-[#2b2f38] pr-10 ${
                        errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
            </div>
          </CardContent>
        </Card>

        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[250px] sm:w-[280px] lg:w-[304px] h-[80px] sm:h-[90px] lg:h-[101px] bg-white rounded-[20px] border border-solid border-[#0066ff] shadow-[0px_4px_10px_rgba(0,0,0,0.25)] flex items-center justify-center">
          <Image
            width={187}
            height={70}
            className="w-[150px] sm:w-[170px] lg:w-[187px] h-[55px] sm:h-[65px] lg:h-[70px] object-cover"
            alt={branding.logoAlt}
            src={branding.logoSrc}
          />
        </div>
      </div>
    </div>
  );
}
