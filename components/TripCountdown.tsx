"use client";

import { Plane } from "lucide-react";
import { tripStartDate, tripEndDate } from "@/lib/itinerary";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function TripCountdown() {
  const today = todayStr();

  if (today > tripEndDate) return null;

  if (today >= tripStartDate) {
    const dayNumber = daysBetween(tripStartDate, today) + 1;
    const totalDays = daysBetween(tripStartDate, tripEndDate) + 1;
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-700 p-4 text-white shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Plane size={20} strokeWidth={2} />
        </span>
        <div>
          <p className="text-base font-semibold">It&apos;s go time!</p>
          <p className="text-sm text-white/80">
            Day {dayNumber} of {totalDays}
          </p>
        </div>
      </div>
    );
  }

  const days = daysBetween(today, tripStartDate);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Plane size={20} strokeWidth={2} />
      </span>
      <div>
        <p className="text-base font-semibold text-slate-900">
          {days} day{days === 1 ? "" : "s"} until Utah
        </p>
        <p className="text-sm text-slate-600">July 16-19, 2026</p>
      </div>
    </div>
  );
}
