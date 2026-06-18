import { type TeeTime } from "@/lib/supabase/client";

export type Entry = { key: string; label: string; sublabel?: string; owners: string[] };

export function getEntries(teeTime: TeeTime): Entry[] {
  if (teeTime.format === "scramble" && teeTime.teams.length > 0) {
    return teeTime.teams.map((t) => ({
      key: t.name,
      label: t.name,
      sublabel: t.players.join(" & "),
      owners: t.players,
    }));
  }
  return teeTime.players.map((p) => ({ key: p, label: p, owners: [p] }));
}
