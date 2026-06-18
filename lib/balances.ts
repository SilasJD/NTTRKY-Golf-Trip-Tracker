import { type Expense } from "@/lib/supabase/client";

export type Settlement = { from: string; to: string; amount: number };

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
