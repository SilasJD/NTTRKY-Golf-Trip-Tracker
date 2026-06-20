import Link from "next/link";
import { type LucideIcon } from "lucide-react";

type Props = {
  title: string;
  icon: LucideIcon;
  badge: string;
};

export function PageHeader({ title, icon: Icon, badge }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/" className="text-sm text-emerald-700">
        ← Home
      </Link>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${badge}`}>
          <Icon size={22} strokeWidth={2.25} />
        </span>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      </div>
    </div>
  );
}
