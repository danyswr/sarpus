import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public pages and API routes
  if (pathname.startsWith("/login") || 
      pathname.startsWith("/register") ||
      pathname === "/" ||
      pathname.startsWith("/about") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.includes(".")) {
    return NextResponse.next()
  }

  // Check if user is accessing protected routes
  const protectedPaths = ["/dashboard", "/profile", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    // Check if user has auth token in cookies
    const authCookie = request.cookies.get("auth-token")
    const userCookie = request.cookies.get("user-data")

    // If no auth data, redirect to login
    if (!authCookie || !userCookie) {
      console.log("No auth cookies found, redirecting to login")
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const userData = JSON.parse(decodeURIComponent(userCookie.value))
      console.log("Middleware - User data:", userData)
      console.log("Middleware - Current path:", pathname)
      console.log("Middleware - User role:", userData.role)
      
      // Only check role-based access for admin routes
      if (pathname.startsWith("/admin")) {
        if (userData.role?.toLowerCase() !== "admin") {
          console.log("Non-admin user trying to access admin page, redirecting to dashboard")
          return NextResponse.redirect(new URL("/dashboard", request.url))
        } else {
          console.log("Admin user accessing admin page - allowing access")
        }
      } else {
        console.log("User accessing non-admin page - allowing access")
      }
      
    } catch (error) {
      console.error("Error parsing user data in middleware:", error)
      // Invalid user data, redirect to login
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
}
