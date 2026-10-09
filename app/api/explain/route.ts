import { explain } from "./explain";

// ponytail: no auth or rate limit. On a free-tier Gemini key with no billing, abuse can only burn the quota, not money.
// A passcode or a Vercel Firewall rate limit MUST ship in the same change that moves lib/model.ts to a paid model.
// Wrapped, not re-exported: Next passes (request, context), and context must not land in explain's model parameter.
export const POST = (req: Request) => explain(req);
