import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { itinerary } from "@/lib/itinerary";

export default function ItineraryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 bg-slate-300 p-4">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Itinerary</h1>

      <div className="flex flex-col gap-3">
        {itinerary.map((day) => (
          <div key={day.date} className="rounded-2xl bg-slate-100 p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-emerald-700">{day.label}</p>
            <ul className="flex flex-col gap-1.5">
              {day.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-900">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
