# Spec: ELI5 Camera (v1)

Status: `ready-for-agent`

## Problem Statement

I constantly see things I don't fully understand: a strange gadget, a plant, a machine part, a sign, a dish at a restaurant.
Looking them up means guessing the right words to type into a search engine, then wading through jargon-heavy answers written for experts.
I want to point my phone at the thing and get a short, plain explanation, the way you would explain it to a five-year-old.
I also don't want to spend any money running it.

## Solution

A mobile web app that opens straight into the rear camera.
I aim at something, tap a shutter button, and the frame freezes.
A short explanation streams into a panel at the bottom of the screen, word by word.
It starts with an emoji and the name of the thing, then explains it in 2-4 simple sentences using one comparison a child would get.
I tap to go back to the live camera and snap the next thing.
If the camera isn't available, I can upload a photo instead and get the same experience.
It runs on Gemini's free tier and Vercel's free Hobby plan, so it costs nothing.
Switching to a paid model later is a one-line change.

## User Stories

1. As a curious adult, I want the app to open directly into a live rear-camera preview, so that I can start aiming without extra taps.
2. As a curious adult, I want a large, obvious shutter button, so that I can snap with one thumb while holding the phone.
3. As a curious adult, I want the preview to freeze on the exact frame I captured, so that I can see what the AI is explaining.
4. As a curious adult, I want the explanation to start appearing within a second or two, so that the app feels instant.
5. As a curious adult, I want the explanation to stream in word by word, so that I can start reading before it finishes.
6. As a curious adult, I want the explanation to begin with an emoji and the name of the thing, so that I immediately know what it identified.
7. As a curious adult, I want the explanation to be 2-4 short sentences, so that I can read it at a glance.
8. As a curious adult, I want the explanation to use simple words and one everyday comparison, so that I understand it without background knowledge.
9. As a curious adult, I want the explanation panel to sit over the bottom of the frozen photo, so that the photo and the answer are visible together.
10. As a curious adult, I want to tap "Snap another" or the photo to return to the live camera, so that I can keep exploring quickly.
11. As a curious adult, I want the app to tell me when a photo is too blurry or unclear, so that I'm not misled by a made-up guess.
12. As a curious adult, I want people in photos to be described generically, so that the app never guesses who someone is.
13. As a curious adult, I want to be asked for camera permission only when the app needs it, so that the permission prompt makes sense.
14. As a curious adult who denied camera permission, I want a clear message and an "Upload a photo instead" button, so that I can still use the app.
15. As a curious adult opening the link in an in-app browser that blocks the camera, I want the upload fallback, so that the app still works.
16. As a curious adult on a laptop without a rear camera, I want the upload fallback, so that I can try the app with saved photos.
17. As a curious adult using the upload fallback, I want the chosen photo to appear frozen with the same streaming panel, so that the experience matches the camera flow.
18. As a curious adult on mobile data, I want photos to be shrunk before upload, so that answers arrive fast and use little data.
19. As a curious adult, I want a friendly "I'm all out of explanations for now, try again later" message when the free quota runs out, so that I understand it's temporary.
20. As a curious adult, I want a "Something went wrong, tap to try again" message on other failures, so that I can recover.
21. As a curious adult retrying after an error, I want the retry to re-send the same frame, so that I don't have to re-aim.
22. As a curious adult, I want the shutter disabled while an explanation is streaming, so that I don't fire overlapping requests by accident.
23. As a curious adult, I want the app to load over HTTPS from a simple URL, so that I can share it and the camera works.
24. As a curious adult, I want the app to look polished and intentional on a phone screen, so that it feels like a real product.
25. As a curious adult, I want the UI to respect safe areas such as the notch and home indicator, so that controls are never hidden.
26. As the owner, I want the Gemini API key to stay on the server, so that nobody can extract it from the page.
27. As the owner, I want the server to reject non-image uploads, so that the endpoint can't be used for anything else.
28. As the owner, I want the server to reject images over about 4 MB, so that oversized requests fail fast and clearly.
29. As the owner, I want the whole app to run on free tiers, so that it never costs me money.
30. As the owner, I want the model choice to live in one place, so that switching to a paid model is a one-line change.
31. As the owner, I want a visible note in the code reminding me to add a passcode or rate limit before switching to a paid model, so that I don't get surprised by a bill.
32. As the owner developing the app, I want to iterate on the prompt on my laptop at localhost, so that the feedback loop is fast.
33. As the owner, I want to test on my phone through Vercel preview deployments, so that I test the same environment that ships.
34. As the owner, I want automated tests that never call the real Gemini API, so that tests are fast, free, and deterministic.

## Implementation Decisions

- **Platform:** a mobile-first web app in the phone browser, with no native app and no install step.
- **Framework and hosting:** Next.js (App Router) deployed on Vercel's free Hobby plan, which provides HTTPS automatically.
- **AI integration:** the Vercel AI SDK with the Google provider, using a Gemini model on the free tier.
  The exact free-tier model ID and its current rate limits are to be verified at build time, not assumed.
