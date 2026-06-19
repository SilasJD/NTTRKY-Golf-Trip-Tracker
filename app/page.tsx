import { Flag, Trophy, Target, DollarSign, Award, ChevronRight } from "lucide-react";
import { GlobalNavigate } from "@/components/GlobalNavigate";
import { PhotosLink } from "@/components/PhotosLink";
import { MountainSkyline } from "@/components/MountainSkyline";

const sections = [
  {
    href: "/scorecard",
    icon: Flag,
    title: "Scorecard",
    description: "Hole-by-hole score entry for the round",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "Leaderboard",
    description: "Live round standings and trip totals",
  },
  {
    href: "/skins",
    icon: Target,
    title: "Skins",
    description: "Skins won and money on the line",
  },
  {
    href: "/costs",
    icon: DollarSign,
    title: "Costs",
    description: "Green fees, side bets, and trip expenses",
  },
  {
    href: "/awards",
    icon: Award,
    title: "Awards",
    description: "End-of-round stats and trash talk",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-slate-300">
      <header className="relative overflow-hidden bg-emerald-950 px-6 py-9 text-white">
        <MountainSkyline className="absolute inset-x-0 bottom-0 h-14 w-full text-emerald-400" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold tracking-tight">NTTRKY Golf Trip</h1>
          <p className="mt-1 text-sm text-white/60">Utah · July 2026</p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-3 p-4">
        <GlobalNavigate />
        <PhotosLink />
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.href}
              href={section.href}
              className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 shadow-sm transition active:bg-slate-200"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-base font-semibold text-slate-900">{section.title}</span>
                <span className="text-sm text-slate-600">{section.description}</span>
              </span>
              <ChevronRight size={18} className="text-slate-600" />
            </a>
          );
        })}
      </main>
    </div>
  );
}
