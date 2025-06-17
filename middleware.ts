import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if user is accessing protected routes
  const protectedPaths = ["/dashboard", "/profile", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    // Check if user has auth token in cookies or headers
    const authCookie = request.cookies.get("auth-token")
    const userCookie = request.cookies.get("user-data")

    // If no auth data, redirect to login
    if (!authCookie && !userCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role-based access for admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie.value))
          if (userData.role !== "admin") {
            // Redirect non-admin users to dashboard
            return NextResponse.redirect(new URL("/dashboard", request.url))
          }
        } catch (error) {
          // Invalid user data, redirect to login
          const loginUrl = new URL("/login", request.url)
          return NextResponse.redirect(loginUrl)
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
}
