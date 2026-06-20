import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Exclude Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
