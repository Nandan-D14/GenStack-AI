export default {
  providers: [
    {
      // Replace this domain with your actual Clerk Issuer URL (e.g. https://your-clerk-domain.clerk.accounts.dev)
      // You can find this in your Clerk Dashboard under JWT Templates -> Convex
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://complete-kangaroo-28.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
