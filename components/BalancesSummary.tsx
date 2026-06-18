"use client";

import { useState } from "react";
import { type Expense } from "@/lib/supabase/client";
import { computeBalances, simplifyDebts, totalPaidByPlayer } from "@/lib/balances";
import { useCurrentPlayer } from "@/lib/useCurrentPlayer";

type Props = {
  expenses: Expense[];
  venmoMap: Record<string, string>;
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

export function BalancesSummary({ expenses, venmoMap }: Props) {
  const { player: currentPlayer } = useCurrentPlayer();
  const [copied, setCopied] = useState(false);
  const balances = computeBalances(expenses);
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">Balances</p>
        <button
          onClick={share}
          className="rounded-lg border border-green-700 px-3 py-1.5 text-sm font-semibold text-green-700"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      {bigSpender && (
        <p className="mb-3 text-xs text-amber-700">
          💸 Big Spender: <span className="font-semibold">{bigSpender[0]}</span> (${bigSpender[1].toFixed(2)}
          )
        </p>
      )}

      {myDebts.length > 0 && (
        <div className="mb-3 rounded-lg border border-green-700 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-900">
            You owe ${myTotal.toFixed(2)} total
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {myDebts.map((s, i) => (
              <p key={i} className="text-xs text-green-800">
                ${s.amount.toFixed(2)} to {s.to}
              </p>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 ? (
        <p className="text-sm text-zinc-600">Everyone&apos;s settled up!</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {settlements.map((s, i) => {
            const isMine = s.from === currentPlayer;
            const handle = venmoMap[s.to];
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-semibold text-zinc-900">{s.from}</span>
                  <span className="text-zinc-600"> owes </span>
                  <span className="font-semibold text-zinc-900">{s.to}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-green-700">${s.amount.toFixed(2)}</span>
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
