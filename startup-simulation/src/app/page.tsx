"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
  ChevronDown,
  Check,
  X,
  Share2,
} from "lucide-react";
import StatBar from "@/components/StatBar";
import {
  ALLOCATION,
  PHASES,
  SCENARIO_INTRO,
  STAT_META,
  CASH_BANDS,
  type EventCategory,
  type LuckEvent,
  type Option,
  type Scenario,
  type StatKey,
  type Stats,
} from "@/lib/gameData";
import {
  buildRun,
  computeAllocationPot,
  computeScore,
  deriveRunState,
  determineFounderType,
  formatMoney,
  isOptionLocked,
  pickLuckEvent,
  type CompletedStep,
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas konnte nicht exportiert werden."));
    }, "image/png");
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function createShareGraphic({
  score,
  founderName,
  founderTagline,
  founderEmoji,
}: {
  score: number;
  founderName: string;
  founderTagline: string;
  founderEmoji: string;
}): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas wird nicht unterstützt.");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#141414");
  gradient.addColorStop(0.55, "#1c1c1c");
  gradient.addColorStop(1, "#2a1710");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  const glow = ctx.createRadialGradient(180, 180, 0, 180, 180, 560);
  glow.addColorStop(0, "rgba(247,108,7,0.34)");
  glow.addColorStop(1, "rgba(247,108,7,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1080);

  const vcmLogo = await loadImage("/logos/vcm-transparent.png");
  ctx.drawImage(vcmLogo, 250, 156, 580, 237);

  ctx.fillStyle = "#edebe8";
  ctx.textAlign = "center";
  ctx.font = "700 42px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("FOUNDER'S RUN", 540, 520);

  roundedRect(ctx, 116, 650, 848, 850, 56);
  ctx.fillStyle = "rgba(28,28,28,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "150px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(founderEmoji, 540, 850);

  ctx.fillStyle = "#f5f5f5";
  ctx.font = "800 70px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(founderName, 540, 990);

  ctx.fillStyle = "#ff7a1a";
  ctx.font = "700 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(founderTagline, 540, 1050);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 168px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(String(score), 540, 1244);

  ctx.fillStyle = "#888888";
  ctx.font = "600 42px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("PUNKTE", 540, 1312);

  const accent = ctx.createLinearGradient(240, 1408, 840, 1408);
  accent.addColorStop(0, "#f76c07");
  accent.addColorStop(1, "#fe281f");
  ctx.fillStyle = accent;
  roundedRect(ctx, 240, 1396, 600, 8, 4);
  ctx.fill();

  ctx.fillStyle = "#edebe8";
  ctx.font = "600 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Gründe Mira in 3 Minuten.", 540, 1610);
  ctx.fillStyle = "#888888";
  ctx.font = "500 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Startup Contacts · Venture Club Münster", 540, 1660);

  const blob = await canvasToBlob(canvas);
  return new File([blob], "founders-run-ergebnis.png", { type: "image/png" });
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
        // Cash-Werte ohne doppeltes Geld-Label.
        const label =
          k === "cash"
            ? `${STAT_META[k].label} ${pos ? "+" : ""}${formatMoney(v)}`
            : `${STAT_META[k].label} ${pos ? "+" : ""}${v}`;
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
  const [screen, setScreen] = useState<Screen>("intro");
  const [timeline, setTimeline] = useState<Step[]>([]);
  const [completed, setCompleted] = useState<CompletedStep[]>([]);
  /** Temporäre Wahl — steuert Feedback-Panel, wird erst beim Weiterklicken committet. */
  const [chosen, setChosen] = useState<Option | null>(null);

  const { stats, cashRaw, points, records } = useMemo(
    () => deriveRunState(completed),
    [completed]
  );
  const step = completed.length;
  const currentStep = timeline[step];

  function startGame() {
    setTimeline(buildTimeline());
    setCompleted([]);
    setChosen(null);
    setScreen("sim");
  }

  function choose(scenario: Scenario, option: Option) {
    setChosen(option);
  }

  /**
   * Schließt die aktuelle Karte (nach Feedback, Event, Alloc) und wechselt
   * zum nächsten Schritt oder zum Ergebnis-Screen.
   */
  function advance() {
    if (!currentStep) return;

    const nextCompleted =
      currentStep.kind === "decision"
        ? chosen
          ? [...completed, { kind: "decision" as const, scenario: currentStep.scenario, chosen }]
          : completed
        : currentStep.kind === "event"
          ? [...completed, { kind: "event" as const, event: currentStep.event }]
          : completed;

    if (nextCompleted.length === completed.length) return;

    setChosen(null);
    setCompleted(nextCompleted);
    if (nextCompleted.length >= timeline.length) {
      setScreen("result");
    }
  }

  /**
   * Callback für AllocationCard: nimmt Betrags-Array entgegen,
   * wendet es auf Stats an und fügt Bonus-Punkte hinzu.
   */
  function finishAlloc(amounts: number[]) {
    const nextCompleted = [...completed, { kind: "alloc" as const, amounts }];
    setCompleted(nextCompleted);
    setChosen(null);
    if (nextCompleted.length >= timeline.length) {
      setScreen("result");
    }
  }

  function goBack() {
    if (screen === "result") {
      setCompleted((prev) => prev.slice(0, -1));
      setChosen(null);
      setScreen("sim");
      return;
    }

    if (chosen) {
      setChosen(null);
      return;
    }

    if (completed.length === 0) {
      setTimeline([]);
      setScreen("intro");
      return;
    }

    setCompleted((prev) => prev.slice(0, -1));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <AnimatePresence mode="wait">
        {screen === "intro" && <Intro key="intro" onStart={startGame} />}
        {screen === "sim" && currentStep && (
          <Sim
            key={`sim-${step}-${chosen ? "fb" : "q"}`}
            step={currentStep}
            stepIndex={step}
            total={timeline.length}
            stats={stats}
            cashRaw={cashRaw}
            chosen={chosen}
            onChoose={choose}
            onAdvance={advance}
            onBack={goBack}
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
            onBack={goBack}
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
      <div className="flex items-center justify-center gap-4">
        <Image
          src="/logos/startup-contacts-transparent.png"
          alt="Startup Contacts"
          width={168}
          height={73}
          unoptimized
          className="h-auto w-[150px] object-contain"
        />
        <div className="h-8 w-px" style={{ background: "var(--border)" }} />
        <Image
          src="/logos/vcm-transparent.png"
          alt="Venture Club Münster"
          width={150}
          height={61}
          unoptimized
          className="h-auto w-[118px] object-contain"
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
  cashRaw,
  chosen,
  onChoose,
  onAdvance,
  onBack,
  onFinishAlloc,
}: {
  step: Step;
  stepIndex: number;
  total: number;      // = 8 Schritte
  stats: Stats;
  cashRaw: number;
  chosen: Option | null;
  onChoose: (s: Scenario, o: Option) => void;
  onAdvance: () => void;
  onBack: () => void;
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
      <button
        onClick={onBack}
        className="btn btn-glass inline-flex w-fit items-center gap-1.5 px-3 py-2 text-[12px]"
        aria-label="Zurück"
      >
        <ChevronLeft size={15} /> Zurück
      </button>

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
          cashRaw={cashRaw}
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
  cashRaw,
  chosen,
  onChoose,
  onAdvance,
}: {
  scenario: Scenario;
  cashRaw: number;
  chosen: Option | null;
  onChoose: (s: Scenario, o: Option) => void;
  onAdvance: () => void;
}) {
  const phase = PHASES.find((p) => p.n === scenario.phase);
  const lockedOptions = scenario.options.map((option) => ({
    option,
    locked: isOptionLocked(option, cashRaw),
    cost: Math.max(0, -(option.effects.cash ?? 0)),
  }));
  const lastResort =
    lockedOptions.every(({ locked }) => locked)
      ? lockedOptions.reduce((best, current) => current.cost < best.cost ? current : best).option
      : null;

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
          const cashEffect = o.effects.cash ?? 0;
          const cost = Math.max(0, -cashEffect);
          const isLastResort = lastResort?.id === o.id;
          const locked = isOptionLocked(o, cashRaw) && !isLastResort;
          const risky = cashEffect < 0 && cashRaw + cashEffect < CASH_BANDS.strained.min;
          const dimmed = (chosen && !isChosen) || locked;
          return (
            <button
              key={o.id}
              disabled={!!chosen || locked}
              onClick={() => onChoose(scenario, o)}
              className="btn glass-card-inner flex items-start justify-between gap-3 p-3.5 text-left text-[13.5px] font-medium"
              style={{
                opacity: dimmed ? 0.48 : 1,
                borderColor: isChosen ? "var(--accent)" : locked ? "rgba(248,113,113,0.42)" : "transparent",
                borderWidth: 1.5,
                borderStyle: "solid",
              }}
            >
              <span className="flex flex-col gap-1">
                <span>{o.label}</span>
                {(locked || isLastResort || risky) && (
                  <span className="flex flex-wrap gap-1.5">
                    {locked && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.12)", color: "var(--error)" }}>
                        Zu teuer — braucht {formatMoney(cost)}
                      </span>
                    )}
                    {isLastResort && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,94,0,0.12)", color: "var(--accent)" }}>
                        Letzter Ausweg
                      </span>
                    )}
                    {risky && !locked && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.14)", color: "#f59e0b" }}>
                        Riskant
                      </span>
                    )}
                  </span>
                )}
              </span>
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
      <span className="section-label mt-1">Zufallsereignis</span>
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
 *   1. Pot < 500   → „Kasse fast leer"-Screen, direkt Weiter
 *   2. Verteilen   → Range-Slider je Bucket (500er-Schritte), „Noch zu verteilen"-Anzeige
 *   3. Bestätigt   → Effekt-Chips der Gains, Weiter-Button
 *
 * Constraint: Wenn ein Slider bewegt wird und die Summe den Pot übersteigt,
 * wird der bewegte Slider auf das verbleibende Maximum gekappt.
 */
