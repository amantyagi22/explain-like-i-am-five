// How deep an answer goes. Shared by the switch on the page and the explain route, so both agree on the ids.
export const LEVELS = [
  { id: "5", label: "Like I'm 5" },
  { id: "15", label: "Like I'm 15" },
  { id: "expert", label: "Expert" },
] as const;

export type Level = (typeof LEVELS)[number]["id"];

export const DEFAULT_LEVEL: Level = "5";

export function isLevel(value: unknown): value is Level {
  return LEVELS.some((level) => level.id === value);
}
