"use client";

import { useEffect, useState } from "react";
import { type Player } from "@/lib/players";

const STORAGE_KEY = "nttrky-current-player";

export function useCurrentPlayer() {
  const [state, setState] = useState<{ player: Player | null; loaded: boolean }>({
    player: null,
    loaded: false,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Player | null;
    // localStorage isn't available during SSR; a lazy useState initializer would
    // cause a hydration mismatch instead, so this one-time read happens post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ player: stored, loaded: true });
  }, []);

  function setPlayer(next: Player) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setState((s) => ({ ...s, player: next }));
  }

  function clearPlayer() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState((s) => ({ ...s, player: null }));
  }

  return { player: state.player, setPlayer, clearPlayer, loaded: state.loaded };
}
