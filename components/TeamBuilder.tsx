"use client";

import { type Team } from "@/lib/supabase/client";

type Props = {
  players: string[];
  teams: Team[];
  onChange: (teams: Team[]) => void;
};

export function TeamBuilder({ players, teams, onChange }: Props) {
  const unassigned = players.filter((p) => !teams.some((t) => t.players.includes(p)));

  function addTeam() {
    onChange([...teams, { name: `Team ${teams.length + 1}`, players: [] }]);
  }

  function removeTeam(index: number) {
    onChange(teams.filter((_, i) => i !== index));
  }

  function renameTeam(index: number, name: string) {
    onChange(teams.map((t, i) => (i === index ? { ...t, name } : t)));
  }

  function togglePlayer(teamIndex: number, player: string) {
    const target = teams[teamIndex];
    const isMember = target.players.includes(player);
    if (!isMember && target.players.length >= 3) return;

    const cleared = teams.map((t) => ({ ...t, players: t.players.filter((p) => p !== player) }));
    if (!isMember) {
      cleared[teamIndex] = { ...cleared[teamIndex], players: [...cleared[teamIndex].players, player] };
    }
    onChange(cleared);
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span>Teams (1-3 players each)</span>
        <button
          type="button"
          onClick={addTeam}
          className="rounded-lg border border-green-700 px-2 py-1 text-xs font-semibold text-green-700"
        >
          + Team
        </button>
      </div>

      {unassigned.length > 0 && (
        <p className="text-xs text-amber-600">Unassigned: {unassigned.join(", ")}</p>
      )}

      {teams.map((team, i) => (
        <div key={i} className="rounded-lg border border-zinc-200 p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={team.name}
              onChange={(e) => renameTeam(i, e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => removeTeam(i)} className="text-xs text-red-600">
              Remove
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {players.map((p) => {
              const selected = team.players.includes(p);
              const disabled = !selected && team.players.length >= 3;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => togglePlayer(i, p)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                    selected
                      ? "border-green-700 bg-green-700 text-white"
                      : disabled
                        ? "border-zinc-200 text-zinc-300"
                        : "border-zinc-300 text-zinc-700"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function validateTeams(players: string[], teams: Team[]): string | null {
  if (teams.length === 0) return "Add at least one team.";
  for (const team of teams) {
    if (team.players.length < 1 || team.players.length > 3) {
      return `${team.name || "A team"} must have 1-3 players.`;
    }
  }
  const assigned = teams.flatMap((t) => t.players);
  const unassigned = players.filter((p) => !assigned.includes(p));
  if (unassigned.length > 0) {
    return `Assign everyone to a team: ${unassigned.join(", ")} not assigned.`;
  }
  return null;
}
