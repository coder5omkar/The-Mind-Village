import { NextResponse, type NextRequest } from "next/server";

// The village is open to visitors. Everyone who enters /app gets a lightweight
// "guest pass" cookie that identifies an anonymous user row in the database.
// Signing in with Google later transfers that progress to the real account.

export const GUEST_COOKIE = "village_guest";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  const guestId = existing ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  if (!existing) {
    const cookieHeader = requestHeaders.get("cookie");
    requestHeaders.set(
      "cookie",
      `${cookieHeader ? `${cookieHeader}; ` : ""}${GUEST_COOKIE}=${guestId}`
    );
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!existing) {
    response.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
