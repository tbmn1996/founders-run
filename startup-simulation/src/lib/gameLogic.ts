// ============================================================================
// VCM Startup-Simulation — Spiel-Logik
// Reine Funktionen: Zufallsauswahl, Werte-Anwendung, Scoring, Founder-Typ.
// Keine UI, keine Seiteneffekte → leicht testbar.
// ============================================================================

import {
  ALLOCATION,
  CASH_BANDS,
  CRISIS,
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

/** Deterministischer PRNG: gleicher Seed -> gleicher Zahlenstrom. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stabiler 32-bit-Hash für slot-gekeyte Zufallsziehungen. */
export function hashSlot(runSeed: number, key: string): number {
  let hash = 0x811C9DC5;
  const input = `${runSeed}:${key}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Fisher-Yates-Shuffle (kopiert, mutiert das Original nicht). */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Slot =
  | { id: "p1" | "p2" | "p3" | "p4" | "p5"; kind: "decision"; phase: number }
  | { id: "verein" | "markt"; kind: "event"; category: EventCategory }
  | { id: "alloc"; kind: "alloc" }
  | { id: typeof CRISIS.slotId; kind: "crisis" };

export type Step =
  | { kind: "decision"; scenario: Scenario }
  | { kind: "event"; event: LuckEvent }
  | { kind: "alloc" }
  | { kind: "crisis"; scenario: Scenario };

const NORMAL_SLOTS: Slot[] = [
  { id: "p1", kind: "decision", phase: 1 },
  { id: "verein", kind: "event", category: "verein" },
  { id: "p2", kind: "decision", phase: 2 },
  { id: "p3", kind: "decision", phase: 3 },
  { id: "alloc", kind: "alloc" },
  { id: "p4", kind: "decision", phase: 4 },
  { id: "markt", kind: "event", category: "markt" },
  { id: "p5", kind: "decision", phase: 5 },
];

const CRISIS_SLOT: Slot = { id: CRISIS.slotId, kind: "crisis" };

/**
 * Leitet die Slot-Reihenfolge aus der abgeschlossenen History ab.
 * S2 bleibt konstant bei 8 Slots; S3/S4 erweitern diese reine Ableitung.
 */
export function deriveSlots(completed: CompletedStep[]): Slot[] {
  const crisisIndex = completed.findIndex((step) => step.kind === "crisis");
  if (crisisIndex !== -1) {
    return [
      ...NORMAL_SLOTS.slice(0, crisisIndex),
      CRISIS_SLOT,
      ...NORMAL_SLOTS.slice(crisisIndex),
    ];
  }

  const lastCompleted = completed.at(-1);
  const canInsertBeforeNextNormalSlot = completed.length < NORMAL_SLOTS.length;
  if (
    completed.length > 0 &&
    lastCompleted?.kind !== "crisis" &&
    canInsertBeforeNextNormalSlot &&
    deriveRunState(completed).cashRaw < CRISIS.triggerCash
  ) {
    return [
      ...NORMAL_SLOTS.slice(0, completed.length),
      CRISIS_SLOT,
      ...NORMAL_SLOTS.slice(completed.length),
    ];
  }

  return NORMAL_SLOTS;
}

function pickBySeed<T>(pool: T[], runSeed: number, key: string): T {
  if (pool.length === 0) {
    throw new Error(`Kein Inhalt für Slot-Key "${key}" gefunden.`);
  }
  const rng = mulberry32(hashSlot(runSeed, key));
  return pool[Math.floor(rng() * pool.length)];
}

export function resolveStep(runSeed: number, slot: Slot): Step {
  if (slot.kind === "alloc") {
    return { kind: "alloc" };
  }

  if (slot.kind === "crisis") {
    const pool = SCENARIOS.filter((s) => s.phase === "krise");
    const scenario = pickBySeed(pool, runSeed, `${slot.id}:pick`);
    const optionsRng = mulberry32(hashSlot(runSeed, `${slot.id}:options:${scenario.id}`));
    return {
      kind: "crisis",
      scenario: { ...scenario, options: shuffle(scenario.options, optionsRng) },
    };
  }

  if (slot.kind === "event") {
    const pool = LUCK_EVENTS.filter((e) => e.category === slot.category);
    return {
      kind: "event",
      event: pickBySeed(pool, runSeed, `${slot.id}:event`),
    };
  }

  const pool = SCENARIOS.filter((s) => s.phase === slot.phase);
  const scenario = pickBySeed(pool, runSeed, `${slot.id}:pick`);
  const optionsRng = mulberry32(hashSlot(runSeed, `${slot.id}:options:${scenario.id}`));
  return {
    kind: "decision",
    scenario: { ...scenario, options: shuffle(scenario.options, optionsRng) },
  };
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
  kind: "decision" | "crisis";
  scenario: Scenario;
  chosen: Option;
  /** Alternativen, die NICHT gewählt wurden (für den Rückblick). */
  alternatives: Option[];
}

export type CompletedStep =
  | { kind: "decision"; scenario: Scenario; chosen: Option }
  | { kind: "event"; event: LuckEvent }
  | { kind: "alloc"; amounts: number[] }
  | { kind: "crisis"; scenario: Scenario; chosen: Option };

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
    if (step.kind === "decision" || step.kind === "crisis") {
      cashRaw += step.chosen.effects.cash ?? 0;
      stats = applyEffects(stats, step.chosen.effects);
      points += step.chosen.points;
      records.push({
        kind: step.kind,
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
