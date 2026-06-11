// ============================================================================
// VCM Startup-Simulation — Spiel-Logik
// Reine Funktionen: Zufallsauswahl, Werte-Anwendung, Scoring, Founder-Typ.
// Keine UI, keine Seiteneffekte → leicht testbar.
// ============================================================================

import {
  ALLOCATION,
  FOUNDER_TYPES,
  INITIAL_STATS,
  LUCK_EVENTS,
  PHASES,
  SCENARIOS,
  type EventCategory,
  type FounderType,
  type LuckEvent,
  type Option,
  type Scenario,
  type StatKey,
  type Stats,
} from "./gameData";

export const SCORED_KEYS: StatKey[] = ["growth", "innovation", "community", "impact"];

/** Fisher-Yates-Shuffle (kopiert, mutiert das Original nicht). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Stellt einen frischen Durchlauf zusammen: pro Phase genau EIN zufälliges
 * Szenario. Optionen-Reihenfolge wird ebenfalls gemischt, damit Position
 * nichts verrät.
 */
export function buildRun(): Scenario[] {
  return PHASES.map((phase) => {
    const pool = SCENARIOS.filter((s) => s.phase === phase.n);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return { ...picked, options: shuffle(picked.options) };
  });
}

/**
 * Liefert ein zufälliges Glücks-Event aus dem angegebenen Kategorie-Pool.
 * Ersetzt das alte pickLuckEvents(n) — die Kategorie (verein/markt) steuert,
 * aus welchem Teilpool gezogen wird.
 */
export function pickLuckEvent(category: EventCategory): LuckEvent {
  const pool = LUCK_EVENTS.filter((e) => e.category === category);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Wendet Effekt-Deltas auf die Werte an. Cash und Säulen dürfen nicht unter 0. */
export function applyEffects(stats: Stats, effects: Partial<Stats>): Stats {
  const next: Stats = { ...stats };
  (Object.keys(effects) as (keyof Stats)[]).forEach((k) => {
    next[k] = Math.max(0, next[k] + (effects[k] ?? 0));
  });
  return next;
}

/**
 * Gesamtscore = Summe der Entscheidungs-Punkte
 *   + Bonus aus den vier Säulen / 2 (damit Entscheidungen dominieren)
 *   + Runway-Bonus auf Basis von cash / 2000 (Quelle: HTML-Prototyp score()).
 *   + Harte Strafe −30, wenn cash ≤ 0.
 */
export function computeScore(stats: Stats, decisionPoints: number): number {
  const pillars = SCORED_KEYS.reduce((sum, k) => sum + stats[k], 0);
  const runwayBonus = stats.cash > 0 ? Math.round(stats.cash / 2000) : -30;
  return Math.round(decisionPoints + pillars / 2 + runwayBonus);
}

/**
 * Berechnet den verfügbaren Verteil-Topf aus dem aktuellen Cash-Stand.
 * Entspricht der pot-Formel aus dem HTML-Prototyp:
 *   Math.min(18000, Math.floor(cash / 3000) * 3000)
 */
export function computeAllocationPot(cash: number): number {
  return Math.min(
    ALLOCATION.maxPot,
    Math.floor(cash / ALLOCATION.step) * ALLOCATION.step
  );
}

/**
 * Wendet eine vollständige Allokations-Entscheidung auf den Stats-Stand an.
 * amounts[i] ist der Betrag (in Schritten à ALLOCATION.step), der in den
 * i-ten Bucket geflossen ist. Je Schritt: +gainPerStep auf den Ziel-Stat,
 * Gesamtbetrag wird von cash abgezogen (min. 0).
 */
export function applyAllocation(stats: Stats, amounts: number[]): Stats {
  const next: Stats = { ...stats };
  let totalSpent = 0;
  amounts.forEach((amt, i) => {
    const bucket = ALLOCATION.buckets[i];
    if (!bucket) return;
    const steps = Math.floor(amt / ALLOCATION.step);
    next[bucket.stat] = Math.max(0, next[bucket.stat] + steps * ALLOCATION.gainPerStep);
    totalSpent += amt;
  });
  next.cash = Math.max(0, next.cash - totalSpent);
  return next;
}

/**
 * Formatiert einen Geld-Betrag nach deutschem Stil.
 * Entspricht money() im HTML-Prototyp: "€" + Math.round(|v|).toLocaleString("de-DE")
 */
export function formatMoney(v: number): string {
  return "€" + Math.round(Math.abs(v)).toLocaleString("de-DE");
}

/**
 * Founder-Typ aus der stärksten Säule. Liegen die Top-Werte sehr nah
 * beieinander (Spannweite ≤ 8), gilt der/die Allrounder:in.
 */
export function determineFounderType(stats: Stats): FounderType {
  const entries = SCORED_KEYS.map((k) => ({ k, v: stats[k] }));
  const max = Math.max(...entries.map((e) => e.v));
  const min = Math.min(...entries.map((e) => e.v));
  if (max - min <= 8) return FOUNDER_TYPES.balanced;
  const top = entries.reduce((a, b) => (b.v > a.v ? b : a));
  return FOUNDER_TYPES[top.k];
}

export interface DecisionRecord {
  scenario: Scenario;
  chosen: Option;
  /** Alternativen, die NICHT gewählt wurden (für den Rückblick). */
  alternatives: Option[];
}

export { INITIAL_STATS, PHASES };
