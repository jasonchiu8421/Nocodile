import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import path from "path";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("im in the terminal :3");

  // the rest kicks you back to login
  const publicRoutes = ["/login", "/register"];
  const isPublic =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("public/");

  if (isPublic) return NextResponse.next();

  const username = request.cookies.get("username");
  const userId = request.cookies.get("userId");

  if (!username || !userId) {
    return NextResponse.redirect(new URL("/login", request.url)); //no relative urls bruhhhh
  }

  // else continue
  return NextResponse.next();
}

/**
 * Matcher defines which routes the middleware runs on.
 * Only with this matcher allows css to be loaded. No idea why.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
