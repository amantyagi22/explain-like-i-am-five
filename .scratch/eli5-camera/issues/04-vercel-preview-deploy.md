# 04 - Vercel preview deploy and phone check

**What to build:** the app runs on a Vercel Hobby preview URL over HTTPS and works on my real phone.
The Gemini API key from Google AI Studio is stored as a server-only env var in Vercel.
The free-tier Gemini model ID and its current rate limits are checked against the docs at deploy time, not assumed.
This needs my Vercel and Google AI Studio accounts, so a human does it.

**Blocked by:** 01 - Upload a photo, get a streamed ELI5 explanation

**Status:** ready-for-human

- [ ] Vercel project created on the free Hobby plan and linked to this repo
- [ ] Gemini API key set as a server-only env var in Vercel (never sent to the client)
- [ ] Free-tier model ID and rate limits checked and noted in the model module
- [ ] Preview deployment loads over HTTPS from a shareable URL
- [ ] Upload-a-photo flow works end to end on a real phone via the preview URL
