"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Flame, Coins, Skull, Sparkles, Bird } from "lucide-react";
import { supabase, type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { computeAwards, type Award } from "@/lib/awards";

const icons: Record<string, typeof Trophy> = {
  "three-putts": Skull,
  streak: Flame,
  skins: Coins,
  "worst-hole": Skull,
  "best-hole": Sparkles,
  birdies: Bird,
};

export default function AwardsPage() {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);

  useEffect(() => {
    async function loadTeeTimes() {
      const { data, error } = await supabase.from("tee_times").select("*");
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
      .channel("awards")
      .on("postgres_changes", { event: "*", schema: "public", table: "tee_times" }, loadTeeTimes)
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, loadScores)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const awards: Award[] = computeAwards(teeTimes, scores);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Awards</h1>

      {awards.length === 0 ? (
        <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
          <p className="text-sm text-slate-600">No awards yet — enter some scores to start the trash talk.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {awards.map((award) => {
            const Icon = icons[award.id] ?? Trophy;
            return (
              <div key={award.id} className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{award.title}</p>
                  <p className="text-base font-semibold text-slate-900">{award.winner}</p>
                  <p className="text-sm text-slate-600">{award.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
