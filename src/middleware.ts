import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret-jwt-key-lucky-wheel-12345";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin panel routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });

      if (payload.role !== "admin") {
        // Logged-in but not an admin, redirect to home
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    } catch (e) {
      // Invalid token, delete session and redirect
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

// Apply middleware to all routes inside /admin
export const config = {
  matcher: ["/admin/:path*"],
};
