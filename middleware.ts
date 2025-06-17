import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Skip middleware for public pages
  if (request.nextUrl.pathname.startsWith("/login") || 
      request.nextUrl.pathname.startsWith("/register") ||
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/about")) {
    return NextResponse.next()
  }

  // Check if user is accessing protected routes
  const protectedPaths = ["/dashboard", "/profile", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    // Check if user has auth token in cookies
    const authCookie = request.cookies.get("auth-token")
    const userCookie = request.cookies.get("user-data")

    // If no auth data, redirect to login
    if (!authCookie || !userCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const userData = JSON.parse(decodeURIComponent(userCookie.value))
      
      // Check role-based access for admin routes
      if (request.nextUrl.pathname.startsWith("/admin")) {
        if (userData.role?.toLowerCase() !== "admin") {
          // Redirect non-admin users to dashboard
          console.log("Non-admin user trying to access admin page, redirecting to dashboard")
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      }
      
      // Redirect admin users trying to access regular dashboard to admin page
      if (request.nextUrl.pathname.startsWith("/dashboard") && userData.role?.toLowerCase() === "admin") {
        console.log("Admin user accessing dashboard, redirecting to admin page")
        return NextResponse.redirect(new URL("/admin", request.url))
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
