import { NextRequest, NextResponse } from "next/server";
import { decryptToken } from "@/lib/decrypt";

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false; // Not a JWT, assume valid
    
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    if (!payload || typeof payload.exp !== "number") return false;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return false; // If can't parse, assume valid
  }
}

/**
 * Check if access token is valid (exists and not expired)
 */
async function hasValidAccessToken(request: NextRequest): Promise<boolean> {
  const accessToken = request.cookies.get("access_token")?.value;
  
  if (!accessToken) return false;
  
  try {
    // Decrypt the token
    const decryptedToken = await decryptToken(accessToken);
    if (!decryptedToken) return false;
    
    // Check if token is expired
    return !isTokenExpired(decryptedToken);
  } catch {
    return false;
  }
}

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/all-applications",
    "/announcements",
    "/docusign",
    "/export-contract",
    "/generate-quote",
    "/invoices",
    "/reports",
    "/submitted-sales",
    "/tickets",
    "/tpi-document",
    "/users",
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check if user has valid access token
    return hasValidAccessToken(request).then(hasValid => {
      if (!hasValid) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    });
  }

  // Redirect from login if already authenticated
  if (pathname === "/login") {
    return hasValidAccessToken(request).then(hasValid => {
      if (hasValid) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    });
  }

  return NextResponse.next();
}
