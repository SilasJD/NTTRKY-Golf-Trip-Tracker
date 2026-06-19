"use client";

import { useState } from "react";
import { supabase, type SkinsSettings } from "@/lib/supabase/client";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { notifySaveError } from "@/lib/toast";

type Props = {
  settings: SkinsSettings | null;
};

export function SkinsBuyIn({ settings }: Props) {
  const { player: currentPlayer } = useCurrentPlayer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const buyIn = settings?.buy_in ?? 1;

  function startEdit() {
    setDraft(String(buyIn));
    setEditing(true);
  }

  async function save() {
    const amount = Number(draft);
    if (!amount || amount <= 0) return;
    setSaving(true);
    const { error } = await supabase
      .from("skins_settings")
      .update({ buy_in: amount, updated_by: currentPlayer, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      console.error(error);
      notifySaveError("skins buy-in", save);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm">
        <span className="text-slate-600">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0.01}
          step="0.5"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1"
        />
        <span className="text-slate-600">per skin</span>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-slate-600">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      disabled={!currentPlayer}
      className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-sm shadow-sm"
    >
      <span className="text-slate-600">
        Buy-in: <span className="font-semibold text-slate-900">${buyIn.toFixed(2)} per skin</span>
      </span>
      {currentPlayer && <span className="text-emerald-700">Edit</span>}
    </button>
  );
}
