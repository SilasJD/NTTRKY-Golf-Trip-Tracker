import { type Course } from "@/lib/courses";
import { type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { type Entry, getEntries } from "@/lib/entries";

export type ScoreMap = Record<string, Record<number, number | null>>;

export function toScoreMap(rows: ScoreRow[]): ScoreMap {
  const map: ScoreMap = {};
  for (const row of rows) {
    map[row.player_name] ??= {};
    map[row.player_name][row.hole_number] = row.strokes;
  }
  return map;
}

export type HoleSkinResult = {
  hole: number;
  winnerKey: string | null;
  skinsAwarded: number;
};

export type SkinsResult = {
  holeResults: HoleSkinResult[];
  skinsByEntry: Record<string, number>;
  carry: number;
};

export function computeRoundSkins(teeTime: TeeTime, course: Course, scores: ScoreMap): SkinsResult {
  const entries = getEntries(teeTime);
  const holeResults: HoleSkinResult[] = [];
  const skinsByEntry: Record<string, number> = {};
  let carry = 0;

  for (const hole of course.holes) {
    const holeScores = entries.map((entry) => ({
      key: entry.key,
      score: scores[entry.key]?.[hole.number] ?? null,
    }));
    if (holeScores.some((h) => h.score == null)) break;

    const minScore = Math.min(...holeScores.map((h) => h.score as number));
    const lowest = holeScores.filter((h) => h.score === minScore);

    if (lowest.length === 1) {
      const skinsAwarded = 1 + carry;
      const winnerKey = lowest[0].key;
      skinsByEntry[winnerKey] = (skinsByEntry[winnerKey] ?? 0) + skinsAwarded;
      holeResults.push({ hole: hole.number, winnerKey, skinsAwarded });
      carry = 0;
    } else {
      carry += 1;
      holeResults.push({ hole: hole.number, winnerKey: null, skinsAwarded: 0 });
    }
  }

  return { holeResults, skinsByEntry, carry };
}

export function aggregateSkinsByPlayer(
  rounds: { teeTime: TeeTime; skins: SkinsResult }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const { teeTime, skins } of rounds) {
    const entries = getEntries(teeTime);
    const entryByKey = new Map(entries.map((e) => [e.key, e]));
    for (const [entryKey, count] of Object.entries(skins.skinsByEntry)) {
      const entry = entryByKey.get(entryKey) as Entry | undefined;
      const owners = entry?.owners ?? [entryKey];
      const share = count / owners.length;
      for (const player of owners) {
        totals[player] = (totals[player] ?? 0) + share;
      }
    }
  }
  return totals;
}

export function allParticipants(teeTimes: TeeTime[]): string[] {
  const set = new Set<string>();
  for (const t of teeTimes) for (const p of t.players) set.add(p);
  return [...set];
}
