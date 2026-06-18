import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";
import { encryptToken } from "@/lib/encrypt";
import { createSessionExpiredError } from "@/lib/constants/authErrors";

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60,
};

type TokenRefreshResult = {
  success: boolean;
  encryptedAccessToken?: string;
};

let refreshInProgress: Promise<TokenRefreshResult> | null = null;

async function performTokenRefresh(encryptedRefreshToken: string): Promise<TokenRefreshResult> {
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const refreshToken = await decryptToken(encryptedRefreshToken);
      if (!refreshToken) return { success: false };

      const refreshUrl = `${process.env.BASE_URL}api/v1/auth/web/token/refresh/`;
      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });

      const data = (await response.json()) as { data?: { access_token?: string } };
      if (!response.ok || !data?.data?.access_token) return { success: false };

      const encryptedAccessToken = await encryptToken(data.data.access_token);
      return { success: true, encryptedAccessToken };
    } catch {
      return { success: false };
    }
  })().finally(() => {
    refreshInProgress = null;
  });

  return refreshInProgress;
}

function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): void {
  try {
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
  } catch {
    // Read-only context in server components.
  }
}

export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get("access_token");

  if (!forceRefresh && accessTokenCookie?.value) {
    try {
      const decryptedToken = await decryptToken(accessTokenCookie.value);
      if (decryptedToken) return { Authorization: `Bearer ${decryptedToken}` };
    } catch {
      // fallback to refresh
    }
  }

  const refreshTokenCookie = cookieStore.get("refresh_token");
  if (!refreshTokenCookie?.value) {
    clearAuthCookies(cookieStore);
    throw createSessionExpiredError();
  }

  const refreshed = await performTokenRefresh(refreshTokenCookie.value);
  if (!refreshed.success || !refreshed.encryptedAccessToken) {
    clearAuthCookies(cookieStore);
    throw createSessionExpiredError();
  }

  try {
    cookieStore.set("access_token", refreshed.encryptedAccessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  } catch {
    // Read-only context in server components. We still return a valid bearer token.
  }

  const decryptedAccessToken = await decryptToken(refreshed.encryptedAccessToken);
  if (!decryptedAccessToken) {
    clearAuthCookies(cookieStore);
    throw createSessionExpiredError();
  }

  return { Authorization: `Bearer ${decryptedAccessToken}` };
}
