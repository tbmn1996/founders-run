// ============================================================================
// VCM Startup-Simulation — Spieldaten
// ----------------------------------------------------------------------------
// Alle Inhalte des Spiels (Szenario, Runden/Phasen, Entscheidungen, Glücks-
// Events, Founder-Typen) leben hier. Reines Daten-Modul ohne UI — so kann der
// Venture Club die Fragen pflegen, ohne Logik oder Layout anzufassen.
//
// Design-Prinzipien (aus der Planung):
//  - KEIN perfekter Durchlauf: jede Option hat Trade-offs.
//  - Schlechte Entscheidungen dürfen NEGATIVE Punkte geben.
//  - Pro Phase wird EINE Frage zufällig aus einem Pool gezogen → bleibt frisch.
//  - Glück ist Bestandteil, aber klein gegenüber Entscheidungen.
//
// B2B-Pivot (Stand: 06/2026):
//  - Mira ist KI-Assistentin für Service- und Vertriebsteams in Unternehmen.
//  - Skalierbares B2B-SaaS, seat-basiert — kein Friseursalon, kein Café.
//  - Münster bleibt Heimatmarkt (VCM-Lokalkolorit).
// ============================================================================

export type StatKey = "growth" | "innovation" | "community" | "impact";

/** Kategorie eines Glücks-Events. */
export type EventCategory = "verein" | "markt";

/** Die vier bewerteten Säulen + Cash als Überlebens-Ressource. */
export interface Stats {
  growth: number;
  innovation: number;
  community: number;
  impact: number;
  cash: number;
}

/**
 * Marker-Vokabular für vorbereitete Konsequenz-Bezüge.
 * Quelle: content/marker.tsv.
 */
export interface MarkerDef {
  id: string;
  label: string;
  description: string;
}

export interface Option {
  id: string;
  label: string;
  /** Veränderungen der Werte (Trade-offs). Nicht genannte Werte = 0. */
  effects: Partial<Stats>;
  /** Punkte für diese Entscheidung (darf negativ sein). */
  points: number;
  /** Kurze Lern-/Konsequenz-Erklärung — der "Aha"-Moment. */
  outcome: string;
  /** Optionaler Marker aus content/marker.tsv, den diese Antwort setzt. */
  setsMarker?: string;
}

export interface Scenario {
  id: string;
  /** 1-basierte Phasen-Nummer (Bezug zu PHASES) oder Sondersituation. */
  phase: number | "krise";
  title: string;
  situation: string;
  options: Option[];
  /** Optionaler Marker aus content/marker.tsv, den dieses Szenario voraussetzt. */
  requiresMarker?: string;
  /** Optionaler Bezugstext aus der TSV-Spalte "bezug". */
  referenceText?: string;
}

export interface LuckEvent {
  id: string;
  title: string;
  text: string;
  effects: Partial<Stats>;
  /** Herkunft des Events: Vereins-Event oder Markt-Event. */
  category: EventCategory;
  /** Optionaler Marker aus content/marker.tsv, den dieses Event voraussetzt. */
  requiresMarker?: string;
  /** Optionaler Bezugstext aus der TSV-Spalte "bezug". */
  referenceText?: string;
}

export interface FounderType {
  key: StatKey | "balanced";
  name: string;
  tagline: string;
  description: string;
  emoji: string;
}

export type CashBandKey = "solid" | "strained" | "critical";

export const CASH_BANDS: Record<
  CashBandKey,
  { label: string; min: number }
> = {
  solid:    { label: "Solide",     min: 10000 },
  strained: { label: "Angespannt", min: 5000 },
  critical: { label: "Kritisch",   min: 0 },
};

export const CRISIS = {
  /** Unterhalb dieser ungeclampeten Cash-Grenze wird max. einmal pro Lauf die Krise eingefügt. */
  triggerCash: 3000,
  slotId: "crisis:runway",
  maxPerRun: 1,
} as const;

// ---------------------------------------------------------------------------
// Stat-Metadaten: Label, Emoji, Maximalwert je Säule/Cash.
// Quelle: STAT-Objekt im HTML-Prototyp.
// ---------------------------------------------------------------------------
export const STAT_META: Record<
  StatKey | "cash",
  { label: string; emoji: string; max: number; color: string }
> = {
  growth:     { label: "Growth",     emoji: "📈", max: 80,     color: "#ff5e00" },
  innovation: { label: "Innovation", emoji: "💡", max: 80,     color: "#ffc857" },
  community:  { label: "Community",  emoji: "🤝", max: 80,     color: "#5ec8ff" },
  impact:     { label: "Impact",     emoji: "🌍", max: 80,     color: "#4ade80" },
  cash:       { label: "Geld",       emoji: "💶", max: 120000, color: "#f87171" },
};

// ---------------------------------------------------------------------------
// Allokations-Runde: Parameter und Bereiche (Verteil-Runde nach Phase 5).
// Quelle: pot=Math.min(18000,...) und buckets-Array im HTML-Prototyp.
// ---------------------------------------------------------------------------
export interface AllocationBucket {
  label: string;
  stat: StatKey;
  emoji: string;
}

export const ALLOCATION = {
  /** Maximaler Topf, der verteilt werden kann. */
  maxPot: 18000,
  /** Slider-Granularität in Euro (500er-Schritte). */
  step: 500,
  /** Stat-Punkte je €3.000, die in einen Bucket fließen. */
  gainPer3000: 4,
  /** Feste Bonus-Punkte fürs Abschließen der Verteil-Runde. */
  bonusPoints: 12,
  buckets: [
    { label: "Bessere KI & Produkt",         stat: "innovation" as StatKey, emoji: "💡" },
    { label: "Werbung & Reichweite",          stat: "growth"     as StatKey, emoji: "📣" },
    { label: "Team & Community",              stat: "community"  as StatKey, emoji: "🤝" },
    { label: "Verantwortung & Datenschutz",   stat: "impact"     as StatKey, emoji: "🛡️" },
  ] as AllocationBucket[],
};

// ---------------------------------------------------------------------------
// Spielinhalte werden aus der generierten Datei re-exportiert.
// Quellen: content/*.tsv → scripts/generate-content.mjs → gameContent.generated.ts
// Änderungen an Inhalten (Szenarien, Events, Texte) bitte in den TSV-Dateien vornehmen,
// nicht hier. Nach Änderungen: npm run generate (oder npm run dev/build).
// ---------------------------------------------------------------------------
export {
  SCENARIOS,
  LUCK_EVENTS,
  FOUNDER_TYPES,
  SCENARIO_INTRO,
  PHASES,
  MARKERS,
} from "./gameContent.generated";

/** Startwerte. Cash in Euro. Quelle: INIT im HTML-Prototyp. */
export const INITIAL_STATS: Stats = {
  growth:     20,
  innovation: 20,
  community:  20,
  impact:     20,
  cash:       20000,
};
