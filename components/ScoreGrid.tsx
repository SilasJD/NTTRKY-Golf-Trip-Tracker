"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase, type ScoreRow, type HoleMvpRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";
import { isAdminPlayer } from "@/lib/players";
import { type Entry, getEntries } from "@/lib/entries";
import { HoleDetailSheet } from "@/components/HoleDetailSheet";
import { notifySaveError } from "@/lib/toast";

type Props = {
  teeTime: TeeTime;
};

type ScoreMap = Record<string, Record<number, number | null>>;
type MvpMap = Record<number, Record<string, string>>;

function toScoreMap(rows: ScoreRow[]): ScoreMap {
  const map: ScoreMap = {};
  for (const row of rows) {
    map[row.player_name] ??= {};
    map[row.player_name][row.hole_number] = row.strokes;
  }
  return map;
}

function toPuttsMap(rows: ScoreRow[]): ScoreMap {
  const map: ScoreMap = {};
  for (const row of rows) {
    map[row.player_name] ??= {};
    map[row.player_name][row.hole_number] = row.putts;
  }
  return map;
}

function toMvpMap(rows: HoleMvpRow[]): MvpMap {
  const map: MvpMap = {};
  for (const row of rows) {
    map[row.hole_number] ??= {};
    map[row.hole_number][row.team_name] = row.player_name;
  }
  return map;
}

