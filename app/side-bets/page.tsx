"use client";

import { useEffect, useState } from "react";
import { supabase, type SideBet } from "@/lib/supabase/client";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { SideBetManager } from "@/components/SideBetManager";
import { PageHeader } from "@/components/PageHeader";
import { sections } from "@/lib/sections";

const section = sections.find((s) => s.href === "/side-bets")!;

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
      <PageHeader title={section.title} icon={section.icon} badge={section.badge} />

      <PlayerSwitcher />
      <SideBetManager bets={bets} />
    </div>
  );
}
