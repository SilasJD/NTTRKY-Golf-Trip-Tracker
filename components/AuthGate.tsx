"use client";

import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { PlayerSwitcher } from "@/components/PlayerSwitcher";
import { MountainSkyline } from "@/components/MountainSkyline";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { player } = useCurrentPlayer();

  if (!player) {
    return (
      <div className="flex flex-1 flex-col bg-slate-200">
        <div className="relative overflow-hidden bg-emerald-950 px-6 py-10 text-center text-white">
          <MountainSkyline className="absolute inset-x-0 bottom-0 h-14 w-full text-emerald-400" />
          <h1 className="relative z-10 text-2xl font-semibold tracking-tight">NTTRKY Golf Trip</h1>
          <p className="relative z-10 mt-1 text-sm text-white/60">Utah · July 2026</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <PlayerSwitcher />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
