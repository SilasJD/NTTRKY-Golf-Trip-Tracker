"use client";

import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { player } = useCurrentPlayer();

  if (!player) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-4 text-center text-xl font-bold text-zinc-900">NTTRKY Golf Trip</h1>
          <PlayerSwitcher />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
