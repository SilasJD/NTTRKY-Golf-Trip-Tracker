"use client";

import { useEffect, useState } from "react";
import { supabase, type ScoreRow, type TeeTime } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

type Props = {
  teeTime: TeeTime;
};

type ScoreMap = Record<string, Record<number, number | null>>;

function toScoreMap(rows: ScoreRow[]): ScoreMap {
  const map: ScoreMap = {};
  for (const row of rows) {
    map[row.player_name] ??= {};
    map[row.player_name][row.hole_number] = row.strokes;
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
  const { player: currentPlayer } = useCurrentPlayer();
  const [scores, setScores] = useState<ScoreMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("scores")
        .select("*")
        .eq("tee_time_id", teeTime.id);
      if (!active) return;
      if (error) console.error(error);
      setScores(toScoreMap(data ?? []));
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`scores-${teeTime.id}`)
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
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
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

  if (!course) return <p className="text-sm text-red-600">Unknown course.</p>;
  if (loading) return <p className="text-sm text-zinc-400">Loading scorecard…</p>;

  function total(key: string) {
    const holeScores = scores[key] ?? {};
    return Object.values(holeScores).reduce((sum: number, v) => sum + (v ?? 0), 0);
  }

  function canEdit(entry: Entry) {
    return currentPlayer !== null && entry.owners.includes(currentPlayer);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      {!currentPlayer && (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Sign in above to enter your own score. You can still view everyone else&apos;s live.
        </p>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Hole</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Par</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Yds</th>
            {entries.map((entry) => (
              <th
                key={entry.key}
                className={`px-3 py-2 text-left font-medium ${
                  canEdit(entry) ? "text-green-700" : "text-zinc-500"
                }`}
              >
                <div>
                  {entry.label}
                  {canEdit(entry) && " (you)"}
                </div>
                {entry.sublabel && (
                  <div className="text-[10px] font-normal text-zinc-400">{entry.sublabel}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {course.holes.map((hole) => (
            <tr key={hole.number} className="border-b border-zinc-100">
              <td className="px-3 py-2 font-medium text-zinc-900">{hole.number}</td>
              <td className="px-3 py-2 text-zinc-500">{hole.par}</td>
              <td className="px-3 py-2 text-zinc-500">{hole.yards}</td>
              {entries.map((entry) => {
                const editable = canEdit(entry);
                return (
                  <td key={entry.key} className="px-1.5 py-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={15}
                      disabled={!editable}
                      value={scores[entry.key]?.[hole.number] ?? ""}
                      onChange={(e) => setScore(entry.key, hole.number, e.target.value)}
                      className={`w-12 rounded-md border px-2 py-1 text-center ${
                        editable
                          ? "border-zinc-300 bg-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-400"
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-zinc-50 font-semibold text-zinc-900">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2">{course.par}</td>
            <td className="px-3 py-2"></td>
            {entries.map((entry) => (
              <td key={entry.key} className="px-3 py-2">
                {total(entry.key)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
