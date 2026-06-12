// ============================================================================
// VCM Startup-Simulation — Spiel-Logik
// Reine Funktionen: Zufallsauswahl, Werte-Anwendung, Scoring, Founder-Typ.
// Keine UI, keine Seiteneffekte → leicht testbar.
// ============================================================================

import {
  ALLOCATION,
  CASH_BANDS,
  FOUNDER_TYPES,
  INITIAL_STATS,
  LUCK_EVENTS,
  PHASES,
  SCENARIOS,
  type CashBandKey,
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
 *   + Geld-Bonus auf Basis von cash / 2000.
 *   + Harte Strafe −30, wenn cash ≤ 0.
 */
export function computeScore(stats: Stats, decisionPoints: number): number {
  const pillars = SCORED_KEYS.reduce((sum, k) => sum + stats[k], 0);
  const runwayBonus = stats.cash > 0 ? Math.round(stats.cash / 2000) : -30;
  return Math.round(decisionPoints + pillars / 2 + runwayBonus);
}

/**
 * Berechnet den verfügbaren Verteil-Topf aus dem aktuellen Cash-Stand.
 * Granularität jetzt 500er-Schritte (Slider), Maximum bleibt €18.000.
 */
export function computeAllocationPot(cash: number): number {
  return Math.min(
    ALLOCATION.maxPot,
    Math.floor(cash / 500) * 500
  );
}

/**
 * Wendet eine vollständige Allokations-Entscheidung auf den Stats-Stand an.
 * amounts[i] ist der Betrag in Euro, der in den i-ten Bucket fließt (beliebige
 * 500er-Vielfache). Gain je Bucket = Math.round(amount / 3000 * gainPer3000),
 * Gesamtbetrag wird von cash abgezogen (min. 0).
 */
export function applyAllocation(stats: Stats, amounts: number[]): Stats {
  const next: Stats = { ...stats };
  let totalSpent = 0;
  amounts.forEach((amt, i) => {
    const bucket = ALLOCATION.buckets[i];
    if (!bucket) return;
    // Gain proportional zu €3.000-Einheiten — identisches Ergebnis bei altem €3k-Stepper,
    // aber jetzt auch für 500er-Zwischenwerte korrekt.
    const gain = Math.round((amt / 3000) * ALLOCATION.gainPer3000);
    next[bucket.stat] = Math.max(0, next[bucket.stat] + gain);
    totalSpent += amt;
  });
  next.cash = Math.max(0, next.cash - totalSpent);
  return next;
}

export function cashBand(cash: number): CashBandKey {
  if (cash >= CASH_BANDS.solid.min) return "solid";
  if (cash >= CASH_BANDS.strained.min) return "strained";
  return "critical";
}

export function isOptionLocked(option: Option, cash: number): boolean {
  const cashEffect = option.effects.cash ?? 0;
  return cashEffect < 0 && -cashEffect > cash;
}

/**
 * Formatiert einen Geld-Betrag nach deutschem Stil.
 * Negative Beträge behalten ihr Vorzeichen: "−€8.000".
 */
export function formatMoney(v: number): string {
  const rounded = Math.round(v);
  const sign = rounded < 0 ? "−" : "";
  const amount = rounded < 0 ? -rounded : rounded;
  return `${sign}€${amount.toLocaleString("de-DE")}`;
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

export type CompletedStep =
  | { kind: "decision"; scenario: Scenario; chosen: Option }
  | { kind: "event"; event: LuckEvent }
  | { kind: "alloc"; amounts: number[] };

export interface DerivedRunState {
  stats: Stats;
  cashRaw: number;
  points: number;
  records: DecisionRecord[];
}

/**
 * Leitet den gesamten Spielstand aus der abgeschlossenen History ab.
 * Dadurch kann die UI sicher zurückspringen, ohne Stats/Punkte manuell
 * rückwärts rechnen zu müssen.
 */
export function deriveRunState(completed: CompletedStep[]): DerivedRunState {
  let stats: Stats = { ...INITIAL_STATS };
  let cashRaw = INITIAL_STATS.cash;
  let points = 0;
  const records: DecisionRecord[] = [];

  completed.forEach((step) => {
    if (step.kind === "decision") {
      cashRaw += step.chosen.effects.cash ?? 0;
      stats = applyEffects(stats, step.chosen.effects);
      points += step.chosen.points;
      records.push({
        scenario: step.scenario,
        chosen: step.chosen,
        alternatives: step.scenario.options.filter((o) => o.id !== step.chosen.id),
      });
      return;
    }

    if (step.kind === "event") {
      cashRaw += step.event.effects.cash ?? 0;
      stats = applyEffects(stats, step.event.effects);
      return;
    }

    const spent = step.amounts.reduce((sum, amount) => sum + amount, 0);
    cashRaw -= spent;
    stats = applyAllocation(stats, step.amounts);
    if (spent > 0) points += ALLOCATION.bonusPoints;
  });

  return { stats, cashRaw, points, records };
}

export { INITIAL_STATS, PHASES };
