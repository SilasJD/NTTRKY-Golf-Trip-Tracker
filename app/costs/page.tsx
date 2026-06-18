"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Expense, type PlayerVenmo } from "@/lib/supabase/client";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { ExpenseManager } from "@/components/ExpenseManager";
import { BalancesSummary } from "@/components/BalancesSummary";
import { VenmoSettings } from "@/components/VenmoSettings";

export default function CostsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [venmoMap, setVenmoMap] = useState<Record<string, string>>({});

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

  return (
    <div className="flex flex-1 flex-col gap-4 bg-zinc-50 p-4">
      <Link href="/" className="text-sm text-green-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-zinc-900">Costs</h1>

      <PlayerSwitcher />
      <VenmoSettings venmoMap={venmoMap} />
      <BalancesSummary expenses={expenses} venmoMap={venmoMap} />
      <ExpenseManager expenses={expenses} />
    </div>
  );
}
