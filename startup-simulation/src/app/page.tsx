"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  ChevronDown,
  Check,
  X,
  Minus,
  Plus,
} from "lucide-react";
import StatBar from "@/components/StatBar";
import {
  ALLOCATION,
  FOUNDER_TYPES,
  INITIAL_STATS,
  PHASES,
  SCENARIO_INTRO,
  STAT_META,
  type EventCategory,
  type LuckEvent,
  type Option,
  type Scenario,
  type StatKey,
  type Stats,
} from "@/lib/gameData";
import {
  applyAllocation,
  applyEffects,
  buildRun,
  computeAllocationPot,
  computeScore,
  determineFounderType,
  formatMoney,
  pickLuckEvent,
  SCORED_KEYS,
  type DecisionRecord,
} from "@/lib/gameLogic";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

type Screen = "intro" | "sim" | "result";

/** Ein Schritt in der Spielzeitachse. */
type Step =
  | { kind: "decision"; scenario: Scenario }
  | { kind: "event"; event: LuckEvent }
  | { kind: "alloc" };

// ---------------------------------------------------------------------------
// Zeitachse
// ---------------------------------------------------------------------------

/**
 * Baut die feste 8-Schritte-Reihenfolge:
 *   [decision(P1), event(verein), decision(P2), decision(P3),
 *    alloc, decision(P4), event(markt), decision(P5)]
 * Events werden mit pickLuckEvent nach Kategorie gezogen.
 */
function buildTimeline(): Step[] {
  const run = buildRun(); // 5 Szenarien, je eins pro Phase
  const evVerein = pickLuckEvent("verein" as EventCategory);
  const evMarkt = pickLuckEvent("markt" as EventCategory);
  return [
    { kind: "decision", scenario: run[0] },
    { kind: "event",    event: evVerein },
    { kind: "decision", scenario: run[1] },
    { kind: "decision", scenario: run[2] },
    { kind: "alloc" },
    { kind: "decision", scenario: run[3] },
    { kind: "event",    event: evMarkt },
    { kind: "decision", scenario: run[4] },
  ];
}

// ---------------------------------------------------------------------------
// Hilfkomponente: Effekt-Chips
// ---------------------------------------------------------------------------

/**
 * Zeigt Werte-Deltas als farbige Badges.
 * Cash-Beträge werden mit formatMoney gerendert (z. B. „−€8.000").
 */
