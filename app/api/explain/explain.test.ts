import { APICallError, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { explain } from "./explain";
import { systemPrompt } from "./prompt";

function mockModel(...deltas: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t" },
          ...deltas.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
          { type: "text-end", id: "t" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 1, text: 1, reasoning: undefined },
            },
          },
        ],
      }),
    }),
  });
}

function upload(file?: File, level?: string) {
  const body = new FormData();
  if (file) body.append("image", file);
  if (level !== undefined) body.append("level", level);
  return new Request("http://localhost/api/explain", { method: "POST", body });
}

const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3])], "snap.jpg", { type: "image/jpeg" });

describe("explain route", () => {
  it("streams the model's text back unchanged for a valid image", async () => {
    const res = await explain(upload(jpeg()), mockModel("🌵 A cactus. ", "It is a plant that drinks rarely."));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("🌵 A cactus. It is a plant that drinks rarely.");
  });

  it("sends the system prompt and the uploaded image to the model", async () => {
    const model = mockModel("ok");
    await (await explain(upload(jpeg()), model)).text();

    const prompt = model.doStreamCalls[0].prompt;
    expect(prompt).toContainEqual({ role: "system", content: systemPrompt("5") });
    expect(prompt).toContainEqual(
      expect.objectContaining({
        role: "user",
        content: [
          expect.objectContaining({
            type: "file",
            mediaType: "image/jpeg",
            data: expect.objectContaining({ type: "data", data: new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]) }),
          }),
        ],
      }),
    );
  });

  it("uses the prompt for the chosen level", async () => {
    const model = mockModel("ok");
    await (await explain(upload(jpeg(), "expert"), model)).text();

    expect(model.doStreamCalls[0].prompt).toContainEqual({ role: "system", content: systemPrompt("expert") });
    expect(systemPrompt("expert")).not.toBe(systemPrompt("5"));
  });

  it("rejects an unknown level with 400, without calling the model", async () => {
    const model = mockModel("never");
    const res = await explain(upload(jpeg(), "42"), model);

    expect(res.status).toBe(400);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it("rejects a request with no file with 400, without calling the model", async () => {
    const model = mockModel("never");
    const res = await explain(upload(), model);

    expect(res.status).toBe(400);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it("rejects a non-image upload with 400, without calling the model", async () => {
    const model = mockModel("never");
    const res = await explain(upload(new File(["hello"], "notes.txt", { type: "text/plain" })), model);

    expect(res.status).toBe(400);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it("rejects an image over 4 MB with 413, without calling the model", async () => {
    const model = mockModel("never");
    const huge = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" });
    const res = await explain(upload(huge), model);

    expect(res.status).toBe(413);
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it("returns 429 when the provider says the quota is exhausted", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new APICallError({ message: "quota", url: "", requestBodyValues: {}, statusCode: 429 });
      },
    });
    const res = await explain(upload(jpeg()), model);

    expect(res.status).toBe(429);
    expect(model.doStreamCalls).toHaveLength(1); // retrying a spent quota only burns more of it
  });

  it("returns a 5xx when the model fails for any other reason", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new APICallError({ message: "boom", url: "", requestBodyValues: {}, statusCode: 500 });
      },
    });
    const res = await explain(upload(jpeg()), model);

    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it("retries a temporary model failure once, then streams the answer", async () => {
    const working = mockModel("🌉 A bridge.");
    let calls = 0;
    const model = new MockLanguageModelV4({
      doStream: async (options) => {
        if (calls++ === 0) {
          throw new APICallError({ message: "high demand", url: "", requestBodyValues: {}, statusCode: 503 });
        }
        return working.doStream(options);
      },
    });
    const res = await explain(upload(jpeg()), model);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("🌉 A bridge.");
  });
});
