"use client";

import { LEVELS, type Level } from "@/lib/levels";

// Picks how deep the answer goes. Sits above the shutter, the way a phone camera puts its mode strip there.
export function LevelSwitch({ level, onChange }: { level: Level; onChange: (level: Level) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Explain level"
      className="mx-auto flex w-fit rounded-full border border-white/10 bg-zinc-950/50 p-1 backdrop-blur-md"
    >
      {LEVELS.map(({ id, label }) => (
        <button
          key={id}
          role="radio"
          aria-checked={id === level}
          onClick={() => id !== level && onChange(id)}
          className={`h-9 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
            id === level ? "bg-white text-zinc-950" : "text-zinc-300 active:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
