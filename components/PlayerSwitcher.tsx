"use client";

import { useState } from "react";
import { players, playerHints, type Player } from "@/lib/players";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

export function PlayerSwitcher() {
  const { player, setPlayer, clearPlayer } = useCurrentPlayer();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [password, setPassword] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setSelected(null);
    setPassword("");
    setShowHint(false);
    setError("");
  }

  async function submit() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: selected, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setPlayer(selected);
        setPicking(false);
        reset();
      } else {
        setError(data.error ?? "Incorrect password");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!player || picking) {
    if (selected) {
      return (
        <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Password for {selected}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "…" : "Sign in"}
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
            >
              Back
            </button>
          </div>
          {playerHints[selected] && (
            <div className="mt-2">
              {showHint ? (
                <p className="text-xs text-slate-600">Hint: {playerHints[selected]}</p>
              ) : (
                <button onClick={() => setShowHint(true)} className="text-xs text-emerald-700">
                  Forgot password? Show hint
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">Who are you?</p>
        <div className="grid grid-cols-3 gap-2">
          {players.map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white active:bg-slate-700"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-sm shadow-sm">
      <span className="text-slate-600">
        Playing as <span className="font-semibold text-slate-900">{player}</span>
      </span>
      <span className="flex gap-3">
        <button onClick={() => setPicking(true)} className="text-emerald-700">
          Switch
        </button>
        <button onClick={() => clearPlayer()} className="text-red-600">
          Log out
        </button>
      </span>
    </div>
  );
}
