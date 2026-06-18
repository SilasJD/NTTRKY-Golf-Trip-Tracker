"use client";

import { type ScoreRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { getEntries } from "@/lib/entries";

type Props = {
  teeTime: TeeTime;
  scores: ScoreRow[];
};

function formatToPar(rel: number) {
  if (rel === 0) return "E";
  return rel > 0 ? `+${rel}` : `${rel}`;
}

export function RoundLeaderboard({ teeTime, scores }: Props) {
  const course = getCourse(teeTime.course_slug);
  if (!course) return <p className="text-sm text-red-600">Unknown course.</p>;

  const entries = getEntries(teeTime);

  const scoreMap: Record<string, Record<number, number>> = {};
  for (const row of scores) {
    if (row.strokes == null) continue;
    scoreMap[row.player_name] ??= {};
    scoreMap[row.player_name][row.hole_number] = row.strokes;
  }

  const standings = entries
    .map((entry) => {
      const holeScores = scoreMap[entry.key] ?? {};
      const holeNumbers = Object.keys(holeScores).map(Number);
      const thru = holeNumbers.length;
      const total = holeNumbers.reduce((sum, n) => sum + holeScores[n], 0);
      const par = holeNumbers.reduce((sum, n) => sum + (course!.holes.find((h) => h.number === n)?.par ?? 0), 0);
      return { entry, thru, total, rel: total - par };
    })
    .sort((a, b) => {
      if (a.thru === 0 && b.thru === 0) return 0;
      if (a.thru === 0) return 1;
      if (b.thru === 0) return -1;
      return a.rel - b.rel;
    });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-zinc-700">
        {course.name} · {teeTime.play_date} {teeTime.tee_time}
      </p>
      <div className="flex flex-col gap-1.5">
        {standings.map((s, i) => (
          <div key={s.entry.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-5 text-zinc-600">{s.thru > 0 ? i + 1 : "–"}</span>
              <span>
                <span className="font-semibold text-zinc-900">{s.entry.label}</span>
                {s.entry.sublabel && <span className="ml-1 text-xs text-zinc-600">({s.entry.sublabel})</span>}
              </span>
            </span>
            <span className="flex items-center gap-3 text-zinc-600">
              <span className="text-xs">Thru {s.thru}</span>
              <span className="w-10 text-right font-semibold text-zinc-900">{s.thru > 0 ? s.total : "–"}</span>
              <span className="w-8 text-right font-semibold text-green-700">
                {s.thru > 0 ? formatToPar(s.rel) : ""}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
