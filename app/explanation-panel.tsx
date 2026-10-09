"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Explanation =
  | { status: "waiting" }
  | { status: "streaming" | "done"; text: string }
  | { status: "quota" | "error" };

// Sends the prepared photo to the explain route and streams the answer into a sheet over the bottom of the photo.
// Mount it with a key per photo so each new photo starts fresh.
export function ExplanationPanel({ photo, onClose, closeLabel }: { photo: Blob; onClose: () => void; closeLabel: string }) {
  const [explanation, setExplanation] = useState<Explanation>({ status: "waiting" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      const body = new FormData();
      body.append("image", photo, "photo.jpg");
      const res = await fetch("/api/explain", { method: "POST", body, signal: abort.signal });
      if (!res.ok || !res.body) return setExplanation({ status: res.status === 429 ? "quota" : "error" });

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let text = "";
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        text += chunk.value;
        setExplanation({ status: "streaming", text });
      }
      setExplanation(text.trim() ? { status: "done", text } : { status: "error" });
    })().catch(() => {
      if (!abort.signal.aborted) setExplanation({ status: "error" });
    });
    return () => abort.abort();
  }, [photo, attempt]);

  function retry() {
    setExplanation({ status: "waiting" });
    setAttempt((n) => n + 1);
  }

  return (
    <section
      aria-label="Explanation"
      aria-busy={explanation.status === "waiting" || explanation.status === "streaming"}
      className="sheet-in absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-white/10 bg-zinc-950/80 px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-24px_60px_rgb(9_9_11/0.5)] backdrop-blur-xl"
    >
      <div className="max-h-[52dvh] overflow-y-auto overscroll-contain">
        {explanation.status === "waiting" && (
          <div className="shimmer space-y-3 py-1" aria-label="Thinking">
            <div className="h-5 w-2/5 rounded-full bg-white/15" />
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-11/12 rounded-full bg-white/10" />
            <div className="h-4 w-3/5 rounded-full bg-white/10" />
          </div>
        )}
        {(explanation.status === "streaming" || explanation.status === "done") && (
          <p className="max-w-[60ch] text-lg leading-relaxed text-pretty whitespace-pre-wrap text-zinc-50">
            {explanation.text}
          </p>
        )}
        {explanation.status === "quota" && (
          <p className="text-lg leading-relaxed text-zinc-50">I&apos;m all out of explanations for now, try again later.</p>
        )}
        {explanation.status === "error" && (
          <button
            onClick={retry}
            className="flex w-full items-center gap-3 rounded-2xl py-1 text-left text-lg leading-relaxed text-zinc-50 active:scale-[0.98]"
          >
            <ArrowClockwise size={22} weight="bold" className="shrink-0 text-accent" />
            Something went wrong, tap to try again
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="mt-5 h-14 w-full rounded-full bg-accent text-base font-semibold text-zinc-950 transition-transform active:scale-[0.98]"
      >
        {closeLabel}
      </button>
    </section>
  );
}
