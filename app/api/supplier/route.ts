import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptToken } from "@/lib/decrypt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const encryptedToken = cookieStore.get("access_token")?.value;

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

    const res = await fetch(`${baseUrl}/api/v1/auth/web/core/supplier/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      // Avoid Next.js fetch caching for fresh data
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      // Map auth errors clearly so client can react
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { success: false, message: data?.message || "Authentication failed", errors: { authError: true, status: res.status } },
          { status: res.status }
        );
      }
      return NextResponse.json(
        { success: false, message: data?.message || "Request failed", errors: data?.errors },
        { status: res.status }
      );
    }

    // Return the raw API shape to the client
    return NextResponse.json(data);
  } catch (error) {
    console.error("Supplier proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


