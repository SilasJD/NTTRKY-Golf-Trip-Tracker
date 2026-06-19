import { type Expense, type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { getCourse } from "@/lib/courses";
import { computeRoundSkins, aggregateSkinsByPlayer, allParticipants, toScoreMap } from "@/lib/skins";

export type Settlement = { from: string; to: string; amount: number };

export function mergeBalances(...maps: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const map of maps) {
    for (const [name, amount] of Object.entries(map)) {
      merged[name] = (merged[name] ?? 0) + amount;
    }
  }
  return merged;
}

export function computeSkinsBalances(
  teeTimes: TeeTime[],
  scores: ScoreRow[],
  buyIn: number
): Record<string, number> {
  const byTeeTime: Record<string, ScoreRow[]> = {};
  for (const row of scores) (byTeeTime[row.tee_time_id] ??= []).push(row);

  const rounds = teeTimes
    .map((teeTime) => {
      const course = getCourse(teeTime.course_slug);
      if (!course) return null;
      const scoreMap = toScoreMap(byTeeTime[teeTime.id] ?? []);
      return { teeTime, skins: computeRoundSkins(teeTime, course, scoreMap) };
    })
    .filter((r): r is { teeTime: TeeTime; skins: ReturnType<typeof computeRoundSkins> } => r !== null);

  const skinsByPlayer = aggregateSkinsByPlayer(rounds);
  const totalSkins = Object.values(skinsByPlayer).reduce((sum, n) => sum + n, 0);
  const pot = totalSkins * buyIn;

  const participants = allParticipants(teeTimes);
  if (participants.length === 0 || pot === 0) return {};

  const ante = pot / participants.length;
  const balances: Record<string, number> = {};
  for (const player of participants) {
    balances[player] = (skinsByPlayer[player] ?? 0) * buyIn - ante;
  }
  return balances;
}

export function computeBalances(expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const expense of expenses) {
    balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + expense.amount;
    const share = expense.amount / expense.split_among.length;
    for (const person of expense.split_among) {
      balances[person] = (balances[person] ?? 0) - share;
    }
  }
  return balances;
}

export function totalPaidByPlayer(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const expense of expenses) {
    totals[expense.paid_by] = (totals[expense.paid_by] ?? 0) + expense.amount;
  }
  return totals;
}

export function simplifyDebts(balances: Record<string, number>): Settlement[] {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.005)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.005)
    .map(([name, amount]) => ({ name, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;
    settlements.push({ from: debtor.name, to: creditor.name, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.005) i++;
    if (creditor.amount < 0.005) j++;
  }
  return settlements;
}
