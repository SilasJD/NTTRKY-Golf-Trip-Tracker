"use client";

import { useSyncExternalStore } from "react";
import { type Player } from "@/lib/players";

const STORAGE_KEY = "nttrky-current-player";
const listeners = new Set<() => void>();
let cached: Player | null | undefined;

function readFromStorage(): Player | null {
  return window.localStorage.getItem(STORAGE_KEY) as Player | null;
}

function getSnapshot(): Player | null {
  if (cached === undefined) cached = readFromStorage();
  return cached;
}

function getServerSnapshot(): Player | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writePlayer(next: Player | null) {
  if (next) window.localStorage.setItem(STORAGE_KEY, next);
  else window.localStorage.removeItem(STORAGE_KEY);
  cached = next;
  listeners.forEach((l) => l());
}

export function useCurrentPlayer() {
  const player = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    player,
    setPlayer: (next: Player) => writePlayer(next),
    clearPlayer: () => writePlayer(null),
  };
}
