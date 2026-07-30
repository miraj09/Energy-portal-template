"use client";

import React, { JSX, startTransition, useState, useActionState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/lib/auth";
import type { UserRecord } from "@/lib/types/user";
import { branding } from "@/lib/config/branding";

const USER_STORAGE_KEY = "energy_user_Data";

export default function LoginForm(): JSX.Element {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  type ActionState = {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    userData?: UserRecord;
    defaultRoute?: string;
  };

  const [state, formAction, isPending = false] = useActionState<
    ActionState,
    FormData
  >(loginAction, {
    success: false,
    message: "",
    errors: {},
    userData: undefined,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataObj = new FormData();
    formDataObj.append("email", formData.email);
    formDataObj.append("password", formData.password);
    startTransition(() => {
      formAction(formDataObj);
    });
  };

  React.useEffect(() => {
    if (!state.success) {
      return;
    }

    if (state.userData) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.userData));
      } catch {
        // ignore storage errors
      }
    }

    router.push(state.defaultRoute || "/dashboard");
    router.refresh();
  }, [state.success, state.userData, state.defaultRoute, router]);

  return (
    <div className="w-full min-h-screen bg-[#f7faff] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-[749px]">
        <Card className="relative mt-[50px] sm:mt-[60px] lg:mt-[70px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] rounded-[10px]">
          <CardContent className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-48 py-8 sm:py-10 lg:py-14">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center px-2 sm:px-4 py-6 sm:py-8 lg:py-10 max-w-[360px] mx-auto"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-full mb-6 sm:mb-8">
                <h1 className="text-center font-inter text-xl sm:text-2xl lg:text-[30px] font-semibold text-[#2b2f38] leading-tight sm:leading-[38px] tracking-normal px-2">
                  Log in to your account
                </h1>
                <p className="text-center font-inter text-sm sm:text-base font-normal text-gray-500 leading-5 sm:leading-6 tracking-normal px-2">
                  Welcome back! Please enter your details.
                </p>
              </div>

              {state.message && !state.success && (
                <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm font-inter">
                    {state.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col w-full gap-4 sm:gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="email"
                    className="font-inter text-sm font-medium text-[#48505e] leading-5 tracking-normal"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] font-inter text-sm sm:text-base font-normal text-[#858D9D] ${
                      state.errors?.email
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="password"
                    className="font-inter text-sm font-medium text-[#48505e] leading-5 tracking-normal"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] font-inter text-sm sm:text-base font-normal text-[#858D9D] pr-10 ${
                        state.errors?.password
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
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
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mt-4 sm:mt-5 gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) =>
                      handleInputChange("remember", checked as boolean)
                    }
                    className="w-4 h-4 rounded border-[#cfd4dc]"
                  />
                  <Label
                    htmlFor="remember"
                    className="font-inter text-sm font-medium text-[#48505e] leading-5 tracking-normal"
                  >
                    Remember
                  </Label>
                </div>
                <Button
                  type="button"
                  onClick={() => router.push("/forget-password")}
                  variant="link"
                  className="p-0 h-auto font-inter text-sm font-medium text-[#346fb6] leading-5 tracking-normal hover:underline self-start sm:self-auto"
                >
                  Forgot password
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 sm:mt-5 bg-[#346fb6] hover:bg-[#2d5a99] text-white font-inter text-sm sm:text-base font-medium leading-6 tracking-normal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
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