function AllocationCard({
  stats,
  onFinish,
}: {
  stats: Stats;
  onFinish: (amounts: number[]) => void;
}) {
  // Pot aus aktuellem Cash-Stand berechnen (500er-Granularität)
  const pot = computeAllocationPot(stats.cash);

  // amounts[i] = in Bucket i investierter Betrag (Vielfaches von 500)
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
      const gain = Math.round((amt / 3000) * ALLOCATION.gainPer3000);
      const key = bucket.stat as StatKey;
      gains[key] = (gains[key] ?? 0) + gain;
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

  // ---------- Zustand 2: Slider-Verteilen ----------
  /**
   * Slider-Handler: neuen Wert kappen, damit Gesamtsumme ≤ pot bleibt.
   * Alle anderen Slider bleiben unverändert — einfachste robuste Variante.
   */
  function handleSlider(i: number, newVal: number) {
    setAmounts((prev) => {
      const next = [...prev];
      // Summe der anderen Buckets
      const otherSum = prev.reduce((s, a, j) => (j === i ? s : s + a), 0);
      // Auf verbleibendes Maximum kappen
      next[i] = Math.min(newVal, pot - otherSum);
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
        Je €3.000 bringen +{ALLOCATION.gainPer3000} Punkte auf den gewählten Bereich.
      </p>

      {/* Slider-Zeilen — Touchziel ≥ 44px je Zeile */}
      <div className="mt-4 flex flex-col gap-4">
        {ALLOCATION.buckets.map((bucket, i) => (
          <div key={bucket.stat} className="flex min-h-[44px] flex-col gap-1">
            {/* Kopfzeile: Emoji + Label + Live-Betrag */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                <span className="mr-1">{bucket.emoji}</span>
                {bucket.label}
              </span>
              <span
                className="text-[13px] font-bold tabular-nums"
                style={{ color: amounts[i] > 0 ? "var(--accent)" : "var(--muted)" }}
              >
                {formatMoney(amounts[i])}
              </span>
            </div>
            {/* Range-Slider — accent-color aus CSS-Token */}
            <input
              type="range"
              min={0}
              max={pot}
              step={ALLOCATION.step}
              value={amounts[i]}
              onChange={(e) => handleSlider(i, Number(e.target.value))}
              aria-label={bucket.label}
              className="w-full"
              style={{
                accentColor: "var(--accent)",
                // Touch-Daumen ≥ 24px wird über globals.css gesteuert;
                // height sorgt für ausreichendes Touchziel
                height: "24px",
                cursor: "pointer",
              }}
            />
          </div>
        ))}
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
 *
 * Enthält:
 * - VCM-Logo (/logos/vcm.png) unter dem Founder-Typ-Emoji
 * - Teilen-Button mit Web Share API (Fallback: Clipboard)
 *
 * Founders-Map-Hooks NICHT angefasst.
 */
function Result({
  stats,
  points,
  records,
  onRestart,
  onBack,
}: {
  stats: Stats;
  points: number;
  records: DecisionRecord[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const score = computeScore(stats, points);
  const type  = determineFounderType(stats);
  const [showClosing, setShowClosing] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied" | "downloaded">("idle");

  /** Teilen-Funktion: Story-PNG per Web Share API, Fallback Download + Clipboard. */
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Ich bin ${type.name} mit ${score} Punkten bei Founder's Run, der Startup-Simulation des Venture Club Münster. ${url}`;
    setShareState("working");
    try {
      const file = await createShareGraphic({
        score,
        founderName: type.name,
        founderTagline: type.tagline,
        founderEmoji: type.emoji,
      });
      const shareData: ShareData = {
        title: "Founder's Run · Mein Ergebnis",
        text,
        files: [file],
      };

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        setShareState("idle");
      } else {
        downloadFile(file);
        if (navigator.clipboard) await navigator.clipboard.writeText(text);
        setShareState("downloaded");
        setTimeout(() => setShareState("idle"), 2500);
      }
    } catch {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(text);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      } catch {
        setShareState("idle");
      }
    }
  }

  if (showClosing) {
    return <Closing onRestart={onRestart} onBack={() => setShowClosing(false)} />;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col gap-4 py-2"
    >
      <button
        onClick={onBack}
        className="btn btn-glass inline-flex w-fit items-center gap-1.5 px-3 py-2 text-[12px]"
        aria-label="Zurück"
      >
        <ChevronLeft size={15} /> Zurück
      </button>

      {/* Founder-Typ */}
      <div className="glass-card p-6 text-center">
        <span className="section-label">Dein Ergebnis</span>
        <div className="mt-2 text-5xl">{type.emoji}</div>
        {/* VCM-Logo — dezent unter dem Founder-Emoji */}
        <div className="mx-auto mt-3 flex h-7 w-auto items-center justify-center">
          <Image
            src="/logos/vcm-transparent.png"
            alt="Venture Club Münster"
            width={118}
            height={48}
            unoptimized
            className="h-auto w-[118px] object-contain opacity-90"
          />
        </div>
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
        {/* Teilen-Button */}
        <button
          onClick={handleShare}
          disabled={shareState === "working"}
          className="btn btn-glass mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-[14px]"
          style={{ opacity: shareState === "working" ? 0.7 : 1 }}
        >
          <Share2 size={16} />
          {shareState === "working"
            ? "Grafik wird erstellt..."
            : shareState === "downloaded"
              ? "Grafik geladen"
              : shareState === "copied"
                ? "Text kopiert"
                : "Ergebnis als Story teilen"}
        </button>
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
                <div className="mt-2">
                  <EffectChips effects={rec.chosen.effects} />
                </div>
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
                      <div className="mt-1.5">
                        <EffectChips effects={alt.effects} />
                      </div>
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
function Closing({
  onRestart,
  onBack,
}: {
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col justify-center gap-6 text-center"
    >
      <button
        onClick={onBack}
        className="btn btn-glass inline-flex w-fit items-center gap-1.5 px-3 py-2 text-[12px]"
        aria-label="Zurück"
      >
        <ChevronLeft size={15} /> Zurück
      </button>

      <div className="flex flex-col items-center gap-3">
        {/* VCM-Logo */}
        <Image
          src="/logos/vcm-transparent.png"
          alt="Venture Club Münster"
          width={240}
          height={98}
          unoptimized
          className="h-auto w-[220px] object-contain"
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
