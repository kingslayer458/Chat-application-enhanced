import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Skip middleware for API routes
  if (path.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path.startsWith("/join/")

  // We can't access localStorage in middleware, so we'll skip auth check for join pages
  // This allows users to access the join page without being logged in
  if (path.startsWith("/join/")) {
    return NextResponse.next()
  }

  // For other paths, check if the user is authenticated
  // Note: We can't access localStorage directly in middleware
  const isAuthenticated = request.cookies.has("chat-username")

  // If the path requires authentication and the user is not authenticated, redirect to the home page
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the user is authenticated and trying to access the home page, redirect to the chat page
  if (isPublicPath && isAuthenticated && path === "/") {
    return NextResponse.redirect(new URL("/chat/general", request.url))
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/", "/chat/:path*", "/join/:path*"],
}
