import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";
import { refreshTokenAction } from "@/lib/auth";
import { getAccessToken } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Quote ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const encryptedToken = cookieStore.get?.("access_token")?.value;
    if (!encryptedToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = await decryptToken(encryptedToken);
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: "BASE_URL environment variable is not set" },
        { status: 500 }
      );
    }

    const upstream = await fetch(
      `${baseUrl}/api/v1/auth/web/core/quote-header/${encodeURIComponent(id)}/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) {
        console.log("🔄 Server-side API call failed with 401/403, attempting token refresh...");
        // Attempt to refresh tokens server-side
        const refreshResult = await refreshTokenAction();
        if (refreshResult.success) {
          console.log("✅ Server-side token refresh successful, retrying request...");
          const refreshedAccessToken = await getAccessToken();
          if (refreshedAccessToken) {
            const retry = await fetch(
              `${baseUrl}/api/v1/auth/web/core/quote-header/${encodeURIComponent(id)}/`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${refreshedAccessToken}`,
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              }
            );

            const retryData = await retry.json();
            if (retry.ok) {
              console.log("✅ Server-side API retry successful after token refresh");
              return NextResponse.json(retryData);
            } else {
              console.log("❌ Server-side API retry failed after token refresh:", retry.status);
            }

            // If retry also fails with auth, fall through and return auth error
            return NextResponse.json(
              {
                success: false,
                message: retryData?.message || "Authentication failed",
                errors: { authError: true, status: retry.status },
              },
              { status: retry.status }
            );
          }
        }

        // Refresh failed or no token available
        return NextResponse.json(
          {
            success: false,
            message: data?.message || "Authentication failed",
            errors: { authError: true, status: upstream.status },
          },
          { status: upstream.status }
        );
      }

      return NextResponse.json(
        { success: false, message: data?.message || "Request failed", errors: data?.errors },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Quote header proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


