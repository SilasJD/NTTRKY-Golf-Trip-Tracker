"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type SideBet } from "@/lib/supabase/client";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { SideBetManager } from "@/components/SideBetManager";

export default function SideBetsPage() {
  const [bets, setBets] = useState<SideBet[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("side_bets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      setBets(data ?? []);
    }
    load();

    const channel = supabase
      .channel("side_bets")
      .on("postgres_changes", { event: "*", schema: "public", table: "side_bets" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Side Bets</h1>

      <PlayerSwitcher />
      <SideBetManager bets={bets} />
    </div>
  );
}