function EffectChips({ effects }: { effects: Partial<Stats> }) {
  const keys = Object.keys(effects) as (keyof Stats)[];
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => {
        const v = effects[k] ?? 0;
        if (v === 0) return null;
        const pos = v > 0;
        // Cash-Werte in Geldformat, Säulen als Zahl
        const label =
          k === "cash"
            ? `${pos ? "+" : "−"}${formatMoney(v)} ${STAT_META[k].label}`
            : `${pos ? "+" : ""}${v} ${STAT_META[k].label}`;
        return (
          <span
            key={k}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
            style={{
              background: pos ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
              color: pos ? "var(--success)" : "var(--error)",
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente: Game
// ---------------------------------------------------------------------------

export default function Game() {
  const [screen, setScreen]   = useState<Screen>("intro");
  const [timeline, setTimeline] = useState<Step[]>([]);
  const [step, setStep]       = useState(0);
  const [stats, setStats]     = useState<Stats>(INITIAL_STATS);
  const [points, setPoints]   = useState(0);
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  /** Gewählte Option — steuert Feedback-Panel in DecisionCard. */
  const [chosen, setChosen]   = useState<Option | null>(null);

  function startGame() {
    setTimeline(buildTimeline());
    setStep(0);
    setStats(INITIAL_STATS);
    setPoints(0);
    setRecords([]);
    setChosen(null);
    setScreen("sim");
  }

  function choose(scenario: Scenario, option: Option) {
    setStats((s) => applyEffects(s, option.effects));
    setPoints((p) => p + option.points);
    setRecords((r) => [
      ...r,
      {
        scenario,
        chosen: option,
        alternatives: scenario.options.filter((o) => o.id !== option.id),
      },
    ]);
    setChosen(option);
  }

  /**
   * Schließt die aktuelle Karte (nach Feedback, Event, Alloc) und wechselt
   * zum nächsten Schritt oder zum Ergebnis-Screen.
   */
  function advance() {
    setChosen(null);
    const next = step + 1;
    if (next >= timeline.length) {
      setScreen("result");
    } else {
      // Glücks-Event-Effekte beim Betreten anwenden
      const upcoming = timeline[next];
      if (upcoming.kind === "event") {
        setStats((s) => applyEffects(s, upcoming.event.effects));
      }
      setStep(next);
    }
  }

  /**
   * Callback für AllocationCard: nimmt Betrags-Array entgegen,
   * wendet es auf Stats an und fügt Bonus-Punkte hinzu.
   */
  function finishAlloc(amounts: number[]) {
    setStats((s) => applyAllocation(s, amounts));
    setPoints((p) => p + ALLOCATION.bonusPoints);
    advance();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <AnimatePresence mode="wait">
        {screen === "intro" && <Intro key="intro" onStart={startGame} />}
        {screen === "sim" && (
          <Sim
            key={`sim-${step}-${chosen ? "fb" : "q"}`}
            step={timeline[step]}
            stepIndex={step}
            total={timeline.length}
            stats={stats}
            chosen={chosen}
            onChoose={choose}
            onAdvance={advance}
            onFinishAlloc={finishAlloc}
          />
        )}
        {screen === "result" && (
          <Result
            key="result"
            stats={stats}
            points={points}
            records={records}
            onRestart={startGame}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------

/** Einstiegsscreen mit Startup-Contacts-Logo und Mira-Pitch aus SCENARIO_INTRO. */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col justify-center gap-6"
    >
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/logos/startup-contacts.png"
          alt="Startup Contacts"
          width={180}
          height={60}
          unoptimized
          className="object-contain"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label flex items-center gap-1.5">
          <Sparkles size={13} /> Venture Club Münster · Founder&apos;s Run
        </span>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.03em]">
          Gründe dein Startup.
          <br />
          <span className="gradient-accent-text">Jede Entscheidung zählt.</span>
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          5 Runden, echte Gründer-Dilemmata, keine perfekte Lösung. In ~3 Minuten
          erlebst du, wie sich deine Entscheidungen auswirken — und welcher
          Founder-Typ du bist.
        </p>
      </div>

      {/* Szenario-Karte aus SCENARIO_INTRO */}
      <div className="glass-card p-5">
        <span className="section-label">Dein Szenario</span>
        <h2 className="mt-2 text-xl font-bold tracking-[-0.02em]">
          {SCENARIO_INTRO.startup}{" "}
          <span style={{ color: "var(--muted)" }} className="text-sm font-medium">
            · {SCENARIO_INTRO.oneLiner}
          </span>
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--foreground)" }}>
          {SCENARIO_INTRO.pitch}
        </p>
        <div className="mt-4 flex flex-col gap-1.5">
          {SCENARIO_INTRO.conditions.map((c) => (
            <div key={c} className="flex items-start gap-2 text-[12px]">
              <span style={{ color: "var(--accent)" }}>▸</span>
              <span style={{ color: "var(--muted)" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="btn btn-primary flex items-center justify-center gap-2 py-3.5 text-[15px]"
      >
        Simulation starten <ArrowRight size={18} />
      </button>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Sim-Container
// ---------------------------------------------------------------------------

/** Rahmen für alle Sim-Schritte: Fortschrittsbalken, StatBar, aktuelle Karte. */
function Sim({
  step,
  stepIndex,
  total,
  stats,
  chosen,
  onChoose,
  onAdvance,
  onFinishAlloc,
}: {
  step: Step;
  stepIndex: number;
  total: number;      // = 8 Schritte
  stats: Stats;
  chosen: Option | null;
  onChoose: (s: Scenario, o: Option) => void;
  onAdvance: () => void;
  onFinishAlloc: (amounts: number[]) => void;
}) {
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col gap-4"
    >
      {/* Fortschritt über 8 Schritte */}
      <div className="flex flex-col gap-2">
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--ci-orange), var(--ci-red))" }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Werte */}
      <div className="glass-card p-4">
        <StatBar stats={stats} />
      </div>

      {step.kind === "event" ? (
        <EventCard event={step.event} onAdvance={onAdvance} />
      ) : step.kind === "alloc" ? (
        <AllocationCard stats={stats} onFinish={onFinishAlloc} />
      ) : (
        <DecisionCard
          scenario={step.scenario}
          chosen={chosen}
          onChoose={onChoose}
          onAdvance={onAdvance}
        />
      )}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// DecisionCard
// ---------------------------------------------------------------------------

function DecisionCard({
  scenario,
  chosen,
  onChoose,
  onAdvance,
}: {
  scenario: Scenario;
  chosen: Option | null;
  onChoose: (s: Scenario, o: Option) => void;
  onAdvance: () => void;
}) {
  const phase = PHASES.find((p) => p.n === scenario.phase);
  return (
    <div className="flex flex-1 flex-col">
      <span className="section-label">
        Phase {scenario.phase}/5 · {phase?.name}
      </span>
      <h2 className="mt-1.5 text-[22px] font-bold leading-snug tracking-[-0.02em]">
        {scenario.title}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {scenario.situation}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {scenario.options.map((o) => {
          const isChosen = chosen?.id === o.id;
          const dimmed = chosen && !isChosen;
          return (
            <button
              key={o.id}
              disabled={!!chosen}
              onClick={() => onChoose(scenario, o)}
              className="btn glass-card-inner flex items-center justify-between gap-3 p-3.5 text-left text-[13.5px] font-medium"
              style={{
                opacity: dimmed ? 0.4 : 1,
                borderColor: isChosen ? "var(--accent)" : "transparent",
                borderWidth: 1.5,
                borderStyle: "solid",
              }}
            >
              <span>{o.label}</span>
              {isChosen && <Check size={16} style={{ color: "var(--accent)" }} />}
            </button>
          );
        })}
      </div>

      {/* Feedback-Panel nach der Wahl */}
      <AnimatePresence>
        {chosen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 glass-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="section-label">Konsequenz</span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
                style={{
                  background:
                    chosen.points >= 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                  color: chosen.points >= 0 ? "var(--success)" : "var(--error)",
                }}
              >
                {chosen.points >= 0 ? "+" : ""}
                {chosen.points} Punkte
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed">{chosen.outcome}</p>
            <div className="mt-3">
              <EffectChips effects={chosen.effects} />
            </div>
            <button
              onClick={onAdvance}
              className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-[14px]"
            >
              Weiter <ArrowRight size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------

/** Badge-Label je Kategorie: Verein-Events vs. Markt-Events. */
const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  verein: "Venture Club Münster",
  markt:  "Markt",
};

function EventCard({ event, onAdvance }: { event: LuckEvent; onAdvance: () => void }) {
  const catLabel = EVENT_CATEGORY_LABEL[event.category];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card flex flex-1 flex-col justify-center p-6 text-center"
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "rgba(255,94,0,0.12)" }}
      >
        <Zap size={22} style={{ color: "var(--accent)" }} />
      </div>
      {/* Kategorie-Badge */}
      <span
        className="mx-auto mt-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
        style={{
          background: "rgba(255,94,0,0.12)",
          color: "var(--accent)",
        }}
      >
        {catLabel}
      </span>
      <span className="section-label mt-1">Ereignis · Glück</span>
      <h2 className="mt-1 text-xl font-bold tracking-[-0.02em]">{event.title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {event.text}
      </p>
      <div className="mt-4 flex justify-center">
        <EffectChips effects={event.effects} />
      </div>
      <button
        onClick={onAdvance}
        className="btn btn-primary mt-6 flex items-center justify-center gap-2 py-3 text-[14px]"
      >
        Weiter <ArrowRight size={17} />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AllocationCard
// ---------------------------------------------------------------------------

/**
 * Verteil-Runde: Der Pot wird BEIM MOUNT aus dem aktuellen cash-Stand berechnet.
 * Drei Zustände:
 *   1. Pot < 3.000  → „Kasse fast leer"-Screen, direkt Weiter
 *   2. Verteilen    → Stepper je Bucket, „Noch zu verteilen"-Anzeige
 *   3. Bestätigt    → Effekt-Chips der Gains, Weiter-Button
 */
function AllocationCard({
  stats,
  onFinish,
}: {
  stats: Stats;
  onFinish: (amounts: number[]) => void;
}) {
  // Pot aus aktuellem Cash-Stand berechnen (nach Phase 3)
  const pot = computeAllocationPot(stats.cash);

  // amounts[i] = in Bucket i investierter Betrag (Vielfaches von ALLOCATION.step)
  const [amounts, setAmounts] = useState<number[]>(
    ALLOCATION.buckets.map(() => 0)
  );
  const [confirmed, setConfirmed] = useState(false);

  const used = amounts.reduce((s, a) => s + a, 0);
  const remaining = pot - used;

  // ---------- Zustand 1: Kasse fast leer ----------
  if (pot < ALLOCATION.step) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card flex flex-1 flex-col justify-center p-6 text-center"
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(248,113,113,0.12)" }}
        >
          <span className="text-2xl">💸</span>
        </div>
        <span className="section-label mt-3">Investitionsrunde</span>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.02em]">Kasse fast leer</h2>
        <p
          className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Gerade bleibt nichts zum Investieren übrig. Auch das ist eine Lektion:
          Ohne Geld auf dem Konto hast du keinen Spielraum.
        </p>
        {/* Weiter ohne Punkte, keine Alloc-Gewinne */}
        <button
          onClick={() => onFinish(amounts)}
          className="btn btn-primary mt-6 flex items-center justify-center gap-2 py-3 text-[14px]"
        >
          Weiter <ArrowRight size={17} />
        </button>
      </motion.div>
    );
  }

  // ---------- Zustand 3: Bestätigt ----------
  if (confirmed) {
    // Effekt-Chips: je Bucket den Gain anzeigen, Cash-Abzug
    const gains: Partial<Stats> = {};
    amounts.forEach((amt, i) => {
      const bucket = ALLOCATION.buckets[i];
      if (!bucket || amt === 0) return;
      const steps = Math.floor(amt / ALLOCATION.step);
      const key = bucket.stat as StatKey;
      gains[key] = (gains[key] ?? 0) + steps * ALLOCATION.gainPerStep;
    });
    // Cash-Abzug als negativer Wert
    if (used > 0) gains.cash = -used;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card flex flex-1 flex-col p-6"
      >
        <span className="section-label">Investitionsrunde · Abgeschlossen</span>
        <h2 className="mt-1 text-xl font-bold tracking-[-0.02em]">
          Investiert!
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Dein Kapital ist eingesetzt. So verändern sich deine Werte:
        </p>
        <div className="mt-4">
          <EffectChips effects={gains} />
        </div>
        {/* Bonus-Punkte Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
            style={{
              background: "rgba(74,222,128,0.12)",
              color: "var(--success)",
            }}
          >
            +{ALLOCATION.bonusPoints} Punkte
          </span>
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            für vollständige Investition
          </span>
        </div>
        <button
          onClick={() => onFinish(amounts)}
          className="btn btn-primary mt-6 flex items-center justify-center gap-2 py-3 text-[14px]"
        >
          Weiter <ArrowRight size={17} />
        </button>
      </motion.div>
    );
  }

  // ---------- Zustand 2: Verteilen ----------
  function adjust(i: number, delta: number) {
    setAmounts((prev) => {
      const next = [...prev];
      next[i] = next[i] + delta;
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card flex flex-1 flex-col p-5"
    >
      <span className="section-label">Investitionsrunde</span>
      <h2 className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.02em]">
        Wohin fließt dein Kapital?
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Du hast <strong>{formatMoney(pot)}</strong> zu investieren.
        Je {formatMoney(ALLOCATION.step)} bringen +{ALLOCATION.gainPerStep} Punkte auf den gewählten Bereich.
      </p>

      {/* Bucket-Zeilen */}
      <div className="mt-4 flex flex-col gap-3">
        {ALLOCATION.buckets.map((bucket, i) => {
          const canMinus = amounts[i] >= ALLOCATION.step;
          const canPlus  = remaining >= ALLOCATION.step;
          return (
            <div key={bucket.stat} className="flex items-center gap-2">
              {/* Emoji + Label */}
              <span className="text-base">{bucket.emoji}</span>
              <span
                className="flex-1 text-[13px] font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {bucket.label}
              </span>
              {/* Betrag */}
              <span
                className="w-16 text-right text-[13px] font-semibold tabular-nums"
                style={{ color: amounts[i] > 0 ? "var(--accent)" : "var(--muted)" }}
              >
                {formatMoney(amounts[i])}
              </span>
              {/* − Stepper — Touchziel ≥ 44px */}
              <button
                onClick={() => adjust(i, -ALLOCATION.step)}
                disabled={!canMinus}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: canMinus ? "var(--surface-3)" : "transparent",
                  opacity: canMinus ? 1 : 0.3,
                }}
                aria-label={`${bucket.label} verringern`}
              >
                <Minus size={16} />
              </button>
              {/* + Stepper */}
              <button
                onClick={() => adjust(i, ALLOCATION.step)}
                disabled={!canPlus}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: canPlus ? "rgba(255,94,0,0.12)" : "transparent",
                  color: canPlus ? "var(--accent)" : "var(--muted)",
                  opacity: canPlus ? 1 : 0.3,
                }}
                aria-label={`${bucket.label} erhöhen`}
              >
                <Plus size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* „Noch zu verteilen"-Anzeige */}
      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--surface-3)" }}>
        <span className="section-label">Noch zu verteilen</span>
        <span
          className="text-[15px] font-bold tabular-nums"
          style={{ color: remaining === 0 ? "var(--success)" : "var(--accent)" }}
        >
          {formatMoney(remaining)}
        </span>
      </div>

      {/* Bestätigen-Button: disabled solange remaining ≠ 0 */}
      <button
        onClick={() => setConfirmed(true)}
        disabled={remaining !== 0}
        className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-[14px]"
        style={{ opacity: remaining !== 0 ? 0.5 : 1 }}
      >
        {remaining !== 0 ? "Verteile dein ganzes Geld" : "Investieren →"}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

/**
 * Ergebnis-Screen: Founder-Typ, Score (inkl. Alloc-Bonus), Werte, Rückblick.
 * Alloc-Runde taucht im Rückblick NICHT auf (nur DecisionRecords),
 * aber die +12 Bonus-Punkte sind im points-State enthalten und fließen
 * über computeScore in den angezeigten Score ein.
 */
function Result({
  stats,
  points,
  records,
  onRestart,
}: {
  stats: Stats;
  points: number;
  records: DecisionRecord[];
  onRestart: () => void;
}) {
  const score = computeScore(stats, points);
  const type  = determineFounderType(stats);
  const [showClosing, setShowClosing] = useState(false);

  if (showClosing) return <Closing onRestart={onRestart} />;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col gap-4 py-2"
    >
      {/* Founder-Typ */}
      <div className="glass-card p-6 text-center">
        <span className="section-label">Dein Ergebnis</span>
        <div className="mt-2 text-5xl">{type.emoji}</div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">{type.name}</h1>
        <p className="mt-1 text-sm font-medium gradient-accent-text">{type.tagline}</p>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
          {type.description}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Trophy size={20} style={{ color: "var(--accent)" }} />
          <span className="text-3xl font-extrabold tabular-nums">{score}</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            Punkte
          </span>
        </div>
      </div>

      {/* Werte final */}
      <div className="glass-card p-4">
        <span className="section-label">Deine Startup-Werte</span>
        <div className="mt-3">
          <StatBar stats={stats} />
        </div>
      </div>

      {/* Rückblick — nur Entscheidungsrunden, keine Alloc-Runde */}
      <div className="flex flex-col gap-2">
        <span className="section-label px-1">Deine Entscheidungen im Rückblick</span>
        {records.map((rec, i) => (
          <RecapItem key={rec.scenario.id} rec={rec} index={i} />
        ))}
      </div>

      <button
        onClick={() => setShowClosing(true)}
        className="btn btn-primary mt-1 flex items-center justify-center gap-2 py-3.5 text-[15px]"
      >
        Weiter <ArrowRight size={18} />
      </button>
      <button
        onClick={onRestart}
        className="btn btn-glass flex items-center justify-center gap-2 py-3 text-[14px]"
      >
        <RotateCcw size={16} /> Nochmal spielen
      </button>
    </motion.section>
  );
}

function RecapItem({ rec, index }: { rec: DecisionRecord; index: number }) {
  const [open, setOpen] = useState(false);
  // index wird für künftige Nummerierung vorgehalten
  void index;
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 p-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Phase {rec.scenario.phase} · {rec.scenario.title}
          </span>
          <p className="mt-0.5 truncate text-[13px] font-semibold">
            <Check size={13} className="mr-1 inline" style={{ color: "var(--accent)" }} />
            {rec.chosen.label}
          </p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} style={{ color: "var(--muted)" }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-3.5 pb-3.5">
              {/* Gewählt */}
              <div className="glass-card-inner p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>
                    Deine Wahl
                  </span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: rec.chosen.points >= 0 ? "var(--success)" : "var(--error)" }}>
                    {rec.chosen.points >= 0 ? "+" : ""}
                    {rec.chosen.points}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px]">{rec.chosen.outcome}</p>
              </div>

              {/* Alternativen */}
              <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase" style={{ color: "var(--muted)" }}>
                Was die Alternativen gebracht hätten
              </p>
              <div className="flex flex-col gap-2">
                {rec.alternatives.map((alt) => (
                  <div key={alt.id} className="flex items-start gap-2 text-[12px]">
                    <X size={13} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
                    <div>
                      <span className="font-semibold">{alt.label}</span>{" "}
                      <span className="tabular-nums" style={{ color: alt.points >= 0 ? "var(--success)" : "var(--error)" }}>
                        ({alt.points >= 0 ? "+" : ""}
                        {alt.points})
                      </span>
                      <p className="mt-0.5" style={{ color: "var(--muted)" }}>
                        {alt.outcome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Closing
// ---------------------------------------------------------------------------

/** Abschlussfolie mit VCM-Logo und Einladung zum Venture Club Münster. */
function Closing({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col justify-center gap-6 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        {/* VCM-Logo */}
        <Image
          src="/logos/vcm.png"
          alt="Venture Club Münster"
          width={200}
          height={70}
          unoptimized
          className="object-contain"
        />
        <span className="section-label">Venture Club Münster</span>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em]">
          Vom Spieler zum{" "}
          <span className="gradient-accent-text">echten Gründer.</span>
        </h1>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Hat dir die Reise gefallen? Beim Venture Club Münster baust du genau
          das — mit echten Startups, einem starken Netzwerk und Leuten, die
          gründen wollen wie du.
        </p>
      </div>

      <div className="glass-card p-5 text-left">
        <div className="flex flex-col gap-2.5 text-[13px]">
          {[
            "Echte Startup-Projekte & Workshops",
            "Netzwerk aus Foundern, VCs & Talenten",
            "Events wie die Startup Contacts",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check size={15} style={{ color: "var(--accent)" }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl p-3 text-center" style={{ background: "rgba(255,94,0,0.1)" }}>
          <p className="text-[13px] font-semibold">
            🚀 Neuaufnahmen im <span className="gradient-accent-text">Oktober</span>
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--muted)" }}>
            Komm am Infostand vorbei & sichere dir die Infos.
          </p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="btn btn-glass flex items-center justify-center gap-2 py-3 text-[14px]"
      >
        <RotateCcw size={16} /> Nochmal spielen
      </button>
    </motion.section>
  );
}
