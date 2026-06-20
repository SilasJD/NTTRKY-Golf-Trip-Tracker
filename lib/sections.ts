import { Flag, Trophy, Target, DollarSign, Award, CalendarDays, Dices, type LucideIcon } from "lucide-react";

export type Section = {
  href: string;
  icon: LucideIcon;
  title: string;
  tile: string;
  badge: string;
};

export const sections: Section[] = [
  {
    href: "/itinerary",
    icon: CalendarDays,
    title: "Itinerary",
    tile: "bg-sky-50",
    badge: "bg-sky-700",
  },
  {
    href: "/scorecard",
    icon: Flag,
    title: "Scorecard",
    tile: "bg-emerald-50",
    badge: "bg-emerald-700",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "Leaderboard",
    tile: "bg-amber-50",
    badge: "bg-amber-600",
  },
  {
    href: "/skins",
    icon: Target,
    title: "Skins",
    tile: "bg-violet-50",
    badge: "bg-violet-700",
  },
  {
    href: "/side-bets",
    icon: Dices,
    title: "Side Bets",
    tile: "bg-rose-50",
    badge: "bg-rose-600",
  },
  {
    href: "/costs",
    icon: DollarSign,
    title: "Costs",
    tile: "bg-blue-50",
    badge: "bg-blue-700",
  },
  {
    href: "/awards",
    icon: Award,
    title: "Awards",
    tile: "bg-orange-50",
    badge: "bg-orange-600",
  },
];
