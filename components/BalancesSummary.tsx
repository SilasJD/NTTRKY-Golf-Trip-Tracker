"use client";

import { useState } from "react";
import { type Expense, type TeeTime, type ScoreRow } from "@/lib/supabase/client";
import { computeBalances, computeSkinsBalances, mergeBalances, simplifyDebts, totalPaidByPlayer } from "@/lib/balances";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

type Props = {
  expenses: Expense[];
  venmoMap: Record<string, string>;
  teeTimes: TeeTime[];
  scores: ScoreRow[];
  skinsBuyIn: number;
};

function venmoPayUrl(username: string | undefined, amount: number) {
  if (!username) return "venmo://";
  const params = new URLSearchParams({
    txn: "pay",
    recipients: username,
    amount: amount.toFixed(2),
    note: "NTTRKY Golf Trip",
  });
  return `venmo://paycharge?${params.toString()}`;
}

function buildShareText(settlements: ReturnType<typeof simplifyDebts>) {
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const lines =
    settlements.length > 0
      ? settlements.map((s) => `${s.from} owes ${s.to}: $${s.amount.toFixed(2)}`)
      : ["Everyone's settled up!"];
  return [`NTTRKY Golf Trip — Balances`, dateStr, "", ...lines, "", "Shared from NTTRKY Golf Trip Tracker"].join(
    "\n"
  );
}

export function BalancesSummary({ expenses, venmoMap, teeTimes, scores, skinsBuyIn }: Props) {
  const { player: currentPlayer } = useCurrentPlayer();
  const [copied, setCopied] = useState(false);
  const expenseBalances = computeBalances(expenses);
  const skinsBalances = computeSkinsBalances(teeTimes, scores, skinsBuyIn);
  const balances = mergeBalances(expenseBalances, skinsBalances);
  const settlements = simplifyDebts(balances);
  const shareText = buildShareText(settlements);

  const totalsPaid = totalPaidByPlayer(expenses);
  const bigSpender = Object.entries(totalsPaid).sort((a, b) => b[1] - a[1])[0];

  const myDebts = currentPlayer ? settlements.filter((s) => s.from === currentPlayer) : [];
  const myTotal = myDebts.reduce((sum, s) => sum + s.amount, 0);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl bg-slate-100 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Balances</p>
          <p className="text-[10px] text-slate-500">Includes expenses + skins</p>
        </div>
        <button
          onClick={share}
          className="rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      {bigSpender && (
        <p className="mb-3 text-xs text-slate-500">
          Big Spender: <span className="font-semibold text-slate-700">{bigSpender[0]}</span> ($
          {bigSpender[1].toFixed(2)})
        </p>
      )}

      {myDebts.length > 0 && (
        <div className="mb-3 rounded-lg bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">
            You owe ${myTotal.toFixed(2)} total
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {myDebts.map((s, i) => (
              <p key={i} className="text-xs text-emerald-700">
                ${s.amount.toFixed(2)} to {s.to}
              </p>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 ? (
        <p className="text-sm text-slate-600">Everyone&apos;s settled up!</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {settlements.map((s, i) => {
            const isMine = s.from === currentPlayer;
            const handle = venmoMap[s.to];
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-semibold text-slate-900">{s.from}</span>
                  <span className="text-slate-600"> owes </span>
                  <span className="font-semibold text-slate-900">{s.to}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">${s.amount.toFixed(2)}</span>
                  {isMine && (
                    <a
                      href={venmoPayUrl(handle, s.amount)}
                      className="rounded-full bg-[#3D95CE] px-2 py-0.5 text-[10px] font-semibold text-white"
                    >
                      Pay
                    </a>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
