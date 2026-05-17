import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Retrieve the auth cookie
  const authToken = req.cookies.get("auth_token");

  // Define paths to protect
  const isAdminPath = pathname.startsWith("/admin");
  const isCatererPath = pathname.startsWith("/caterer");
  const isUserPath = pathname.startsWith("/user") || pathname.startsWith("/orders") || pathname.startsWith("/cart");

  if (isAdminPath || isCatererPath || isUserPath) {
    if (!authToken) {
      // User is not authenticated, redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      // Verify JWT token in Edge Runtime using Jose
      const { payload } = await jwtVerify(authToken.value, JWT_SECRET);
      const role = payload.role as string;

      // Role-Based Access Control (RBAC) Enforcement
      if (isAdminPath && role !== "ADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      if (isCatererPath && role !== "CATERER") {
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      if (isUserPath && !["USER", "ADMIN", "CATERER"].includes(role)) {
        // Anyone logged in can access standard user routes usually, but let's be strict if needed
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Invalid JWT token, redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      // Clear invalid token cookie on redirect
      const response = NextResponse.redirect(url);
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/caterer/:path*",
    "/user/:path*",
    "/orders/:path*",
    "/cart/:path*",
  ],
};
