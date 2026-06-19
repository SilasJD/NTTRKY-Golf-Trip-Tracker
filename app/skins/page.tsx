"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type TeeTime, type ScoreRow, type SkinsSettings } from "@/lib/supabase/client";
import { courses } from "@/lib/courses";
import { TripSkins } from "@/components/TripSkins";
import { RoundSkins } from "@/components/RoundSkins";
import { SkinsBuyIn } from "@/components/SkinsBuyIn";

export default function SkinsPage() {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [settings, setSettings] = useState<SkinsSettings | null>(null);
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

    async function loadSettings() {
      const { data, error } = await supabase.from("skins_settings").select("*").eq("id", 1).single();
      if (error) console.error(error);
      setSettings(data);
    }
    loadSettings();

    const channel = supabase
      .channel("skins")
      .on("postgres_changes", { event: "*", schema: "public", table: "tee_times" }, loadTeeTimes)
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, loadScores)
      .on("postgres_changes", { event: "*", schema: "public", table: "skins_settings" }, loadSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const buyIn = settings?.buy_in ?? 1;
  const selected = teeTimes.find((t) => t.id === selectedId) ?? null;
  const selectedScores = scores.filter((s) => s.tee_time_id === selectedId);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Skins</h1>

      <SkinsBuyIn settings={settings} />

      <TripSkins teeTimes={teeTimes} scores={scores} buyIn={buyIn} />

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

      {selected && <RoundSkins teeTime={selected} scores={selectedScores} buyIn={buyIn} />}
    </div>
  );
}
