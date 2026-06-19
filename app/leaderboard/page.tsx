"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { courses } from "@/lib/courses";
import { TripLeaderboard } from "@/components/TripLeaderboard";
import { RoundLeaderboard } from "@/components/RoundLeaderboard";

export default function LeaderboardPage() {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeeTimes() {
      const { data, error } = await supabase
        .from("tee_times")
        .select("*")
        .order("play_date")
        .order("tee_time");
      if (error) console.error(error);
      setTeeTimes(data ?? []);
    }
    loadTeeTimes();

    async function loadScores() {
      const { data, error } = await supabase.from("scores").select("*");
      if (error) console.error(error);
      setScores(data ?? []);
    }
    loadScores();

    const channel = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "tee_times" }, loadTeeTimes)
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, loadScores)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selected = teeTimes.find((t) => t.id === selectedId) ?? null;
  const selectedScores = scores.filter((s) => s.tee_time_id === selectedId);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Leaderboard</h1>

      <TripLeaderboard teeTimes={teeTimes} scores={scores} />

      <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">Rounds</p>
        <div className="flex flex-col gap-2">
          {teeTimes.length === 0 && <p className="text-sm text-slate-600">No tee times scheduled yet.</p>}
          {teeTimes.map((t) => {
            const course = courses.find((c) => c.slug === t.course_slug);
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`rounded-lg border px-3 py-2 text-left ${
                  selectedId === t.id ? "border-emerald-700 bg-emerald-50" : "border-slate-200"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{course?.name}</div>
                <div className="text-xs text-slate-600">
                  {t.play_date} · {t.tee_time}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <RoundLeaderboard teeTime={selected} scores={selectedScores} />}
    </div>
  );
}
