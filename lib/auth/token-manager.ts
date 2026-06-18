"use server";

import { cookies } from "next/headers";
import { encryptToken } from "@/lib/encrypt";
import { decryptToken } from "@/lib/decrypt";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface TokenResponse {
  success: boolean;
  data?: AuthTokens;
  message?: string;
}

/**
 * Store encrypted tokens in cookies
 */
export async function storeTokens(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();
  
  const encryptedAccessToken = await encryptToken(tokens.access_token);
  const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

  const cookieOptions = {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };

  cookieStore.set("access_token", encryptedAccessToken, cookieOptions);
  cookieStore.set("refresh_token", encryptedRefreshToken, refreshCookieOptions);
}

/**
 * Get decrypted access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const encryptedToken = cookieStore.get("access_token")?.value;
  
  if (!encryptedToken) return null;
  
  return await decryptToken(encryptedToken);
}

/**
 * Get decrypted refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const encryptedToken = cookieStore.get("refresh_token")?.value;
  
  if (!encryptedToken) return null;
  
  return await decryptToken(encryptedToken);
}

/**
 * Clear all auth cookies
 */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

/**
 * Check if access token exists (basic check)
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

// Note: Avoid exporting non-async objects from a "use server" module
