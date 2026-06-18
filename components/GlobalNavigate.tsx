"use client";

import { useEffect, useState } from "react";
import { supabase, type NavDestination } from "@/lib/supabase/client";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function GlobalNavigate() {
  const { player: currentPlayer } = useCurrentPlayer();
  const [destination, setDestination] = useState<NavDestination | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("nav_destination").select("*").eq("id", 1).single();
      if (error) console.error(error);
      if (data) setDestination(data);
    }
    load();

    const channel = supabase
      .channel("nav_destination")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nav_destination" },
        (payload) => {
          setDestination(payload.new as NavDestination);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function startEdit() {
    setDraft(destination?.address ?? "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("nav_destination")
      .update({ address: draft, updated_by: currentPlayer, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) console.error(error);
    setSaving(false);
    setEditing(false);
  }

  const address = destination?.address ?? "";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <PlayerSwitcher />

      {address && !editing && (
        <a
          href={mapsUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center rounded-lg bg-green-700 px-4 py-3 text-center text-white active:bg-green-800"
        >
          <span className="text-base font-semibold">🧭 Navigate</span>
          <span className="text-xs text-green-100">{address}</span>
        </a>
      )}

      {!address && !editing && (
        <p className="text-sm text-zinc-600">No destination set yet.</p>
      )}

      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Course, hotel, restaurant address…"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        currentPlayer && (
          <button onClick={startEdit} className="text-xs text-green-700">
            {address ? "Update destination" : "Set destination"}
          </button>
        )
      )}

      {destination?.updated_by && !editing && (
        <p className="text-[10px] text-zinc-600">Set by {destination.updated_by}</p>
      )}
    </div>
  );
}
