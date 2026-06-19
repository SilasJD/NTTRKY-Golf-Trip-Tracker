"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

type Props = {
  venmoMap: Record<string, string>;
};

export function VenmoSettings({ venmoMap }: Props) {
  const { player: currentPlayer } = useCurrentPlayer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  if (!currentPlayer) return null;

  const myHandle = venmoMap[currentPlayer] ?? "";

  function startEdit() {
    setDraft(myHandle);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const cleaned = draft.trim().replace(/^@/, "");
    const { error } = await supabase
      .from("player_venmo")
      .upsert(
        { player_name: currentPlayer, venmo_username: cleaned, updated_at: new Date().toISOString() },
        { onConflict: "player_name" }
      );
    if (error) console.error(error);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm">
        <span className="text-slate-600">@</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="your-venmo-username"
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1"
        />
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
      className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-sm shadow-sm"
    >
      <span className="text-slate-600">
        Your Venmo: <span className="font-semibold text-slate-900">{myHandle ? `@${myHandle}` : "not set"}</span>
      </span>
      <span className="text-emerald-700">{myHandle ? "Edit" : "Set"}</span>
    </button>
  );
}
