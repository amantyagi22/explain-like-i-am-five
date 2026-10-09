# 02 - Route checks and friendly failure messages

**What to build:** the explain route rejects bad input before calling the model, and the UI turns every failure into a clear message I can recover from.
A request with no file or a non-image file gets 400, and an image over about 4 MB gets 413, both without calling the model.
When the provider returns a quota error (429), the route responds 429 and the panel shows "I'm all out of explanations for now, try again later".
Any other upstream failure makes the route respond with a 5xx, and the panel shows "Something went wrong, tap to try again".
Tapping retry re-sends the same frame, so I don't have to re-take the photo.
The route carries a `ponytail:` comment saying a passcode or Vercel Firewall rate limit must ship in the same change that moves to a paid model.

**Blocked by:** 01 - Upload a photo, get a streamed ELI5 explanation

**Status:** ready-for-agent

- [ ] Vitest: a request with no file returns 400 and never calls the model
- [ ] Vitest: a non-image upload returns 400 and never calls the model
- [ ] Vitest: an image over the size cap returns 413 and never calls the model
- [ ] Vitest: a mock model raising a provider 429 makes the route return 429
- [ ] Vitest: a mock model raising any other error makes the route return a 5xx
- [ ] Panel shows the friendly quota message on 429 and the retry message on other failures
- [ ] Retry re-sends the same prepared image
- [ ] `ponytail:` comment about adding a passcode or rate limit before switching to a paid model is present on the route
