"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { type ToastItem, subscribeToasts, dismissToast } from "@/lib/toast";

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.tone === "error" ? "bg-red-600" : "bg-slate-900"
          }`}
        >
          {t.tone === "error" && <AlertTriangle size={16} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
          {t.retry && (
            <button
              onClick={() => {
                t.retry?.();
                dismissToast(t.id);
              }}
              className="shrink-0 rounded-md bg-white/20 px-2 py-1 text-xs font-semibold active:bg-white/30"
            >
              Retry
            </button>
          )}
          <button onClick={() => dismissToast(t.id)} className="shrink-0 text-white/70 active:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
