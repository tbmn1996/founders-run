"use client";

import { motion } from "framer-motion";
import { TrendingUp, Lightbulb, Users, Globe, Wallet } from "lucide-react";
import type { CashBandKey, Stats, StatKey } from "@/lib/gameData";
import { CASH_BANDS, STAT_META } from "@/lib/gameData";
import { cashBand, formatMoney } from "@/lib/gameLogic";

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

const CASH_BAND_COLORS: Record<CashBandKey, string> = {
  solid: "var(--foreground)",
  strained: "#f59e0b",
  critical: "var(--error)",
};

const CASH_BAND_BACKGROUNDS: Record<CashBandKey, string> = {
  solid: "rgba(237,235,232,0.10)",
  strained: "rgba(245,158,11,0.14)",
  critical: "rgba(248,113,113,0.14)",
};

function Bar({ k, value }: { k: StatKey | "cash"; value: number }) {
  const band = k === "cash" ? cashBand(value) : null;
  const { label, color: metaColor, max } = STAT_META[k];
  const color = band ? CASH_BAND_COLORS[band] : metaColor;
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
          {band && (
            <span
              className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: CASH_BAND_BACKGROUNDS[band], color }}
            >
              {CASH_BANDS[band].label}
            </span>
          )}
        </span>
        <span style={{ color }} className="font-semibold tabular-nums">
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
