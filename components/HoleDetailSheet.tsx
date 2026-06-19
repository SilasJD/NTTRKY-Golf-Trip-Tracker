"use client";

import { X } from "lucide-react";
import { type Hole } from "@/lib/courses";
import { type Entry } from "@/lib/entries";
import { HoleIllustration } from "@/components/HoleIllustration";

type Props = {
  hole: Hole;
  entries: Entry[];
  scores: Record<string, number | null>;
  putts: Record<string, number | null>;
  mvp: Record<string, string>;
  isScramble: boolean;
  canEdit: (entry: Entry) => boolean;
  onSetScore: (player: string, value: string) => void;
  onSetPutts: (player: string, value: string) => void;
  onSetMvp: (teamName: string, playerName: string) => void;
  onClose: () => void;
};

export function HoleDetailSheet({
  hole,
  entries,
  scores,
  putts,
  mvp,
  isScramble,
  canEdit,
  onSetScore,
  onSetPutts,
  onSetMvp,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-slate-50 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">Hole {hole.number}</p>
            <p className="text-sm text-slate-600">
              Par {hole.par} · {hole.yards} yds
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 active:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="flex max-h-[50vh] w-full items-center justify-center overflow-hidden bg-emerald-50">
          {hole.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hole.image}
              alt={`Hole ${hole.number} layout`}
              className="max-h-[50vh] w-full object-contain"
            />
          ) : (
            <HoleIllustration par={hole.par} holeNumber={hole.number} className="h-full max-h-[50vh] w-full" />
          )}
        </div>

        <div className="flex flex-col gap-3 p-4">
          {entries.map((entry) => {
            const editable = canEdit(entry);
            return (
              <div key={entry.key} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">
                  {entry.label}
                  {entry.sublabel && <span className="ml-1 text-xs font-normal text-slate-500">({entry.sublabel})</span>}
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col gap-1 text-xs text-slate-600">
                    Score
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={15}
                      disabled={!editable}
                      value={scores[entry.key] ?? ""}
                      onChange={(e) => onSetScore(entry.key, e.target.value)}
                      className="h-10 w-14 rounded-lg border border-slate-300 text-center text-base"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-600">
                    Putts
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={10}
                      disabled={!editable}
                      value={putts[entry.key] ?? ""}
                      onChange={(e) => onSetPutts(entry.key, e.target.value)}
                      className="h-10 w-14 rounded-lg border border-slate-300 text-center text-base"
                    />
                  </label>
                  {isScramble && (
                    <label className="flex flex-1 flex-col gap-1 text-xs text-slate-600">
                      Hole MVP
                      <select
                        value={mvp[entry.key] ?? ""}
                        onChange={(e) => onSetMvp(entry.key, e.target.value)}
                        className="h-10 rounded-lg border border-slate-300 px-2 text-sm"
                      >
                        <option value="">—</option>
                        {entry.owners.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
