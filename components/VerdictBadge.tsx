import type { Verdict } from "@/lib/types";

const CONFIG: Record<Verdict, { label: string; icon: string; cls: string }> = {
  BULLISH:   { label: "Bullish",   icon: "↑", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-emerald-500/20" },
  BEARISH:   { label: "Bearish",   icon: "↓", cls: "bg-rose-500/20    text-rose-300    border-rose-500/40    ring-rose-500/20"    },
  UNCERTAIN: { label: "Uncertain", icon: "~", cls: "bg-amber-500/20   text-amber-300   border-amber-500/40   ring-amber-500/20"   },
  MIXED:     { label: "Mixed",     icon: "±", cls: "bg-blue-500/20    text-blue-300    border-blue-500/40    ring-blue-500/20"    },
};

interface Props { verdict: Verdict }

export function VerdictBadge({ verdict }: Props) {
  const { label, icon, cls } = CONFIG[verdict] ?? CONFIG.UNCERTAIN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                      text-sm font-bold border ring-2 ring-offset-2 ring-offset-slate-900
                      animate-fade-in ${cls}`}>
      <span className="text-base leading-none">{icon}</span>
      {label}
    </span>
  );
}
