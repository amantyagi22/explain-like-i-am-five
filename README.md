# ELI5 Camera

Point your phone at anything and get it explained like you're five.

ELI5 Camera is a mobile web app that opens straight into your rear camera.
Tap the shutter, the frame freezes, and a short, plain-language explanation streams in word by word.
Every answer starts with an emoji and the name of the thing, then explains it in 2-4 simple sentences with one comparison a child would get.

It runs on Gemini's free tier and Vercel's free Hobby plan, so it costs nothing to run.

## Screenshots

| Point at something | Thinking | Streaming in | Done |
| :---: | :---: | :---: | :---: |
| ![Live camera preview with a large shutter button](docs/screenshots/live.jpg) | ![Frozen photo with a skeleton loader in the answer sheet](docs/screenshots/waiting.jpg) | ![The answer streaming into the sheet word by word](docs/screenshots/partial.jpg) | ![The finished explanation over the frozen photo](docs/screenshots/done.jpg) |

| Camera blocked | Something went wrong | Out of free explanations |
| :---: | :---: | :---: |
| ![Camera is off message with an Upload a photo instead button](docs/screenshots/denied.jpg) | ![Tap to try again message](docs/screenshots/error.jpg) | ![All out of explanations message](docs/screenshots/quota.jpg) |

Screenshots are taken at iPhone 15 Pro size with a sample photo and sample answers, so they look the same every time.

## How it works

1. The app asks for the rear camera with `getUserMedia`.
   If the camera is blocked, missing, or the page is inside an in-app browser, it offers a photo upload instead.
2. The shutter freezes the exact video frame.
   The frame (or the uploaded photo) is shrunk to a max side of 1024px and encoded as JPEG, so uploads stay small on mobile data.
3. The client posts the image to `POST /api/explain`.
4. The route checks the upload, sends it to Gemini with the system prompt, and streams plain text back.
5. The answer sheet renders the text as it arrives, over the bottom of the frozen photo.
   Tap "Snap another" or the photo to go back to the live camera.

### The explain route

| Request | Response |
| --- | --- |
| One image in the `image` form field | `200`, streamed plain text |
| No file, or not a JPEG / PNG / WebP / HEIC | `400` |
| Image over 4 MB | `413` |
| Gemini free quota used up | `429`, shown as "I'm all out of explanations for now" |
| Any other model failure | `502` after one quiet retry, shown as "tap to try again" |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19
- [AI SDK](https://ai-sdk.dev) 7 with the Google provider, using `gemini-3.5-flash-lite`
- Tailwind CSS v4, Geist, and Phosphor icons
- Vitest for the route tests

## Run it locally

You need Node.js 22+, pnpm, and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
pnpm install
echo "GEMINI_API_KEY=your-key-here" > .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
On a laptop it uses your webcam, or the upload button if no camera is available.
`localhost` counts as a secure context, so the camera works there without HTTPS.

To try it on your phone, deploy a Vercel preview (below) and open its URL.
Phones need HTTPS for the camera, so a plain `http://192.168.x.x:3000` link from your laptop falls back to upload.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm test` | Route tests with a mock model (never calls Gemini) |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |

## Deploy to Vercel

```bash
vercel link
vercel env add GEMINI_API_KEY preview
vercel deploy
```

The key has no `NEXT_PUBLIC_` prefix, so it stays on the server and never reaches the page.

## Project layout

```
app/
  page.tsx                 the single screen
  eli5-camera.tsx          camera stream, shutter, freeze, upload fallback
  explanation-panel.tsx    sends the photo, streams the answer, error and quota states
  api/explain/
    route.ts               POST /api/explain
    explain.ts             validation, model call, status mapping
    prompt.ts              the ELI5 system prompt
    explain.test.ts        route tests with a mock model
lib/
  model.ts                 the one place the model is chosen
  prepare-image.ts         shrink any image to a 1024px JPEG
```

### Switching models

The model lives only in `lib/model.ts`.
To move to a paid model, change that one line, for example to Claude Haiku 5.5 through `@ai-sdk/anthropic`.
Add a passcode or a rate limit in the same change, because the route has no auth and a paid key can run up a bill.

## Privacy

Photos go to Google's free Gemini tier, and Google may use free-tier inputs to improve its models.
Don't snap anything you wouldn't want to share.
The app keeps no history and stores nothing.

## Future scope

Right now the app gives one short paragraph and stops.
The ideas below make each answer teach more, while keeping it at a five-year-old's level.

### Answers that teach more

- **Ask "why?" again.**
  Add a "Why?" button under each answer that goes one step deeper, the way a curious kid keeps asking.
  Each step stays at the same simple level, so you build understanding in small bites instead of one big paragraph.
- **Answer cards.**
  Switch from one paragraph to a small card with the name, what it is, what it's for, and one fun fact.
  Short labeled parts are easier to scan than a block of text, especially for early readers.
- **Show how big it is.**
  Compare the size to things a child knows, like "as long as your arm" or "as heavy as a cat", with a small picture next to it.
- **"Is it safe?" note.**
  Add a clear, friendly warning for things that are hot, sharp, poisonous, or not to be touched.
- **Tap a word to explain it.**
  When a harder word slips in, make it tappable to get a one-line explanation of just that word.

### Easier for young children

- **Read it aloud.**
  Many five-year-olds can't read yet, so a speaker button (and an auto-play option) would let them use the app on their own.
- **Point at the thing.**
  Draw a soft outline around the object being explained, so it's clear which part of the photo the answer is about.
- **Tap to choose.**
  When a photo has several things in it, let the child tap the one they're curious about.
- **Guess first.**
  Before revealing the answer, ask "What do you think it is?" to turn each snap into a small game.
- **Pick a level.**
  A simple switch between "I'm 5", "I'm 10", and "grown-up" changes how deep the answer goes, so the app grows with the child.

### Remembering and sharing

- **Sticker book.**
  Save each snap as a sticker with its emoji and name, so children can look back at everything they discovered.
- **Daily discovery.**
  Suggest one thing to go find each day ("find something that floats"), to get kids exploring away from the screen.
- **Share with family.**
  Send a snap and its explanation to a parent or grandparent as a picture card.

### Making it ready for real kids

- **Kids mode with parent controls.**
  Today the prompt is written for adults using an ELI5 style.
  A real kids mode needs a stricter prompt, content filters, and a parent setting to turn it on.
- **More languages.**
  Let families choose the language of the answer, so children can learn in the language they speak at home.
- **Works offline for common things.**
  Cache answers for everyday objects so the app still works on a weak connection.
- **Rate limit and passcode.**
  Required before switching to a paid model, as noted in `app/api/explain/route.ts`.
