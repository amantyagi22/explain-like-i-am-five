import { createGoogle } from "@ai-sdk/google";

// The one place the model is chosen. GEMINI_API_KEY is server-only (no NEXT_PUBLIC_ prefix), so it never reaches the page.
// ponytail: gemini-3.5-flash-lite (2.5-flash-lite now 404s "no longer available to new users", checked 2026-10-10).
// Free-tier rate limits are per project and only shown in AI Studio, so they are not recorded here yet (ticket 04);
// re-check the model ID and its free-tier limits in AI Studio at deploy time, they change without notice.
// Paid swap: `import { anthropic } from "@ai-sdk/anthropic"; export const model = anthropic("claude-haiku-5-5");`
export const model = createGoogle({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.5-flash-lite");
