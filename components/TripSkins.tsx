"use client";

import { type ScoreRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { computeRoundSkins, aggregateSkinsByPlayer, toScoreMap } from "@/lib/skins";

type Props = {
  teeTimes: TeeTime[];
  scores: ScoreRow[];
  buyIn: number;
};

export function TripSkins({ teeTimes, scores, buyIn }: Props) {
  const rounds = teeTimes
    .map((teeTime) => {
      const course = getCourse(teeTime.course_slug);
      if (!course) return null;
      const roundScores = scores.filter((s) => s.tee_time_id === teeTime.id);
      const skins = computeRoundSkins(teeTime, course, toScoreMap(roundScores));
      return { teeTime, skins };
    })
    .filter((r): r is { teeTime: TeeTime; skins: ReturnType<typeof computeRoundSkins> } => r !== null);

  const totals = aggregateSkinsByPlayer(rounds);
  const standings = Object.entries(totals)
    .map(([player, count]) => ({ player, count }))
    .sort((a, b) => b.count - a.count);

  const totalSkins = standings.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-slate-700">Trip Skins</p>
      {standings.length === 0 ? (
        <p className="text-sm text-slate-600">No skins won yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => (
            <div key={s.player} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-5 text-slate-600">{i + 1}</span>
                <span className="font-semibold text-slate-900">{s.player}</span>
              </span>
              <span className="flex items-center gap-3 text-slate-600">
                <span>
                  {s.count % 1 === 0 ? s.count : s.count.toFixed(1)} skin{s.count === 1 ? "" : "s"}
                </span>
                <span className="w-12 text-right font-semibold text-emerald-700">
                  ${(s.count * buyIn).toFixed(2)}
                </span>
              </span>
            </div>
          ))}
          <p className="mt-1 text-xs text-slate-500">{totalSkins % 1 === 0 ? totalSkins : totalSkins.toFixed(1)} total skins awarded · ${buyIn.toFixed(2)} per skin</p>
        </div>
      )}
    </div>
  );
}