export function ScoreGrid({ teeTime }: Props) {
  const course = getCourse(teeTime.course_slug);
  const entries = getEntries(teeTime);
  const isScramble = teeTime.format === "scramble" && teeTime.teams.length > 0;
  const { player: currentPlayer } = useCurrentPlayer();
  const [scores, setScores] = useState<ScoreMap>({});
  const [putts, setPuttsMap] = useState<ScoreMap>({});
  const [mvp, setMvpMap] = useState<MvpMap>({});
  const [loading, setLoading] = useState(true);
  const [half, setHalf] = useState<"front" | "back">("front");
  const [selectedHoleNumber, setSelectedHoleNumber] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastId = useRef(0);
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const pendingFocusRef = useRef<string | null>(null);
  const advanceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const toastTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const saveTimers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; flush: () => void }>());
  const stepKeyRef = useRef(false);

  function cellKey(holeNumber: number, entryKey: string) {
    return `${holeNumber}::${entryKey}`;
  }

  function addToast(text: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    let active = true;
    const timers = toastTimers.current;
    const pendingSaves = saveTimers.current;

    async function load() {
      const [scoresRes, mvpRes] = await Promise.all([
        supabase.from("scores").select("*").eq("tee_time_id", teeTime.id),
        supabase.from("hole_mvp").select("*").eq("tee_time_id", teeTime.id),
      ]);
      if (!active) return;
      if (scoresRes.error) {
        console.error(scoresRes.error);
        notifySaveError("scores (couldn't load)", () => load());
      }
      if (mvpRes.error) {
        console.error(mvpRes.error);
        notifySaveError("hole MVPs (couldn't load)", () => load());
      }
      setScores(toScoreMap(scoresRes.data ?? []));
      setPuttsMap(toPuttsMap(scoresRes.data ?? []));
      setMvpMap(toMvpMap(mvpRes.data ?? []));
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`scorecard-${teeTime.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores", filter: `tee_time_id=eq.${teeTime.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as ScoreRow;
          setScores((prev) => {
            const next = { ...prev, [row.player_name]: { ...prev[row.player_name] } };
            if (payload.eventType === "DELETE") {
              delete next[row.player_name][row.hole_number];
            } else {
              next[row.player_name][row.hole_number] = row.strokes;
            }
            return next;
          });
          setPuttsMap((prev) => {
            const next = { ...prev, [row.player_name]: { ...prev[row.player_name] } };
            if (payload.eventType === "DELETE") {
              delete next[row.player_name][row.hole_number];
            } else {
              next[row.player_name][row.hole_number] = row.putts;
            }
            return next;
          });

          if (payload.eventType !== "DELETE" && row.strokes != null && course) {
            const timerKey = cellKey(row.hole_number, row.player_name);
            const existing = toastTimers.current.get(timerKey);
            if (existing) clearTimeout(existing);
            const strokes = row.strokes;
            const timer = setTimeout(() => {
              toastTimers.current.delete(timerKey);
              const hole = course.holes.find((h) => h.number === row.hole_number);
              if (!hole) return;
              const diff = strokes - hole.par;
              const label = entries.find((e) => e.key === row.player_name)?.label ?? row.player_name;
              if (diff <= -3) addToast(`🤯 Albatross for ${label} on hole ${row.hole_number}!`);
              else if (diff === -2) addToast(`🦅 Eagle for ${label} on hole ${row.hole_number}!`);
              else if (diff >= 3) addToast(`💀 ${label} took a ${strokes} on hole ${row.hole_number}... yikes`);
              else if (diff === 2) addToast(`💥 Double bogey for ${label} on hole ${row.hole_number}`);
            }, 1000);
            toastTimers.current.set(timerKey, timer);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hole_mvp", filter: `tee_time_id=eq.${teeTime.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as HoleMvpRow;
          setMvpMap((prev) => {
            const next = { ...prev, [row.hole_number]: { ...prev[row.hole_number] } };
            if (payload.eventType === "DELETE") delete next[row.hole_number][row.team_name];
            else next[row.hole_number][row.team_name] = row.player_name;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      for (const pending of pendingSaves.values()) {
        clearTimeout(pending.timer);
        pending.flush();
      }
      pendingSaves.clear();
    };
    // course/entries are derived from teeTime and only need to be current at
    // subscribe time (toast labels); resubscribing the channel on every
    // render would be wasteful and isn't needed for correctness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teeTime.id]);

  useEffect(() => {
    const key = pendingFocusRef.current;
    if (!key) return;
    pendingFocusRef.current = null;
    const input = inputRefs.current.get(key);
    if (input) {
      input.focus();
      input.select();
    }
  }, [half]);

  function setScore(player: string, hole: number, value: string) {
    const strokes = value === "" ? null : Number(value);
    setScores((prev) => ({
      ...prev,
      [player]: { ...prev[player], [hole]: strokes },
    }));

    const key = `score::${cellKey(hole, player)}`;
    const pending = saveTimers.current.get(key);
    if (pending) clearTimeout(pending.timer);

    async function flush() {
      saveTimers.current.delete(key);
      const { error } = await supabase
        .from("scores")
        .upsert(
          { tee_time_id: teeTime.id, player_name: player, hole_number: hole, strokes },
          { onConflict: "tee_time_id,player_name,hole_number" }
        );
      if (error) {
        console.error(error);
        notifySaveError(`hole ${hole} score`, () => setScore(player, hole, value));
      }
    }

    const timer = setTimeout(flush, 400);
    saveTimers.current.set(key, { timer, flush });
  }

  function setPutts(player: string, hole: number, value: string) {
    const puttCount = value === "" ? null : Number(value);
    setPuttsMap((prev) => ({
      ...prev,
      [player]: { ...prev[player], [hole]: puttCount },
    }));

    const key = `putts::${cellKey(hole, player)}`;
    const pending = saveTimers.current.get(key);
    if (pending) clearTimeout(pending.timer);

    async function flush() {
      saveTimers.current.delete(key);
      const { error } = await supabase
        .from("scores")
        .upsert(
          { tee_time_id: teeTime.id, player_name: player, hole_number: hole, putts: puttCount },
          { onConflict: "tee_time_id,player_name,hole_number" }
        );
      if (error) {
        console.error(error);
        notifySaveError(`hole ${hole} putts`, () => setPutts(player, hole, value));
      }
    }

    const timer = setTimeout(flush, 400);
    saveTimers.current.set(key, { timer, flush });
  }

  async function setMvp(hole: number, teamName: string, playerName: string) {
    setMvpMap((prev) => {
      const next = { ...prev, [hole]: { ...prev[hole] } };
      if (playerName) next[hole][teamName] = playerName;
      else delete next[hole][teamName];
      return next;
    });
    if (!playerName) {
      const { error } = await supabase
        .from("hole_mvp")
        .delete()
        .eq("tee_time_id", teeTime.id)
        .eq("hole_number", hole)
        .eq("team_name", teamName);
      if (error) {
        console.error(error);
        notifySaveError("hole MVP", () => setMvp(hole, teamName, playerName));
      }
      return;
    }
    const { error } = await supabase
      .from("hole_mvp")
      .upsert(
        { tee_time_id: teeTime.id, hole_number: hole, team_name: teamName, player_name: playerName },
        { onConflict: "tee_time_id,hole_number,team_name" }
      );
    if (error) {
      console.error(error);
      notifySaveError("hole MVP", () => setMvp(hole, teamName, playerName));
    }
  }

  if (!course) return <p className="text-sm text-red-600">Unknown course.</p>;
  if (loading) return <p className="text-sm text-slate-600">Loading scorecard…</p>;

  function total(key: string, holeNumbers?: number[]) {
    const holeScores = scores[key] ?? {};
    const numbers = holeNumbers ?? Object.keys(holeScores).map(Number);
    return numbers.reduce((sum, n) => sum + (holeScores[n] ?? 0), 0);
  }

  function canEdit(entry: Entry) {
    if (currentPlayer === null) return false;
    if (isAdminPlayer(currentPlayer)) return true;
    return entry.owners.includes(currentPlayer);
  }

  const editableOrder = course.holes.flatMap((hole) =>
    entries.filter((entry) => canEdit(entry)).map((entry) => ({ hole: hole.number, key: entry.key }))
  );

  function focusCell(holeNumber: number, entryKey: string) {
    const key = cellKey(holeNumber, entryKey);
    const targetHalf: "front" | "back" = holeNumber <= 9 ? "front" : "back";
    if (targetHalf !== half) {
      pendingFocusRef.current = key;
      setHalf(targetHalf);
      return;
    }
    const input = inputRefs.current.get(key);
    if (input) {
      input.focus();
      input.select();
    }
  }

  function advanceFrom(holeNumber: number, entryKey: string) {
    const idx = editableOrder.findIndex((c) => c.hole === holeNumber && c.key === entryKey);
    const next = idx >= 0 ? editableOrder[idx + 1] : undefined;
    if (next) focusCell(next.hole, next.key);
  }

  function scheduleAdvance(holeNumber: number, entryKey: string, value: string) {
    const timerKey = cellKey(holeNumber, entryKey);
    const existing = advanceTimers.current.get(timerKey);
    if (existing) clearTimeout(existing);
    if (value === "") return;
    if (value === "1") {
      const timer = setTimeout(() => {
        advanceTimers.current.delete(timerKey);
        advanceFrom(holeNumber, entryKey);
      }, 450);
      advanceTimers.current.set(timerKey, timer);
      return;
    }
    advanceFrom(holeNumber, entryKey);
  }

  function relativeToPar(key: string) {
    const holeScores = scores[key] ?? {};
    let played = 0;
    let rel = 0;
    for (const hole of course!.holes) {
      const strokes = holeScores[hole.number];
      if (strokes == null) continue;
      played += 1;
      rel += strokes - hole.par;
    }
    return { played, rel };
  }

  function formatToPar(rel: number) {
    if (rel === 0) return "E";
    return rel > 0 ? `+${rel}` : `${rel}`;
  }

  function currentStreak(key: string) {
    const holeScores = scores[key] ?? {};
    const playedHoles = course!.holes.filter((h) => holeScores[h.number] != null);
    let streak = 0;
    for (let i = playedHoles.length - 1; i >= 0; i--) {
      const h = playedHoles[i];
      if (holeScores[h.number]! - h.par <= 0) streak++;
      else break;
    }
    return streak;
  }

  function scoreMarkClass(strokes: number | null, par: number, editable: boolean) {
    if (strokes == null) {
      return editable
        ? "rounded-lg border-slate-300 bg-white"
        : "rounded-lg border-slate-200 bg-slate-50 text-slate-500";
    }
    const diff = strokes - par;
    if (diff <= -2) {
      return "rounded-full border-2 border-slate-900 ring-2 ring-slate-900 ring-offset-1 bg-white text-red-600 font-bold";
    }
    if (diff === -1) {
      return "rounded-full border-2 border-slate-900 bg-white text-red-600 font-semibold";
    }
    if (diff === 0) {
      return "rounded-lg border-slate-300 bg-white text-slate-900";
    }
    if (diff === 1) {
      return "rounded-none border-2 border-slate-900 bg-white text-slate-900";
    }
    return "rounded-none border-2 border-slate-900 ring-2 ring-slate-900 ring-offset-1 bg-white text-slate-900 font-bold";
  }

  const visibleHoles = half === "front" ? course.holes.slice(0, 9) : course.holes.slice(9);
  const visibleNumbers = visibleHoles.map((h) => h.number);
  const visiblePar = visibleHoles.reduce((sum, h) => sum + h.par, 0);
  const subtotalLabel = half === "front" ? "OUT" : "IN";

  const mvpTally = Object.values(mvp).reduce<Record<string, number>>((acc, byTeam) => {
    for (const name of Object.values(byTeam)) acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const mvpLeaders = Object.entries(mvpTally).sort((a, b) => b[1] - a[1]);

  const standings = entries.map((e) => ({ key: e.key, ...relativeToPar(e.key) }));
  const playedStandings = standings.filter((s) => s.played > 0);
  const minRel = playedStandings.length > 0 ? Math.min(...playedStandings.map((s) => s.rel)) : null;
  const leaderKeys = new Set(playedStandings.filter((s) => s.rel === minRel).map((s) => s.key));

  const selectedHole = course.holes.find((h) => h.number === selectedHoleNumber) ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl bg-slate-100 shadow-sm">
      <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            {t.text}
          </div>
        ))}
      </div>
      {!currentPlayer && (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Sign in above to enter your own score. You can still view everyone else&apos;s live.
        </p>
      )}

      <div className="flex gap-2 border-b border-slate-200 p-2">
        <button
          onClick={() => setHalf("front")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            half === "front" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Front 9
        </button>
        <button
          onClick={() => setHalf("back")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            half === "back" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Back 9
        </button>
      </div>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2.5 text-left font-medium text-slate-500">Hole</th>
            <th className="px-3 py-2.5 text-left font-medium text-slate-500">Par</th>
            <th className="px-3 py-2.5 text-left font-medium text-slate-500">Yds</th>
            {entries.map((entry) => {
              const streak = currentStreak(entry.key);
              return (
                <th
                  key={entry.key}
                  className={`px-3 py-2.5 text-left font-medium ${
                    canEdit(entry) ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  <div>
                    {entry.label}
                    {canEdit(entry) && " (you)"}
                    {streak >= 3 && (
                      <span title={`${streak} holes par-or-better in a row`}> 🔥{streak}</span>
                    )}
                  </div>
                  {entry.sublabel && (
                    <div className="text-[10px] font-normal text-slate-500">{entry.sublabel}</div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleHoles.map((hole) => (
            <tr key={hole.number} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
              <td className="p-1.5">
                <button
                  onClick={() => setSelectedHoleNumber(hole.number)}
                  className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-1.5 font-semibold text-emerald-800 ring-1 ring-emerald-200 transition-colors active:bg-emerald-100"
                >
                  {hole.number}
                  <ChevronRight size={16} strokeWidth={2.5} className="text-emerald-600" />
                </button>
              </td>
              <td className="px-3 py-2.5 text-slate-500">{hole.par}</td>
              <td className="px-3 py-2.5 text-slate-500">{hole.yards}</td>
              {entries.map((entry) => {
                const editable = canEdit(entry);
                const value = scores[entry.key]?.[hole.number] ?? null;
                const markClass = scoreMarkClass(value, hole.par, editable);
                return (
                  <td key={entry.key} className="px-1.5 py-1.5">
                    <input
                      ref={(el) => {
                        const key = cellKey(hole.number, entry.key);
                        if (el) inputRefs.current.set(key, el);
                        else inputRefs.current.delete(key);
                      }}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={15}
                      disabled={!editable}
                      value={value ?? ""}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        stepKeyRef.current = e.key === "ArrowUp" || e.key === "ArrowDown";
                      }}
                      onChange={(e) => {
                        setScore(entry.key, hole.number, e.target.value);
                        if (!stepKeyRef.current) {
                          scheduleAdvance(hole.number, entry.key, e.target.value);
                        }
                        stepKeyRef.current = false;
                      }}
                      className={`h-9 w-9 border-2 p-0 text-center text-sm transition-colors ${markClass}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-slate-200 font-semibold text-slate-900">
            <td className="px-3 py-2.5">{subtotalLabel}</td>
            <td className="px-3 py-2.5">{visiblePar}</td>
            <td className="px-3 py-2.5"></td>
            {entries.map((entry) => (
              <td key={entry.key} className="px-3 py-2.5">
                {total(entry.key, visibleNumbers)}
              </td>
            ))}
          </tr>
          <tr className="bg-slate-300 font-semibold text-slate-900">
            <td className="px-3 py-2.5">Total</td>
            <td className="px-3 py-2.5">{course.par}</td>
            <td className="px-3 py-2.5"></td>
            {entries.map((entry) => {
              const isLeader = isScramble && leaderKeys.has(entry.key);
              const { played, rel } = relativeToPar(entry.key);
              return (
                <td
                  key={entry.key}
                  className={`px-3 py-2.5 ${isLeader ? "rounded-md bg-amber-200 text-amber-900" : ""}`}
                >
                  {total(entry.key)}
                  {isScramble && played > 0 && (
                    <span className="ml-1 text-xs font-normal">
                      ({formatToPar(rel)}){isLeader && " 🏆"}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {isScramble && mvpLeaders.length > 0 && (
        <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Hole MVPs: </span>
          {mvpLeaders.map(([name, count], i) => (
            <span key={name}>
              {i > 0 && " · "}
              {name} ({count})
            </span>
          ))}
        </div>
      )}

      {selectedHole && (
        <HoleDetailSheet
          hole={selectedHole}
          entries={entries}
          scores={Object.fromEntries(entries.map((e) => [e.key, scores[e.key]?.[selectedHole.number] ?? null]))}
          putts={Object.fromEntries(entries.map((e) => [e.key, putts[e.key]?.[selectedHole.number] ?? null]))}
          mvp={mvp[selectedHole.number] ?? {}}
          isScramble={isScramble}
          canEdit={canEdit}
          onSetScore={(player, value) => setScore(player, selectedHole.number, value)}
          onSetPutts={(player, value) => setPutts(player, selectedHole.number, value)}
          onSetMvp={(teamName, playerName) => setMvp(selectedHole.number, teamName, playerName)}
          onClose={() => setSelectedHoleNumber(null)}
        />
      )}
    </div>
  );
}