- **Model in one place:** a single module exports the model instance.
  Switching providers (for example to Claude Haiku 5.5 through the Anthropic provider) changes only that line plus the provider dependency and env var.
- **Modules:**
  - **Camera capture (client):** owns the camera stream, frame capture, freeze/unfreeze, and the upload fallback.
    Its output is always one image blob, whether it came from the camera or a file, so everything downstream is identical.
  - **Image preparation (client):** shrinks any captured or uploaded image to a max side of 1024px and encodes it as JPEG.
  - **Explanation panel (client):** sends the prepared image, renders streamed text, and shows the quota, error, and retry states.
  - **Explain route (server):** the single API endpoint.
    It validates the upload, builds the prompt, calls the model, and streams plain text back.
  - **Prompt:** the system prompt lives as a constant next to the route.
- **Explain route contract:**
  - Request: POST with multipart form data containing one image file.
  - Non-image upload: responds 400.
  - Image over about 4 MB: responds 413.
  - Upstream quota exhaustion (429 from the provider): responds 429, which the client maps to the friendly "out of explanations" message.
  - Other upstream failures: respond 5xx, which the client maps to the retry message.
  - Success: a streamed plain-text body.
- **Model is injectable:** the route's core takes the model as a parameter, defaulting to the shared model module, so tests can pass a mock model.
- **Prompt rules:**
  - Audience is adults; ELI5 is a style, not a child-safety mode.
  - Start with one emoji, then name the thing.
  - Use 2-4 short sentences in simple words, with one everyday comparison.
  - Describe people generically and never identify or guess who someone is.
  - If the image is blurry, dark, or unclear, say so in a friendly way instead of guessing.
  - Always answer in English.
- **Output format:** plain streamed text, not structured JSON, to keep the free model reliable and the UI simple.
- **Camera:** `getUserMedia` with the rear-facing camera preferred.
  The shutter grabs the current video frame onto a canvas.
  Camera failure (permission denied, no device, unsupported in-app browser) falls back to a native file input that accepts images.
- **Screen flow:** a single screen with no routing.
  The states are live preview, frozen with streaming, frozen with complete, and frozen with error.
  Tapping "Snap another" or the photo returns to live preview.
  The shutter is disabled while a request is in flight.
- **Security posture:** no auth in v1.
  On a free-tier key with no billing, abuse can only exhaust the quota, not cost money.
  The route carries a `ponytail:` comment stating that a passcode or a Vercel Firewall rate limit must be added in the same change that moves to a paid model.
- **Secrets:** the Gemini API key comes from Google AI Studio and is stored as a server-only env var locally and in Vercel.
- **UI design:** built using the `design-taste-frontend` (v2) skill, mobile-first, respecting safe-area insets.
- **Dev loop:** develop at localhost on the laptop (the webcam or the upload fallback both work there because localhost is a secure context).
  Test on the phone through `vercel deploy` preview URLs.
  Add a `cloudflared` tunnel only if preview redeploys become tedious.

## Testing Decisions

- **One seam: the explain route.**
  Tests call the route handler directly with constructed requests and a mock model from the AI SDK's test utilities.
  No test ever calls the real Gemini API.
- **What a good test looks like:** it asserts only on external behavior, meaning the HTTP status and the streamed body, plus what was sent to the model (that an image part and the system prompt were included).
  It does not assert on internal helpers or call order.
- **Cases covered:**
  - A valid image returns 200 and streams the mock model's text through unchanged.
  - A non-image upload returns 400 and never calls the model.
  - An image over the size cap returns 413 and never calls the model.
  - A request with no file returns 400.
  - A mock model that raises a provider 429 makes the route return 429.
  - A mock model that raises any other error makes the route return a 5xx.
  - The model receives the system prompt and the uploaded image.
- **Not automated in v1:** the camera, the frame freeze, image downscaling, and panel rendering.
  These are verified by hand on a real phone through Vercel preview deployments, with a close eye on visual polish.
- **Prior art:** none; this is a new project with no existing tests.
  Use the test runner that fits the Next.js setup with the least configuration (Vitest).

## Out of Scope

- Follow-up questions or chat about the same photo.
- Continuous live mode that explains frames automatically.
- Structured or card-style output (name, emoji, fun fact fields).
- Child-safety mode for real young children as the audience.
- Languages other than English.
- Authentication, passcodes, and rate limiting (required before any move to a paid model).
- History, saving, or sharing explanations.
- Text-to-speech reading the explanation aloud.
- Native iOS or Android apps, and PWA install or offline support.
- Browser end-to-end tests with a fake camera device.

## Further Notes

- The original idea is in `PROMBLEM.md`.
  It lists the learning goals: vision models, streaming AI responses, and prompt engineering.
- Free-tier caveat: Google may use free-tier inputs to improve its models, so photos sent through the app are not private in that sense.
  This was knowingly accepted in exchange for spending nothing.
- The cost math behind keeping a paid option open: Claude Haiku 5.5 is roughly $0.0003 per snap, and Claude Opus 5.5 is roughly $0.01 per snap.
- This folder is not a git repo and has no issue tracker yet, so this spec lives here as a local file instead of a `ready-for-agent` issue.
