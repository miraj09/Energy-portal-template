"use client";
import React, { JSX } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCodeAction } from "@/lib/actions/getCode";
import { toast } from "sonner";
import { branding } from "@/lib/config/branding";

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleGetCode = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    try {
      const res = await getCodeAction(email);
      if (res.success) {
        localStorage.setItem("emailForReset", email);
        router.push("/verify-email");
        toast.success('OTP sent successfully! Please check your email.');
      } else {
        setError(res.message || "Failed to send code. Please try again.");
      }
    } catch (err) {
      console.error("Error sending code:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7faff] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-[749px]">
        <Card className="relative mt-[50px] sm:mt-[60px] lg:mt-[70px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] rounded-[10px]">
          <CardContent className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-48 py-8 sm:py-10 lg:py-14">
            <div className="flex flex-col items-center px-2 sm:px-4 py-6 sm:py-8 lg:py-10 max-w-[360px] mx-auto">
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-full mb-6 sm:mb-8">
                <div className="bg-[#e8f0fe] rounded-sm p-3 sm:p-4 mb-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 sm:w-7 sm:h-7 text-primary"
                  >
                    <path
                      d="M22.1668 9.828V8.16667C22.1668 6.00073 21.3064 3.92351 19.7749 2.39196C18.2433 0.860414 16.1661 0 14.0002 0C11.8342 0 9.757 0.860414 8.22546 2.39196C6.69391 3.92351 5.8335 6.00073 5.8335 8.16667V9.828C4.79442 10.2815 3.91 11.0279 3.28841 11.9761C2.66682 12.9242 2.33499 14.0329 2.3335 15.1667V22.1667C2.33535 23.7132 2.95053 25.1959 4.04409 26.2894C5.13765 27.383 6.6203 27.9981 8.16683 28H19.8335C21.38 27.9981 22.8627 27.383 23.9562 26.2894C25.0498 25.1959 25.665 23.7132 25.6668 22.1667V15.1667C25.6653 14.0329 25.3335 12.9242 24.7119 11.9761C24.0903 11.0279 23.2059 10.2815 22.1668 9.828ZM8.16683 8.16667C8.16683 6.61957 8.78141 5.13584 9.87537 4.04188C10.9693 2.94791 12.4531 2.33333 14.0002 2.33333C15.5473 2.33333 17.031 2.94791 18.125 4.04188C19.2189 5.13584 19.8335 6.61957 19.8335 8.16667V9.33333H8.16683V8.16667ZM23.3335 22.1667C23.3335 23.0949 22.9647 23.9852 22.3084 24.6415C21.652 25.2979 20.7618 25.6667 19.8335 25.6667H8.16683C7.23857 25.6667 6.34833 25.2979 5.69196 24.6415C5.03558 23.9852 4.66683 23.0949 4.66683 22.1667V15.1667C4.66683 14.2384 5.03558 13.3482 5.69196 12.6918C6.34833 12.0354 7.23857 11.6667 8.16683 11.6667H19.8335C20.7618 11.6667 21.652 12.0354 22.3084 12.6918C22.9647 13.3482 23.3335 14.2384 23.3335 15.1667V22.1667Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.0002 16.3335C13.6907 16.3335 13.394 16.4564 13.1752 16.6752C12.9564 16.894 12.8335 17.1907 12.8335 17.5002V19.8335C12.8335 20.1429 12.9564 20.4397 13.1752 20.6585C13.394 20.8772 13.6907 21.0002 14.0002 21.0002C14.3096 21.0002 14.6063 20.8772 14.8251 20.6585C15.0439 20.4397 15.1668 20.1429 15.1668 19.8335V17.5002C15.1668 17.1907 15.0439 16.894 14.8251 16.6752C14.6063 16.4564 14.3096 16.3335 14.0002 16.3335Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h1 className="text-center font-inter text-xl sm:text-2xl lg:text-[24px] font-semibold text-[#2b2f38] leading-tight sm:leading-[38px] tracking-normal px-2">
                  Forget Your Password
                </h1>
                <p className="text-center font-inter text-sm sm:text-base font-normal text-gray-500 leading-5 sm:leading-6 tracking-normal px-2">
                  Forgot your password? Please enter your email and we&apos;ll
                  send you a 4-digit code.
                </p>
              </div>

              <div className="flex flex-col w-full gap-4 sm:gap-5">
                <div className="w-full space-y-4 sm:space-y-5">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="font-inter text-sm font-medium text-[#48505e] leading-5 tracking-normal"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-3 sm:px-3.5 py-2.5 border-[#cfd4dc] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] font-inter text-sm sm:text-base font-normal text-[#667085]"
                    />
                    {!validateEmail(email) && email.length > 0 && (
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                    )}
                  </div>
                  {/* Get Code Button */}
                  <Button
                    onClick={handleGetCode}
                    className="w-full bg-[#346fb6] hover:bg-[#2a5c9a] text-white font-body-1-medium text-sm sm:text-base tracking-[0.01em] leading-6"
                  >
                    Get 4-digit code
                  </Button>
                </div>
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
