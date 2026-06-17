"use client";

import { useState } from "react";
import { players } from "@/lib/players";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

export function PlayerSwitcher() {
  const { player, setPlayer, loaded } = useCurrentPlayer();
  const [picking, setPicking] = useState(false);

  if (!loaded) return null;

  if (!player || picking) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-zinc-700">Who are you?</p>
        <div className="grid grid-cols-3 gap-2">
          {players.map((name) => (
            <button
              key={name}
              onClick={() => {
                setPlayer(name);
                setPicking(false);
              }}
              className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white active:bg-green-800"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setPicking(true)}
      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm"
    >
      <span className="text-zinc-500">
        Playing as <span className="font-semibold text-zinc-900">{player}</span>
      </span>
      <span className="text-green-700">Switch</span>
    </button>
  );
}
