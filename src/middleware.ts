import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/join/(.*)",
  "/demo(.*)",
  "/api/webhooks(.*)",
  "/api/demo(.*)",
  "/api/public-ticket(.*)",
  "/p/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect authenticated users away from landing/auth pages to the dashboard
  if (userId && (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    // Preserve ?join= so invited users with existing Clerk accounts land on onboarding
    const join = req.nextUrl.searchParams.get("join")
    if (join && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL(`/onboarding?join=${encodeURIComponent(join)}`, req.url))
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
