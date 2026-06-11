"use client";

import { motion } from "framer-motion";
import { TrendingUp, Lightbulb, Users, Globe, Wallet } from "lucide-react";
import type { Stats, StatKey } from "@/lib/gameData";
import { STAT_META } from "@/lib/gameData";
import { formatMoney } from "@/lib/gameLogic";

/**
 * Icon-Map: Lucide-Icons je Säule + Cash.
 * Labels und Farben kommen aus STAT_META, damit keine doppelten Hardcodes entstehen.
 */
const ICONS: Record<StatKey | "cash", React.ElementType> = {
  growth:     TrendingUp,
  innovation: Lightbulb,
  community:  Users,
  impact:     Globe,
  cash:       Wallet,
};

function Bar({ k, value }: { k: StatKey | "cash"; value: number }) {
  const { label, color, max } = STAT_META[k];
  const Icon = ICONS[k];
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  // Cash-Wert als formatierter Geldbetrag, Säulen als gerundete Zahl
  const displayValue = k === "cash" ? formatMoney(value) : String(Math.round(value));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1" style={{ color }}>
          <Icon size={13} strokeWidth={2.4} />
          <span style={{ color: "var(--muted)" }}>{label}</span>
        </span>
        <span style={{ color: "var(--foreground)" }} className="font-semibold tabular-nums">
          {displayValue}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-3)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function StatBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      <Bar k="growth"     value={stats.growth} />
      <Bar k="innovation" value={stats.innovation} />
      <Bar k="community"  value={stats.community} />
      <Bar k="impact"     value={stats.impact} />
      <div className="col-span-2 mt-0.5">
        <Bar k="cash" value={stats.cash} />
      </div>
    </div>
  );
}
