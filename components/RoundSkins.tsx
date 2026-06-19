"use client";

import { type ScoreRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { getEntries } from "@/lib/entries";
import { computeRoundSkins, toScoreMap } from "@/lib/skins";

type Props = {
  teeTime: TeeTime;
  scores: ScoreRow[];
  buyIn: number;
};

export function RoundSkins({ teeTime, scores, buyIn }: Props) {
  const course = getCourse(teeTime.course_slug);
  if (!course) return <p className="text-sm text-red-600">Unknown course.</p>;

  const entries = getEntries(teeTime);
  const entryByKey = new Map(entries.map((e) => [e.key, e]));
  const scoreMap = toScoreMap(scores);
  const { holeResults, skinsByEntry, carry } = computeRoundSkins(teeTime, course, scoreMap);

  const summary = Object.entries(skinsByEntry).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-slate-700">
        {course.name} · {teeTime.play_date} {teeTime.tee_time}
      </p>

      {summary.length === 0 ? (
        <p className="text-sm text-slate-600">No resolved holes yet.</p>
      ) : (
        <div className="mb-3 flex flex-col gap-1.5">
          {summary.map(([key, count]) => {
            const entry = entryByKey.get(key);
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">{entry?.label ?? key}</span>
                <span className="text-slate-600">
                  {count} skin{count === 1 ? "" : "s"}{" "}
                  <span className="font-semibold text-emerald-700">${(count * buyIn).toFixed(2)}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {carry > 0 && (
        <p className="mb-3 text-xs text-amber-700">
          {carry} skin{carry === 1 ? "" : "s"} carrying over to the next hole.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-slate-200 pt-3">
        {holeResults.map((r) => {
          const entry = r.winnerKey ? entryByKey.get(r.winnerKey) : null;
          return (
            <div
              key={r.hole}
              title={entry ? `Hole ${r.hole}: ${entry.label} won ${r.skinsAwarded}` : `Hole ${r.hole}: tied, carries over`}
              className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg text-[10px] font-semibold ${
                r.winnerKey ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"
              }`}
            >
              <span>{r.hole}</span>
              {r.winnerKey && r.skinsAwarded > 1 && <span>x{r.skinsAwarded}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
