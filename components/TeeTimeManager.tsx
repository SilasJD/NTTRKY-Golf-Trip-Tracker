"use client";

import { useState } from "react";
import { supabase, type TeeTime, type Team } from "@/lib/supabase/client";
import { courses } from "@/lib/courses";
import { players } from "@/lib/players";
import { TeamBuilder, validateTeams } from "@/components/TeamBuilder";
import { notifySaveError } from "@/lib/toast";

type Props = {
  teeTimes: TeeTime[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type DraftTeeTime = {
  course_slug: TeeTime["course_slug"];
  play_date: string;
  tee_time: string;
  players: string[];
  format: TeeTime["format"];
  teams: Team[];
};

const emptyDraft: DraftTeeTime = {
  course_slug: "wolf-creek",
  play_date: "",
  tee_time: "",
  players: [],
  format: "stroke",
  teams: [],
};

export function TeeTimeManager({ teeTimes, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftTeeTime>(emptyDraft);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function startEdit(teeTime: TeeTime) {
    setEditingId(teeTime.id);
    setDraft({
      course_slug: teeTime.course_slug,
      play_date: teeTime.play_date,
      tee_time: teeTime.tee_time,
      players: teeTime.players,
      format: teeTime.format,
      teams: teeTime.teams,
    });
    setOpen(true);
  }

  function togglePlayer(name: string) {
    setDraft((d) =>
      d.players.includes(name)
        ? {
            ...d,
            players: d.players.filter((p) => p !== name),
            teams: d.teams.map((t) => ({ ...t, players: t.players.filter((p) => p !== name) })),
          }
        : { ...d, players: [...d.players, name] }
    );
  }

  async function save() {
    if (!draft.play_date || !draft.tee_time || draft.players.length === 0) return;
    if (draft.format === "scramble") {
      const error = validateTeams(draft.players, draft.teams);
      if (error) {
        alert(error);
        return;
      }
    }
    setSaving(true);
    const payload = { ...draft, teams: draft.format === "scramble" ? draft.teams : [] };
    let ok = true;
    if (editingId) {
      const { error } = await supabase.from("tee_times").update(payload).eq("id", editingId);
      if (error) {
        console.error(error);
        notifySaveError("tee time", save);
        ok = false;
      }
    } else {
      const { data, error } = await supabase.from("tee_times").insert(payload).select().single();
      if (error) {
        console.error(error);
        notifySaveError("tee time", save);
        ok = false;
      }
      if (data) onSelect(data.id);
    }
    setSaving(false);
    if (ok) setOpen(false);
  }

  async function doRemove(id: string) {
    const { error } = await supabase.from("tee_times").delete().eq("id", id);
    if (error) {
      console.error(error);
      notifySaveError("tee time deletion", () => doRemove(id));
    }
  }

  function remove(id: string) {
    if (!confirm("Delete this tee time and its scores?")) return;
    doRemove(id);
  }

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Tee times</p>
        <button
          onClick={startCreate}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white active:bg-emerald-800"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {teeTimes.length === 0 && (
          <p className="text-sm text-slate-600">No tee times scheduled yet.</p>
        )}
        {teeTimes.map((t) => {
          const course = courses.find((c) => c.slug === t.course_slug);
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                selectedId === t.id ? "border-emerald-700 bg-emerald-50" : "border-slate-200"
              }`}
            >
              <button onClick={() => onSelect(t.id)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{course?.name}</span>
                  {t.format === "scramble" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                      Scramble
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600">
                  {t.play_date} · {t.tee_time} ·{" "}
                  {t.format === "scramble"
                    ? t.teams.map((team) => `${team.name} (${team.players.join("/")})`).join(" · ")
                    : t.players.join(", ")}
                </div>
              </button>
              <div className="flex gap-2 pl-2">
                <button onClick={() => startEdit(t)} className="text-xs text-emerald-700">
                  Edit
                </button>
                <button onClick={() => remove(t.id)} className="text-xs text-red-600">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
          <label className="flex flex-col gap-1 text-sm">
            Course
            <select
              value={draft.course_slug}
              onChange={(e) =>
                setDraft((d) => ({ ...d, course_slug: e.target.value as TeeTime["course_slug"] }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {courses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Date
            <input
              type="date"
              value={draft.play_date}
              onChange={(e) => setDraft((d) => ({ ...d, play_date: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Time
            <input
              type="time"
              value={draft.tee_time}
              onChange={(e) => setDraft((d) => ({ ...d, tee_time: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm">
            Players
            <div className="grid grid-cols-3 gap-2">
              {players.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => togglePlayer(name)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                    draft.players.includes(name)
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            Format
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, format: "stroke" }))}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  draft.format === "stroke"
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, format: "scramble" }))}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  draft.format === "scramble"
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Scramble (Teams)
              </button>
            </div>
          </div>

          {draft.format === "scramble" && draft.players.length > 0 && (
            <TeamBuilder
              players={draft.players}
              teams={draft.teams}
              onChange={(teams) => setDraft((d) => ({ ...d, teams }))}
            />
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
