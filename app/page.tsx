import { GlobalNavigate } from "@/components/GlobalNavigate";
import { PhotosLink } from "@/components/PhotosLink";
import { MountainSkyline } from "@/components/MountainSkyline";
import { TripCountdown } from "@/components/TripCountdown";
import { sections } from "@/lib/sections";

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
        <TripCountdown />
        <GlobalNavigate />
        <div className="grid grid-cols-2 gap-3">
          <PhotosLink />
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.href}
                href={section.href}
                className={`flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl p-3 shadow-md transition active:scale-95 ${section.tile}`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ${section.badge}`}
                >
                  <Icon size={28} strokeWidth={2.25} />
                </span>
                <span className="text-sm font-semibold text-slate-900">{section.title}</span>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
