"use client";

import React from "react";

type LoadingSpinnerProps = {
  label?: string;
  size?: number;
};

export default function LoadingSpinner({ label = "Loading", size = 32 }: LoadingSpinnerProps) {
  const spinnerSize = size;

  return (
    <div role="status" aria-live="polite" aria-busy="true" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: "epf-spin 1s linear infinite",
        }}
      >
        <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span style={{ color: "#374151", fontSize: 14 }}>{label}…</span>
      <style>{`@keyframes epf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


