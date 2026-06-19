import { type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { getCourse, type Course } from "@/lib/courses";
import { getEntries, type Entry } from "@/lib/entries";
import { computeRoundSkins, aggregateSkinsByPlayer, toScoreMap } from "@/lib/skins";

export type Award = {
  id: string;
  title: string;
  winner: string;
  detail: string;
};

type RoundData = { teeTime: TeeTime; course: Course; rows: ScoreRow[] };

function buildRounds(teeTimes: TeeTime[], scores: ScoreRow[]): RoundData[] {
  const byTeeTime: Record<string, ScoreRow[]> = {};
  for (const row of scores) (byTeeTime[row.tee_time_id] ??= []).push(row);

  return teeTimes
    .map((teeTime) => {
      const course = getCourse(teeTime.course_slug);
      if (!course) return null;
      return { teeTime, course, rows: byTeeTime[teeTime.id] ?? [] };
    })
    .filter((r): r is RoundData => r !== null);
}

function topEntry(record: Record<string, number>): [string, number] | undefined {
  const sorted = Object.entries(record).sort((a, b) => b[1] - a[1]);
  return sorted[0];
}

function formatToPar(diff: number) {
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function entryLabel(entry: Entry | undefined, fallback: string) {
  if (!entry) return fallback;
  return entry.sublabel ? `${entry.label} (${entry.sublabel})` : entry.label;
}

function formatCount(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export function computeAwards(teeTimes: TeeTime[], scores: ScoreRow[]): Award[] {
  const rounds = buildRounds(teeTimes, scores);
  const awards: Award[] = [];

  const threePutts: Record<string, number> = {};
  for (const { teeTime, rows } of rounds) {
    const entryByKey = new Map(getEntries(teeTime).map((e) => [e.key, e]));
    for (const row of rows) {
      if (row.putts == null || row.putts < 3) continue;
      const owners = entryByKey.get(row.player_name)?.owners ?? [row.player_name];
      for (const p of owners) threePutts[p] = (threePutts[p] ?? 0) + 1;
    }
  }
  const threePuttLeader = topEntry(threePutts);
  if (threePuttLeader) {
    awards.push({
      id: "three-putts",
      title: "Three-Putt King",
      winner: threePuttLeader[0],
      detail: `${threePuttLeader[1]} three-putt${threePuttLeader[1] === 1 ? "" : "s"}`,
    });
  }

  const streaks: Record<string, number> = {};
  for (const { teeTime, course, rows } of rounds) {
    for (const entry of getEntries(teeTime)) {
      const holeScores: Record<number, number> = {};
      for (const row of rows) {
        if (row.player_name === entry.key && row.strokes != null) holeScores[row.hole_number] = row.strokes;
      }
      let best = 0;
      let current = 0;
      for (const hole of course.holes) {
        const strokes = holeScores[hole.number];
        if (strokes == null) {
          current = 0;
          continue;
        }
        if (strokes - hole.par <= 0) {
          current += 1;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
      for (const p of entry.owners) streaks[p] = Math.max(streaks[p] ?? 0, best);
    }
  }
  const streakLeader = topEntry(streaks);
  if (streakLeader && streakLeader[1] >= 2) {
    awards.push({
      id: "streak",
      title: "Longest Streak",
      winner: streakLeader[0],
      detail: `${streakLeader[1]} holes par-or-better in a row`,
    });
  }

  const roundsForSkins = rounds.map(({ teeTime, course, rows }) => ({
    teeTime,
    skins: computeRoundSkins(teeTime, course, toScoreMap(rows)),
  }));
  const skinsByPlayer = aggregateSkinsByPlayer(roundsForSkins);
  const skinsLeader = topEntry(skinsByPlayer);
  if (skinsLeader && skinsLeader[1] > 0) {
    awards.push({
      id: "skins",
      title: "Most Skins Won",
      winner: skinsLeader[0],
      detail: `${formatCount(skinsLeader[1])} skin${skinsLeader[1] === 1 ? "" : "s"}`,
    });
  }

  let worst: { entry?: Entry; key: string; course: Course; hole: number; strokes: number; diff: number } | null = null;
  let best: { entry?: Entry; key: string; course: Course; hole: number; strokes: number; diff: number } | null = null;
  const birdies: Record<string, number> = {};

  for (const { teeTime, course, rows } of rounds) {
    const entryByKey = new Map(getEntries(teeTime).map((e) => [e.key, e]));
    for (const row of rows) {
      if (row.strokes == null) continue;
      const hole = course.holes.find((h) => h.number === row.hole_number);
      if (!hole) continue;
      const diff = row.strokes - hole.par;
      const entry = entryByKey.get(row.player_name);

      if (!worst || diff > worst.diff) {
        worst = { entry, key: row.player_name, course, hole: hole.number, strokes: row.strokes, diff };
      }
      if (!best || diff < best.diff) {
        best = { entry, key: row.player_name, course, hole: hole.number, strokes: row.strokes, diff };
      }
      if (diff <= -1) {
        const owners = entry?.owners ?? [row.player_name];
        for (const p of owners) birdies[p] = (birdies[p] ?? 0) + 1;
      }
    }
  }

  if (worst) {
    awards.push({
      id: "worst-hole",
      title: "Worst Single Hole",
      winner: entryLabel(worst.entry, worst.key),
      detail: `${worst.strokes} on hole ${worst.hole} at ${worst.course.name} (${formatToPar(worst.diff)})`,
    });
  }
  if (best) {
    awards.push({
      id: "best-hole",
      title: "Best Single Hole",
      winner: entryLabel(best.entry, best.key),
      detail: `${best.strokes} on hole ${best.hole} at ${best.course.name} (${formatToPar(best.diff)})`,
    });
  }

  const birdieLeader = topEntry(birdies);
  if (birdieLeader) {
    awards.push({
      id: "birdies",
      title: "Birdie Machine",
      winner: birdieLeader[0],
      detail: `${birdieLeader[1]} birdie${birdieLeader[1] === 1 ? "" : "s"}-or-better`,
    });
  }

  return awards;
}
