"use client";

import { useState } from "react";
import { supabase, type SideBet } from "@/lib/supabase/client";
import { players } from "@/lib/players";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { notifySaveError } from "@/lib/toast";

type Props = {
  bets: SideBet[];
};

type DraftBet = {
  title: string;
  amount: string;
  participants: string[];
};

const emptyDraft: DraftBet = { title: "", amount: "", participants: [] };

export function SideBetManager({ bets }: Props) {
  const { player: currentPlayer } = useCurrentPlayer();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftBet>(emptyDraft);
  const [saving, setSaving] = useState(false);

  function toggleParticipant(name: string) {
    setDraft((d) =>
      d.participants.includes(name)
        ? { ...d, participants: d.participants.filter((p) => p !== name) }
        : { ...d, participants: [...d.participants, name] }
    );
  }

  async function create() {
    const amount = Number(draft.amount);
    if (!draft.title || !amount || amount <= 0 || draft.participants.length < 2) return;
    setSaving(true);
    const payload = {
      title: draft.title,
      amount,
      participants: draft.participants,
      created_by: currentPlayer,
    };
    const { error } = await supabase.from("side_bets").insert(payload);
    if (error) {
      console.error(error);
      notifySaveError("side bet", create);
      setSaving(false);
      return;
    }
    setSaving(false);
    setDraft(emptyDraft);
    setOpen(false);
  }

  async function resolve(bet: SideBet, winner: string) {
    const { error } = await supabase.from("side_bets").update({ winner }).eq("id", bet.id);
    if (error) {
      console.error(error);
      notifySaveError("side bet result", () => resolve(bet, winner));
    }
  }

  async function doRemove(id: string) {
    const { error } = await supabase.from("side_bets").delete().eq("id", id);
    if (error) {
      console.error(error);
      notifySaveError("side bet deletion", () => doRemove(id));
    }
  }

  function remove(id: string) {
    if (!confirm("Delete this side bet?")) return;
    doRemove(id);
  }

  const open_ = bets.filter((b) => !b.winner);
  const resolved = bets.filter((b) => b.winner);

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Side Bets</p>
        {currentPlayer && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white active:bg-emerald-800"
          >
            + Add
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {bets.length === 0 && <p className="text-sm text-slate-600">No side bets yet.</p>}

        {open_.map((bet) => (
          <div key={bet.id} className="rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{bet.title}</p>
                <p className="text-xs text-slate-600">
                  ${bet.amount.toFixed(2)} · {bet.participants.join(", ")}
                </p>
              </div>
              <button onClick={() => remove(bet.id)} className="text-xs text-red-600">
                Delete
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bet.participants.map((p) => (
                <button
                  key={p}
                  onClick={() => resolve(bet, p)}
                  className="rounded-lg border border-emerald-700 px-2 py-1 text-xs font-medium text-emerald-700 active:bg-emerald-50"
                >
                  {p} won
                </button>
              ))}
            </div>
          </div>
        ))}

        {resolved.map((bet) => {
          const losers = bet.participants.filter((p) => p !== bet.winner);
          return (
            <div key={bet.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{bet.title}</p>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-emerald-700">{bet.winner}</span> won $
                  {(bet.amount * losers.length).toFixed(2)} from {losers.join(", ")}
                </p>
              </div>
              <button onClick={() => remove(bet.id)} className="text-xs text-red-600">
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
          <label className="flex flex-col gap-1 text-sm">
            What&apos;s the bet?
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Closest to the pin, hole 7…"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Amount per loser ($)
            <input
              type="number"
              inputMode="decimal"
              min={0.01}
              step="1"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm">
            Who&apos;s in?
            <div className="grid grid-cols-3 gap-2">
              {players.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleParticipant(name)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                    draft.participants.includes(name)
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={create}
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create Bet"}
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
