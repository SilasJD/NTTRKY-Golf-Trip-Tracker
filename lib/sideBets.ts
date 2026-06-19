import { type SideBet } from "@/lib/supabase/client";

export function computeSideBetBalances(bets: SideBet[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const bet of bets) {
    if (!bet.winner) continue;
    const losers = bet.participants.filter((p) => p !== bet.winner);
    if (losers.length === 0) continue;
    balances[bet.winner] = (balances[bet.winner] ?? 0) + bet.amount * losers.length;
    for (const loser of losers) {
      balances[loser] = (balances[loser] ?? 0) - bet.amount;
    }
  }
  return balances;
}
