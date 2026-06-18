import { GlobalNavigate } from "@/components/GlobalNavigate";

const sections = [
  {
    href: "/scorecard",
    title: "Scorecard",
    description: "Hole-by-hole score entry for the round",
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "Live round standings and trip totals",
  },
  {
    href: "/skins",
    title: "Skins",
    description: "Skins won and money on the line",
  },
  {
    href: "/costs",
    title: "Costs",
    description: "Green fees, side bets, and trip expenses",
  },
  {
    href: "/awards",
    title: "Awards",
    description: "End-of-round stats and trash talk",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="bg-green-700 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">NTTRKY Golf Trip</h1>
        <p className="mt-1 text-green-100">Utah · July 2026</p>
      </header>
      <main className="flex flex-1 flex-col gap-3 p-4">
        <GlobalNavigate />
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm active:bg-zinc-100"
          >
            <span className="text-lg font-semibold text-zinc-900">{section.title}</span>
            <span className="text-sm text-zinc-600">{section.description}</span>
          </a>
        ))}
      </main>
    </div>
  );
}
