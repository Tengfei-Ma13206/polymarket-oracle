"use client";

import { useEffect, useState } from "react";

interface Props {
  yesPrice: number;
  animated?: boolean;
}

export function ProbabilityBar({ yesPrice, animated = true }: Props) {
  const [width, setWidth] = useState(animated ? 0 : yesPrice * 100);
  const yesPct = Math.round(yesPrice * 100);
  const noPct  = 100 - yesPct;

  useEffect(() => {
    if (!animated) return;
    const t = setTimeout(() => setWidth(yesPrice * 100), 80);
    return () => clearTimeout(t);
  }, [yesPrice, animated]);

  const color =
    yesPct >= 65 ? "bg-emerald-500" :
    yesPct <= 35 ? "bg-rose-500"    :
                   "bg-amber-400";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className={yesPct >= 50 ? "text-emerald-400" : "text-slate-400"}>
          YES {yesPct}%
        </span>
        <span className={noPct >= 50 ? "text-rose-400" : "text-slate-400"}>
          NO {noPct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
