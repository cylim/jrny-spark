// Clerk → Convex JWT verification.
// CLERK_JWT_ISSUER_DOMAIN is set in the Convex dashboard (Deployment
// Settings → Environment Variables), not in local .env — Convex functions
// run on Convex's servers. Value = the Clerk Frontend API URL, e.g.
//   dev:  https://verb-noun-00.clerk.accounts.dev
//   prod: https://clerk.jrny.app
// `applicationID: "convex"` is a fixed Convex-side identifier — it is NOT
// the Clerk application id.
export default {
  providers: process.env.CLERK_JWT_ISSUER_DOMAIN
    ? [
        {
          domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
          applicationID: "convex",
        },
      ]
    : [],
};
