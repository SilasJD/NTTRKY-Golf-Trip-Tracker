"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type ScoreRow, type HoleMvpRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

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

function toMvpMap(rows: HoleMvpRow[]): MvpMap {
  const map: MvpMap = {};
  for (const row of rows) {
    map[row.hole_number] ??= {};
    map[row.hole_number][row.team_name] = row.player_name;
  }
  return map;
}

type Entry = { key: string; label: string; sublabel?: string; owners: string[] };

function getEntries(teeTime: TeeTime): Entry[] {
  if (teeTime.format === "scramble" && teeTime.teams.length > 0) {
    return teeTime.teams.map((t) => ({
      key: t.name,
      label: t.name,
      sublabel: t.players.join(" & "),
      owners: t.players,
    }));
  }
  return teeTime.players.map((p) => ({ key: p, label: p, owners: [p] }));
}

export function ScoreGrid({ teeTime }: Props) {
  const course = getCourse(teeTime.course_slug);
  const entries = getEntries(teeTime);
  const isScramble = teeTime.format === "scramble" && teeTime.teams.length > 0;
  const { player: currentPlayer } = useCurrentPlayer();
  const [scores, setScores] = useState<ScoreMap>({});
  const [mvp, setMvpMap] = useState<MvpMap>({});
  const [loading, setLoading] = useState(true);
  const [half, setHalf] = useState<"front" | "back">("front");
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastId = useRef(0);

  function addToast(text: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const [scoresRes, mvpRes] = await Promise.all([
        supabase.from("scores").select("*").eq("tee_time_id", teeTime.id),
        supabase.from("hole_mvp").select("*").eq("tee_time_id", teeTime.id),
      ]);
      if (!active) return;
      if (scoresRes.error) console.error(scoresRes.error);
      if (mvpRes.error) console.error(mvpRes.error);
      setScores(toScoreMap(scoresRes.data ?? []));
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

          if (payload.eventType !== "DELETE" && row.strokes != null && course) {
            const hole = course.holes.find((h) => h.number === row.hole_number);
            if (hole) {
              const diff = row.strokes - hole.par;
              const label = entries.find((e) => e.key === row.player_name)?.label ?? row.player_name;
              if (diff <= -3) addToast(`🤯 Albatross for ${label} on hole ${row.hole_number}!`);
              else if (diff === -2) addToast(`🦅 Eagle for ${label} on hole ${row.hole_number}!`);
              else if (diff >= 3) addToast(`💀 ${label} took a ${row.strokes} on hole ${row.hole_number}... yikes`);
              else if (diff === 2) addToast(`💥 Double bogey for ${label} on hole ${row.hole_number}`);
            }
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
    };
    // course/entries are derived from teeTime and only need to be current at
    // subscribe time (toast labels); resubscribing the channel on every
    // render would be wasteful and isn't needed for correctness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teeTime.id]);

  async function setScore(player: string, hole: number, value: string) {
    const strokes = value === "" ? null : Number(value);
    setScores((prev) => ({
      ...prev,
      [player]: { ...prev[player], [hole]: strokes },
    }));
    const { error } = await supabase
      .from("scores")
      .upsert(
        { tee_time_id: teeTime.id, player_name: player, hole_number: hole, strokes },
        { onConflict: "tee_time_id,player_name,hole_number" }
      );
    if (error) console.error(error);
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
      if (error) console.error(error);
      return;
    }
    const { error } = await supabase
      .from("hole_mvp")
      .upsert(
        { tee_time_id: teeTime.id, hole_number: hole, team_name: teamName, player_name: playerName },
        { onConflict: "tee_time_id,hole_number,team_name" }
      );
    if (error) console.error(error);
  }

  if (!course) return <p className="text-sm text-red-600">Unknown course.</p>;
  if (loading) return <p className="text-sm text-zinc-400">Loading scorecard…</p>;

  function total(key: string, holeNumbers?: number[]) {
    const holeScores = scores[key] ?? {};
    const numbers = holeNumbers ?? Object.keys(holeScores).map(Number);
    return numbers.reduce((sum, n) => sum + (holeScores[n] ?? 0), 0);
  }

  function canEdit(entry: Entry) {
    return currentPlayer !== null && entry.owners.includes(currentPlayer);
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

  function scoreMarkClass(strokes: number | null, par: number) {
    if (strokes == null) return "rounded-md border-zinc-300 bg-white";
    const diff = strokes - par;
    if (diff <= -2) {
      return "rounded-full border-2 border-amber-600 ring-2 ring-amber-600 ring-offset-1 bg-amber-100 text-amber-900 font-bold";
    }
    if (diff === -1) {
      return "rounded-full border-2 border-green-700 bg-green-100 text-green-900 font-semibold";
    }
    if (diff === 0) {
      return "rounded-md border-zinc-300 bg-white text-zinc-900";
    }
    if (diff === 1) {
      return "rounded-none border-2 border-orange-600 bg-orange-100 text-orange-900";
    }
    return "rounded-none border-2 border-red-700 ring-2 ring-red-700 ring-offset-1 bg-red-100 text-red-900 font-bold";
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

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
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

      <div className="flex gap-2 border-b border-zinc-200 p-2">
        <button
          onClick={() => setHalf("front")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
            half === "front" ? "bg-green-700 text-white" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Front 9
        </button>
        <button
          onClick={() => setHalf("back")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
            half === "back" ? "bg-green-700 text-white" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Back 9
        </button>
      </div>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Hole</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Par</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Yds</th>
            {entries.map((entry) => {
              const streak = currentStreak(entry.key);
              return (
                <th
                  key={entry.key}
                  className={`px-3 py-2 text-left font-medium ${
                    canEdit(entry) ? "text-green-700" : "text-zinc-500"
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
                    <div className="text-[10px] font-normal text-zinc-400">{entry.sublabel}</div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleHoles.map((hole) => (
            <tr key={hole.number} className="border-b border-zinc-100">
              <td className="px-3 py-2 font-medium text-zinc-900">{hole.number}</td>
              <td className="px-3 py-2 text-zinc-500">{hole.par}</td>
              <td className="px-3 py-2 text-zinc-500">{hole.yards}</td>
              {entries.map((entry) => {
                const editable = canEdit(entry);
                const value = scores[entry.key]?.[hole.number] ?? null;
                const markClass = isScramble
                  ? scoreMarkClass(value, hole.par)
                  : editable
                    ? "rounded-md border-zinc-300 bg-white"
                    : "rounded-md border-zinc-200 bg-zinc-50 text-zinc-400";
                return (
                  <td key={entry.key} className="px-1.5 py-1.5">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={15}
                        disabled={!editable}
                        value={value ?? ""}
                        onChange={(e) => setScore(entry.key, hole.number, e.target.value)}
                        className={`h-9 w-9 border-2 p-0 text-center text-sm ${markClass} ${
                          !editable && value == null ? "text-zinc-400" : ""
                        }`}
                      />
                      {isScramble && (
                        <select
                          value={mvp[hole.number]?.[entry.key] ?? ""}
                          onChange={(e) => setMvp(hole.number, entry.key, e.target.value)}
                          className="w-12 rounded-md border border-zinc-200 bg-white px-0.5 py-0.5 text-[10px] text-zinc-500"
                        >
                          <option value="">MVP</option>
                          {entry.owners.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-zinc-50 font-semibold text-zinc-900">
            <td className="px-3 py-2">{subtotalLabel}</td>
            <td className="px-3 py-2">{visiblePar}</td>
            <td className="px-3 py-2"></td>
            {entries.map((entry) => (
              <td key={entry.key} className="px-3 py-2">
                {total(entry.key, visibleNumbers)}
              </td>
            ))}
          </tr>
          <tr className="bg-zinc-100 font-semibold text-zinc-900">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2">{course.par}</td>
            <td className="px-3 py-2"></td>
            {entries.map((entry) => {
              const isLeader = isScramble && leaderKeys.has(entry.key);
              const { played, rel } = relativeToPar(entry.key);
              return (
                <td
                  key={entry.key}
                  className={`px-3 py-2 ${isLeader ? "rounded-md bg-amber-200 text-amber-900" : ""}`}
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
        <div className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Hole MVPs: </span>
          {mvpLeaders.map(([name, count], i) => (
            <span key={name}>
              {i > 0 && " · "}
              {name} ({count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
