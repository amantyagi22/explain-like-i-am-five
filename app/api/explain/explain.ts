import { streamText, type LanguageModel } from "ai";
import { model as defaultModel } from "@/lib/model";
import { DEFAULT_LEVEL, isLevel } from "@/lib/levels";
import { systemPrompt } from "./prompt";

// Under Vercel's 4.5 MB function body limit. The client downscales to 1024px JPEG, far below this.
const MAX_BYTES = 4 * 1024 * 1024;
// What Gemini accepts; anything else (SVG, GIF, a mislabelled text file's "image/x-foo") is a 400, not a 502.
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function explain(req: Request, model: LanguageModel = defaultModel): Promise<Response> {
  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || !IMAGE_TYPES.has(image.type))
    return new Response("Send one image file in the 'image' field.", { status: 400 });
  const level = form?.get("level") ?? DEFAULT_LEVEL; // optional, so older clients still get the ELI5 answer
  if (!isLevel(level)) return new Response("Unknown level.", { status: 400 });
  if (image.size > MAX_BYTES) return new Response("Image is over 4 MB.", { status: 413 });

  const data = new Uint8Array(await image.arrayBuffer());
  const start = () =>
    textOf(
      streamText({
        model,
        system: systemPrompt(level),
        messages: [{ role: "user", content: [{ type: "file", mediaType: image.type, data }] }],
        abortSignal: req.signal, // stop spending quota when the user leaves mid-answer
        maxRetries: 0, // retries are handled below so a quota 429 fails fast instead of backing off
      }).fullStream,
    );

  // Wait for the first chunk so upstream failures become real HTTP statuses instead of a broken 200 stream.
  let chunks = start();
  let first: IteratorResult<string>;
  for (let attempt = 1; ; attempt++) {
    try {
      first = await chunks.next();
      break;
    } catch (error) {
      const status = statusOf(error);
      // One quiet retry rides out free-tier "high demand" 5xx spikes; after that the client offers "tap to try again".
      if (attempt === 1 && status !== undefined && status >= 500) {
        chunks = start();
        continue;
      }
      return status === 429
        ? new Response("Out of free explanations.", { status: 429 })
        : new Response("The model call failed.", { status: 502 });
    }
  }

  const rest = (async function* () {
    if (!first.done) yield first.value;
    yield* chunks;
  })();
  const body = new ReadableStream<string>({
    async pull(controller) {
      const next = await rest.next();
      if (next.done) controller.close();
      else controller.enqueue(next.value);
    },
    cancel: () => void rest.return(undefined),
  });
  return new Response(body.pipeThrough(new TextEncoderStream()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// textStream swallows provider errors (they only reach onError), so read fullStream and rethrow them.
async function* textOf(parts: AsyncIterable<{ type: string; text?: string; error?: unknown }>) {
  for await (const part of parts) {
    if (part.type === "error") throw part.error;
    if (part.type === "text-delta" && part.text) yield part.text;
  }
}

function statusOf(error: unknown): number | undefined {
  return (error as { statusCode?: number } | undefined)?.statusCode;
}
