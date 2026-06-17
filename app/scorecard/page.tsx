"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type TeeTime } from "@/lib/supabase/client";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { TeeTimeManager } from "@/components/TeeTimeManager";
import { ScoreGrid } from "@/components/ScoreGrid";

export default function ScorecardPage() {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tee_times")
        .select("*")
        .order("play_date")
        .order("tee_time");
      if (error) console.error(error);
      setTeeTimes(data ?? []);
    }
    load();

    const channel = supabase
      .channel("tee_times")
      .on("postgres_changes", { event: "*", schema: "public", table: "tee_times" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selected = teeTimes.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-4 bg-zinc-50 p-4">
      <Link href="/" className="text-sm text-green-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-zinc-900">Scorecard</h1>

      <PlayerSwitcher />
      <TeeTimeManager teeTimes={teeTimes} selectedId={selectedId} onSelect={setSelectedId} />

      {selected ? (
        <ScoreGrid teeTime={selected} />
      ) : (
        <p className="text-sm text-zinc-400">Select a tee time above to enter scores.</p>
      )}
    </div>
  );
}
