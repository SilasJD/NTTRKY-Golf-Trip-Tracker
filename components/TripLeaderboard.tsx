"use client";

import { type ScoreRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { getEntries } from "@/lib/entries";

type Props = {
  teeTimes: TeeTime[];
  scores: ScoreRow[];
};

type PlayerTotal = { strokes: number; par: number; rounds: number };

function formatToPar(rel: number) {
  if (rel === 0) return "E";
  return rel > 0 ? `+${rel}` : `${rel}`;
}

function aggregateTrip(teeTimes: TeeTime[], scores: ScoreRow[]): Record<string, PlayerTotal> {
  const byTeeTime: Record<string, ScoreRow[]> = {};
  for (const row of scores) {
    if (row.strokes == null) continue;
    (byTeeTime[row.tee_time_id] ??= []).push(row);
  }

  const totals: Record<string, PlayerTotal> = {};

  for (const teeTime of teeTimes) {
    const course = getCourse(teeTime.course_slug);
    if (!course) continue;
    const rows = byTeeTime[teeTime.id] ?? [];
    if (rows.length === 0) continue;

    for (const entry of getEntries(teeTime)) {
      const entryRows = rows.filter((r) => r.player_name === entry.key);
      if (entryRows.length === 0) continue;
      for (const player of entry.owners) {
        totals[player] ??= { strokes: 0, par: 0, rounds: 0 };
        totals[player].rounds += 1;
        for (const row of entryRows) {
          const hole = course.holes.find((h) => h.number === row.hole_number);
          if (!hole) continue;
          totals[player].strokes += row.strokes!;
          totals[player].par += hole.par;
        }
      }
    }
  }

  return totals;
}

export function TripLeaderboard({ teeTimes, scores }: Props) {
  const totals = aggregateTrip(teeTimes, scores);
  const standings = Object.entries(totals)
    .map(([player, t]) => ({ player, ...t, rel: t.strokes - t.par }))
    .sort((a, b) => a.rel - b.rel);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-zinc-700">Trip Leaderboard</p>
      {standings.length === 0 ? (
        <p className="text-sm text-zinc-600">No scores entered yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => (
            <div key={s.player} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-5 text-zinc-600">{i + 1}</span>
                <span className="font-semibold text-zinc-900">{s.player}</span>
              </span>
              <span className="flex items-center gap-3 text-zinc-600">
                <span className="text-xs">{s.rounds} rd{s.rounds === 1 ? "" : "s"}</span>
                <span className="w-10 text-right font-semibold text-zinc-900">{s.strokes}</span>
                <span className="w-8 text-right font-semibold text-green-700">{formatToPar(s.rel)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
