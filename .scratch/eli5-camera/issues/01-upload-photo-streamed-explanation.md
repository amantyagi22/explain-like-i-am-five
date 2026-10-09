# 01 - Upload a photo, get a streamed ELI5 explanation

**What to build:** the tracer bullet through every layer, running at localhost.
I choose a photo from disk, it appears frozen on screen, and an ELI5 explanation streams word by word into a panel at the bottom.
The client shrinks the photo to a max side of 1024px as JPEG before sending it, so normal phone photos stay well under the server's size cap.
The server has one explain route that takes multipart form data with one image, builds the prompt, calls Gemini on the free tier through the Vercel AI SDK, and streams plain text back.
The model instance lives in a single module, and the route's core takes the model as a parameter (defaulting to that module) so tests can inject a mock.
The system prompt lives as a constant next to the route and encodes all the prompt rules in `.scratch/eli5-camera/spec.md`: start with one emoji, then name the thing, use 2-4 short sentences in simple words with one everyday comparison, describe people generically and never identify anyone, say so in a friendly way when the image is blurry, dark, or unclear, and always answer in English.
Set up Vitest as the test runner.
See `.scratch/eli5-camera/spec.md` for the full spec.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

- [ ] Next.js (App Router) app runs at localhost with the Gemini API key read from a server-only env var
- [ ] Picking an image shows it frozen with the explanation streaming into a bottom panel
- [ ] Uploaded images are downscaled client-side to max 1024px JPEG before sending
- [ ] The model is defined in exactly one module, so switching providers is a one-line change
- [ ] System prompt covers every prompt rule in the spec
- [ ] Vitest test: a valid image returns 200 and streams the mock model's text through unchanged
- [ ] Vitest test: the model receives the system prompt and the uploaded image
- [ ] No test calls the real Gemini API
- [ ] Hand-checked on several real photos (an object, a blurry shot, a person) that the output follows the prompt rules
