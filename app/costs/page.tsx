"use client";

import { useEffect, useState } from "react";
import { supabase, type Expense, type PlayerVenmo, type TeeTime, type ScoreRow, type SkinsSettings, type SideBet } from "@/lib/supabase/client";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { ExpenseManager } from "@/components/ExpenseManager";
import { BalancesSummary } from "@/components/BalancesSummary";
import { VenmoSettings } from "@/components/VenmoSettings";
import { PageHeader } from "@/components/PageHeader";
import { sections } from "@/lib/sections";

const section = sections.find((s) => s.href === "/costs")!;

export default function CostsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [venmoMap, setVenmoMap] = useState<Record<string, string>>({});
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [skinsSettings, setSkinsSettings] = useState<SkinsSettings | null>(null);
  const [sideBets, setSideBets] = useState<SideBet[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      setExpenses(data ?? []);
    }
    load();

    const channel = supabase
      .channel("expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function toMap(rows: PlayerVenmo[]) {
      const map: Record<string, string> = {};
      for (const row of rows) if (row.venmo_username) map[row.player_name] = row.venmo_username;
      return map;
    }

    async function load() {
      const { data, error } = await supabase.from("player_venmo").select("*");
      if (error) console.error(error);
      setVenmoMap(toMap(data ?? []));
    }
    load();

    const channel = supabase
      .channel("player_venmo")
      .on("postgres_changes", { event: "*", schema: "public", table: "player_venmo" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

    async function loadSkinsSettings() {
      const { data, error } = await supabase.from("skins_settings").select("*").eq("id", 1).single();
      if (error) console.error(error);
      setSkinsSettings(data);
    }
    loadSkinsSettings();

    async function loadSideBets() {
      const { data, error } = await supabase.from("side_bets").select("*");
      if (error) console.error(error);
      setSideBets(data ?? []);
    }
    loadSideBets();

    const channel = supabase
      .channel("costs-skins")
      .on("postgres_changes", { event: "*", schema: "public", table: "tee_times" }, loadTeeTimes)
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, loadScores)
      .on("postgres_changes", { event: "*", schema: "public", table: "skins_settings" }, loadSkinsSettings)
      .on("postgres_changes", { event: "*", schema: "public", table: "side_bets" }, loadSideBets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <PageHeader title={section.title} icon={section.icon} badge={section.badge} />

      <PlayerSwitcher />
      <VenmoSettings venmoMap={venmoMap} />
      <BalancesSummary
        expenses={expenses}
        venmoMap={venmoMap}
        teeTimes={teeTimes}
        scores={scores}
        skinsBuyIn={skinsSettings?.buy_in ?? 1}
        sideBets={sideBets}
      />
      <ExpenseManager expenses={expenses} />
    </div>
  );
}
