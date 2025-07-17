import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const hasVisited = request.cookies.get("hasVisited")?.value;

  // 🔁 First-time visit redirect to /getting-started
  if (!hasVisited && pathname === "/") {
    const response = NextResponse.redirect(new URL("/getting-started", request.url));
    response.cookies.set("hasVisited", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  }

  // ✅ Allow public and static routes
  const publicRoutes = ["/auth/login", "/auth/register", "/api/auth", "/getting-started"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 🔒 Block non-authenticated users
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Verify token
  try {
    const verifyResponse = await fetch("http://localhost:8080/api/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
      credentials: "include",
    });

    if (!verifyResponse.ok) {
      throw new Error("Token verification failed");
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Verification error:", error);
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set({
      name: "token",
      value: "",
      path: "/",
      domain: process.env.NODE_ENV === "development" ? "localhost" : undefined,
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
