"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { supabase, type PhotosLink as PhotosLinkRow } from "@/lib/supabase/client";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

export function PhotosLink() {
  const { player: currentPlayer } = useCurrentPlayer();
  const [link, setLink] = useState<PhotosLinkRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("photos_link").select("*").eq("id", 1).single();
      if (error) console.error(error);
      if (data) setLink(data);
    }
    load();

    const channel = supabase
      .channel("photos_link")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos_link" },
        (payload) => {
          setLink(payload.new as PhotosLinkRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function startEdit() {
    setDraft(link?.url ?? "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("photos_link")
      .update({ url: draft, updated_by: currentPlayer, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) console.error(error);
    setSaving(false);
    setEditing(false);
  }

  const url = link?.url ?? "";

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-slate-100 p-3 shadow-sm">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Google Drive folder link…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-sm shadow-sm">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-700"
        >
          <ImageIcon size={15} strokeWidth={2.25} />
          Shared Photos
        </a>
      ) : (
        <span className="flex items-center gap-1.5 text-slate-600">
          <ImageIcon size={15} strokeWidth={2.25} />
          No photos link set yet
        </span>
      )}
      {currentPlayer && (
        <button onClick={startEdit} className="text-xs text-emerald-700">
          {url ? "Edit" : "Set"}
        </button>
      )}
    </div>
  );
}
