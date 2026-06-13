// ============================================================================
// VCM Startup-Simulation — Spiel-Logik
// Reine Funktionen: Zufallsauswahl, Werte-Anwendung, Scoring, Founder-Typ.
// Keine UI, keine Seiteneffekte → leicht testbar.
// ============================================================================

import {
  ALLOCATION,
  ALLOC_MARKERS,
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

function sortById<T extends { id: string }>(pool: T[]): T[] {
  return [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
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

/**
 * Fokus-Marker aus einer Bucket-Verteilung ableiten (PLAN §8.8).
 * Single Source of Truth für Logik UND UI (Schwerpunkt-Hinweis in der
 * AllocationCard) — Schwellen zentral in ALLOC_MARKERS (gameData.ts).
 *
 * Dominanz: höchster Bucket ≥ minTop UND ≥ minShare des Ausgegebenen
 *           UND Abstand zum zweithöchsten ≥ minGap → fokus:<bucket>.
 * Sonst bei spent ≥ minSpentForFocus → fokus:balanced.
 * Bei kleinerer/keiner Investition → null (kein fokus-Marker).
 */
export function deriveAllocFocus(amounts: number[]): string | null {
  const spent = amounts.reduce((s, a) => s + a, 0);
  if (spent < ALLOC_MARKERS.minSpentForFocus) return null;

  const sorted = [...amounts]
    .map((amt, i) => ({ amt, i }))
    .sort((a, b) => b.amt - a.amt);
  const top = sorted[0]!;
  const second = sorted[1]!;
  const { minTop, minShare, minGap } = ALLOC_MARKERS.dominance;
  const isDominant =
    top.amt >= minTop &&
    top.amt >= minShare * spent &&
    top.amt - second.amt >= minGap;

  // Bucket-Reihenfolge entspricht ALLOCATION.buckets (siehe ALLOC_MARKERS).
  return isDominant ? ALLOC_MARKERS.bucketMarkers[top.i]! : ALLOC_MARKERS.balancedMarker;
}

export function deriveMarkers(completed: CompletedStep[]): string[] {
  const markers = new Set<string>();

  completed.forEach((step, index) => {
    // Marker aus Entscheidungs-Antworten übernehmen
    if ((step.kind === "decision" || step.kind === "crisis") && step.chosen.setsMarker) {
      markers.add(step.chosen.setsMarker);
    }

    // Alloc-Marker ableiten — aus der Verteil-Runde (S5, Budget-Wette)
    if (step.kind === "alloc") {
      const spent = step.amounts.reduce((s, a) => s + a, 0);

      // Fokus-Marker (Dominanzformel — gemeinsame Quelle mit der UI)
      const fokus = deriveAllocFocus(step.amounts);
      if (fokus) markers.add(fokus);

      // cash:discipline: spent ≤ maxSpentShare × Pot UND Cash danach ≥ minCashAfter.
      // Pot/Cash über die puren Ableitungen holen (deriveRunState ruft
      // deriveMarkers nicht auf — keine Zirkularität).
      const stateBefore = deriveRunState(completed.slice(0, index));
      const pot = computeAllocationPot(stateBefore.cashRaw);
      const stateAfter = deriveRunState(completed.slice(0, index + 1));
      const { maxSpentShare, minCashAfter } = ALLOC_MARKERS.discipline;
      if (spent <= maxSpentShare * pot && stateAfter.cashRaw >= minCashAfter) {
        markers.add(ALLOC_MARKERS.disciplineMarker);
      }
    }
  });

  return Array.from(markers).sort();
}

function pickBySeed<T>(pool: T[], runSeed: number, key: string): T {
  if (pool.length === 0) {
    throw new Error(`Kein Inhalt für Slot-Key "${key}" gefunden.`);
  }
  const rng = mulberry32(hashSlot(runSeed, key));
  return pool[Math.floor(rng() * pool.length)];
}

export function resolveStep(runSeed: number, slot: Slot, completed: CompletedStep[] = []): Step {
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
    const markers = new Set(deriveMarkers(completed));
    const normalPool = LUCK_EVENTS.filter((e) => e.category === slot.category && !e.requiresMarker);
    let pool = normalPool;

    if (slot.id === "markt" && markers.size > 0) {
      const echoPool = sortById(
        LUCK_EVENTS.filter(
          (e) => e.category === "markt" && e.requiresMarker && markers.has(e.requiresMarker)
        )
      );
      // T4.2 hat genau einen markt-Slot; dadurch kann maximal ein markergebundenes Echo pro Run erscheinen.
      pool = echoPool.length > 0 ? echoPool : sortById(normalPool);
    }

    return {
      kind: "event",
      event: pickBySeed(pool, runSeed, `${slot.id}:event`),
    };
  }

  let pool = SCENARIOS.filter((s) => s.phase === slot.phase);

  if (slot.id === "p5") {
    const markers = new Set(deriveMarkers(completed));
    const priorityPool = markers.size > 0
      ? sortById(
          SCENARIOS.filter(
            (s) => s.phase === 5 && s.requiresMarker && markers.has(s.requiresMarker)
          )
        )
      : [];
    const fallbackPool = markers.size > 0
      ? sortById(SCENARIOS.filter((s) => s.phase === 5 && !s.requiresMarker))
      : SCENARIOS.filter((s) => s.phase === 5 && !s.requiresMarker);
    pool = priorityPool.length > 0 ? priorityPool : fallbackPool;
  }

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
  /** Allokations-Daten für den Rückblick. Nur gesetzt, wenn die Verteil-Runde abgeschlossen wurde. */
  allocation?: {
    /** Investierter Betrag je Bucket in Euro. */
    amounts: number[];
    /** Summe aller investierten Beträge. */
    spent: number;
    /** Nicht investierter Rest (Rücklage). */
    reserve: number;
  };
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
  // Alloc-Daten für den Recap — werden befüllt, sobald der alloc-Step verarbeitet wird
  let allocData: DerivedRunState["allocation"] = undefined;

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

    // Alloc-Schritt: Investitionen aus Buckets anwenden, kein Pauschalbonus mehr (S5)
    const spent = step.amounts.reduce((sum, amount) => sum + amount, 0);
    // Pot aus aktuellem cashRaw berechnen (vor dem Abzug)
    const pot = computeAllocationPot(cashRaw);
    cashRaw -= spent;
    stats = applyAllocation(stats, step.amounts);
    // Alloc-Daten für Rückblick merken (wird am Ende gesetzt)
    allocData = { amounts: step.amounts, spent, reserve: pot - spent };
  });

  return { stats, cashRaw, points, records, allocation: allocData };
}

export { INITIAL_STATS, PHASES };
