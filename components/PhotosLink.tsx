"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Pencil, X } from "lucide-react";
import { supabase, type PhotosLink as PhotosLinkRow } from "@/lib/supabase/client";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { notifySaveError } from "@/lib/toast";

export function PhotosLink() {
  const { player: currentPlayer } = useCurrentPlayer();
  const [link, setLink] = useState<PhotosLinkRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("photos_link").select("*").eq("id", 1).single();
      if (error) {
        console.error(error);
        notifySaveError("photos link (couldn't load)", load);
      }
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
    if (error) {
      console.error(error);
      notifySaveError("photos link", save);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
  }

  const url = link?.url ?? "";

  return (
    <>
      <div className="relative aspect-square">
        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!url) e.preventDefault();
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-2xl bg-cyan-50 p-3 text-center shadow-md transition active:scale-95"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg">
            <ImageIcon size={28} strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold text-slate-900">Photos</span>
        </a>
        {currentPlayer && (
          <button
            onClick={startEdit}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow active:bg-white"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(false)}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-slate-50 p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Shared photos link</p>
              <button onClick={() => setEditing(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>
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
            {link?.updated_by && <p className="text-[10px] text-slate-500">Last set by {link.updated_by}</p>}
          </div>
        </div>
      )}
    </>
  );
}
