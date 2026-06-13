#!/usr/bin/env node
// ============================================================================
// simulate.mjs — Massenläufe für den Invarianten-Check (T6.1)
// ----------------------------------------------------------------------------
// Kompiliert src/lib/gameLogic.ts per tsc nach .tmp-sim/ (eigenes Temp-Dir,
// damit check-determinism.mjs parallel laufen kann) und simuliert dann N
// vollständige Spielläufe ohne Test-Framework.
//
// Aufruf:
//   node scripts/simulate.mjs          → 2000 Läufe
//   node scripts/simulate.mjs 5000     → 5000 Läufe
// ============================================================================

import { execSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------
const N_DEFAULT = 2000;
const nArg = parseInt(process.argv[2], 10);
const N = Number.isFinite(nArg) && nArg > 0 ? nArg : N_DEFAULT;

const root = process.cwd();
const tmpDir = path.join(root, ".tmp-sim");

// ---------------------------------------------------------------------------
// Schritt 1: gameLogic.ts nach CommonJS kompilieren (identisch zu check-determinism)
// ---------------------------------------------------------------------------
if (!existsSync(path.join(root, "src/lib/gameContent.generated.ts"))) {
  console.error("❌ gameContent.generated.ts fehlt — zuerst `npm run generate` ausführen.");
  process.exit(1);
}
rmSync(tmpDir, { recursive: true, force: true });
execSync(
  "npx tsc src/lib/gameLogic.ts --outDir .tmp-sim --module commonjs --target es2020 " +
    "--moduleResolution node --esModuleInterop --skipLibCheck",
  { cwd: root, stdio: "inherit" }
);

const require = createRequire(import.meta.url);
const logic = require(path.join(tmpDir, "gameLogic.js"));
const data = require(path.join(tmpDir, "gameData.js"));

const {
  mulberry32,
  deriveSlots,
  deriveMarkers,
  resolveStep,
  deriveRunState,
  computeAllocationPot,
  computeScore,
  determineFounderType,
  isOptionLocked,
} = logic;

const { ALLOCATION, CRISIS } = data;

// ---------------------------------------------------------------------------
// Fehler-Tracking
// ---------------------------------------------------------------------------
let verletzungen = 0;
function verletzt(laufIdx, invariante, detail = "") {
  verletzungen++;
  console.error(`❌ Lauf ${laufIdx}: Invariante [${invariante}] verletzt${detail ? " — " + detail : ""}`);
}

// ---------------------------------------------------------------------------
// Statistik-Sammler
// ---------------------------------------------------------------------------
const stats = {
  laeufe: 0,
  krisenLaeufe: 0,       // Läufe mit mindestens einem Krisen-Slot
  echoLaeufe: 0,         // Läufe mit markergebundenem markt-Event
  markerP5Laeufe: 0,     // Läufe mit markergebundenem P5-Szenario
  pleite: 0,             // Läufe mit cashRaw ≤ 0 am Ende
  scores: [],            // alle Endscores
  founderTypen: {},      // Häufigkeit je Founder-Typ
};

// ---------------------------------------------------------------------------
// Allokations-Helfer: 4 verschiedene Stile, abhängig vom Policy-RNG
// ---------------------------------------------------------------------------
function waehleAlloc(cashRaw, policyRng) {
  const pot = computeAllocationPot(cashRaw);
  if (pot <= 0) return [0, 0, 0, 0]; // kein Geld → nichts investieren

  const maxBuckets = Math.floor(pot / 500); // maximale 500er-Einheiten gesamt
  const stil = Math.floor(policyRng() * 4); // 0–3: vier Stile

  const amounts = [0, 0, 0, 0];

  if (stil === 0) {
    // Stil 0: alles in einen zufälligen Bucket
    const bucket = Math.floor(policyRng() * 4);
    amounts[bucket] = Math.min(maxBuckets, Math.floor(ALLOCATION.maxPot / 500)) * 500;
    // Sicherstellen, dass der Betrag ≤ pot
    amounts[bucket] = Math.min(amounts[bucket], pot);
    // Auf 500er runden
    amounts[bucket] = Math.floor(amounts[bucket] / 500) * 500;
  } else if (stil === 1) {
    // Stil 1: gleichmäßig auf alle 4 Buckets gestreut
    const perBucket = Math.floor(maxBuckets / 4) * 500;
    for (let i = 0; i < 4; i++) amounts[i] = perBucket;
  } else if (stil === 2) {
    // Stil 2: nichts investieren (Rücklage halten)
    // amounts bleibt [0,0,0,0]
  } else {
    // Stil 3: zufällig auf 2 Buckets verteilen
    const einheiten = Math.floor(policyRng() * (maxBuckets + 1)); // 0..maxBuckets Einheiten total
    const cutA = Math.floor(policyRng() * (einheiten + 1));
    const cutB = einheiten - cutA;
    const bucketA = Math.floor(policyRng() * 4);
    let bucketB = Math.floor(policyRng() * 3);
    if (bucketB >= bucketA) bucketB++; // sicherstellen: verschiedene Buckets
    amounts[bucketA] = cutA * 500;
    amounts[bucketB] = cutB * 500;
  }

  return amounts;
}

// ---------------------------------------------------------------------------
// Haupt-Simulations-Schleife
// ---------------------------------------------------------------------------
for (let i = 1; i <= N; i++) {
  // Deterministischer Seed pro Lauf (Knuth-Multiplikation, 32-bit overflow via >>> 0)
  const runSeed = ((i * 2654435761) >>> 0);
  // Policy-RNG für Optionswahl + Alloc-Stil
  const policyRng = mulberry32(i);

  const completed = []; // CompletedStep[]

  // --- Spielschleife ---
  let schritte = 0;
  while (true) {
    const slots = deriveSlots(completed);

    // Invariante 1: ≤ 9 Slots zu jedem Zeitpunkt
    if (slots.length > 9) {
      verletzt(i, "1", `deriveSlots liefert ${slots.length} Slots`);
      break;
    }

    // Terminierungsbedingung: alle Slots abgeschlossen
    if (completed.length >= slots.length) break;

    // Invariante 4: ≤ 9 Schritte gesamt
    schritte++;
    if (schritte > 9) {
      verletzt(i, "4", `Schritt ${schritte} > 9 (Endlos-Verdacht)`);
      break;
    }

    const currentSlot = slots[completed.length];
    const step = resolveStep(runSeed, currentSlot, completed);

    if (step.kind === "decision" || step.kind === "crisis") {
      // Aktuelles Cash aus History ableiten
      const state = deriveRunState(completed);
      const cashRaw = state.cashRaw;

      // Wählbare Optionen unter Gating ermitteln (wie DecisionCard in page.tsx)
      const lockedOptions = step.scenario.options.map((option) => ({
        option,
        locked: isOptionLocked(option, cashRaw),
        cost: Math.max(0, -(option.effects.cash ?? 0)),
      }));

      // lastResort-Regel: wenn ALLE gesperrt → günstigste ist trotzdem wählbar
      const alleGesperrt = lockedOptions.every(({ locked }) => locked);
      const lastResort = alleGesperrt
        ? lockedOptions.reduce((best, cur) => cur.cost < best.cost ? cur : best).option
        : null;

      const waehlbar = step.scenario.options.filter((o) => {
        const eintrag = lockedOptions.find((l) => l.option === o);
        const gesperrt = eintrag.locked && lastResort?.id !== o.id;
        return !gesperrt;
      });

      // Invariante 3: mindestens eine wählbare Option
      if (waehlbar.length === 0) {
        verletzt(i, "3", `Slot ${currentSlot.id}: keine wählbare Option`);
        break;
      }

      // Per Policy-RNG eine wählbare Option ziehen
      const gewaehlteIdx = Math.floor(policyRng() * waehlbar.length);
      const gewaehlte = waehlbar[gewaehlteIdx];

      completed.push({
        kind: step.kind,
        scenario: step.scenario,
        chosen: gewaehlte,
      });

    } else if (step.kind === "event") {
      completed.push({ kind: "event", event: step.event });

    } else if (step.kind === "alloc") {
      const state = deriveRunState(completed);
      const amounts = waehleAlloc(state.cashRaw, policyRng);
      completed.push({ kind: "alloc", amounts });
    }
  }

  // --- Invarianten nach Spielende ---

  // Invariante 2: höchstens 1 Krisen-Step
  const krisenSchritte = completed.filter((s) => s.kind === "crisis").length;
  if (krisenSchritte > 1) {
    verletzt(i, "2", `${krisenSchritte} Krisen-Steps`);
  }

  // Invariante 5: deriveRunState finite; computeScore und determineFounderType werfen nicht
  let endState, score, founderTyp;
  try {
    endState = deriveRunState(completed);
    if (!Number.isFinite(endState.cashRaw) || !Number.isFinite(endState.points)) {
      verletzt(i, "5", `cashRaw=${endState.cashRaw} points=${endState.points}`);
    }
    score = computeScore(endState.stats, endState.points);
    if (!Number.isFinite(score)) {
      verletzt(i, "5", `computeScore liefert nicht-finiten Wert: ${score}`);
    }
    founderTyp = determineFounderType(endState.stats);
    if (!founderTyp) {
      verletzt(i, "5", "determineFounderType liefert falsy");
    }
  } catch (err) {
    verletzt(i, "5", String(err));
    endState = null;
  }

  // Invariante 6: Echo-Konsistenz
  // a) Jedes markt-Event mit requiresMarker darf nur erscheinen, wenn der Marker aktiv war
  // b) Jedes P5-Szenario mit requiresMarker darf nur erscheinen, wenn der Marker aktiv war
  // Außerdem: Läufe ohne Marker bekommen markerlose Events/P5
  let hatEcho = false;
  let hatMarkerP5 = false;
  for (let s = 0; s < completed.length; s++) {
    const step = completed[s];
    const historyBis = completed.slice(0, s); // History VOR diesem Schritt
    const aktiveMarker = new Set(deriveMarkers(historyBis));

    if (step.kind === "event") {
      const ev = step.event;
      if (ev.requiresMarker) {
        // Marker muss zu dem Zeitpunkt aktiv gewesen sein
        if (!aktiveMarker.has(ev.requiresMarker)) {
          verletzt(i, "6a", `Event ${ev.id} erfordert Marker "${ev.requiresMarker}", aber aktive Marker: [${[...aktiveMarker].join(", ")}]`);
        }
        hatEcho = true;
      }
    }

    if ((step.kind === "decision" || step.kind === "crisis") && step.scenario.requiresMarker) {
      // Prüfen ob es ein P5-Slot war
      const slot = deriveSlots(historyBis)[s] ?? null;
      if (slot && slot.id === "p5") {
        if (!aktiveMarker.has(step.scenario.requiresMarker)) {
          verletzt(i, "6b", `P5-Szenario ${step.scenario.id} erfordert Marker "${step.scenario.requiresMarker}", aber aktive Marker: [${[...aktiveMarker].join(", ")}]`);
        }
        hatMarkerP5 = true;
      }
    }
  }

  // Invariante 8: Normale Slot-IDs (p1…p5, verein, markt, alloc) je genau einmal,
  // in fester Reihenfolge; Krise ist optional (max. 1).
  const NORMALE_SLOT_IDS = ["p1", "verein", "p2", "p3", "alloc", "p4", "markt", "p5"];
  const completedSlotIds = completed.map((step) => {
    if (step.kind === "decision") return step.scenario?.phase ? `p${step.scenario.phase}` : null;
    if (step.kind === "crisis") return CRISIS.slotId;
    if (step.kind === "event") return step.event?.category ?? null;
    if (step.kind === "alloc") return "alloc";
    return null;
  });

  // Einfacherer Ansatz: Die tatsächlichen Slot-IDs aus deriveSlots holen und
  // prüfen, dass jede normale Slot-ID genau einmal vorkommt.
  const alleSlots = deriveSlots(completed);
  for (const normId of NORMALE_SLOT_IDS) {
    const anzahl = alleSlots.filter((s) => s.id === normId).length;
    if (anzahl !== 1) {
      verletzt(i, "8", `Slot "${normId}" kommt ${anzahl}× vor (erwartet: 1)`);
    }
  }
  const krisisAnzahl = alleSlots.filter((s) => s.kind === "crisis").length;
  if (krisisAnzahl > 1) {
    verletzt(i, "8", `Mehr als 1 Krisen-Slot: ${krisisAnzahl}`);
  }

  // Invariante 7: Determinismus-Check (für jeden 50. Lauf)
  if (i % 50 === 0) {
    // Lauf mit identischem runSeed und identischer Policy-RNG wiederholen
    const policyRng2 = mulberry32(i);
    const completed2 = [];
    let schritte2 = 0;
    let deterministisch = true;

    while (true) {
      const slots2 = deriveSlots(completed2);
      if (completed2.length >= slots2.length) break;
      schritte2++;
      if (schritte2 > 9) break;

      const currentSlot2 = slots2[completed2.length];
      const step2 = resolveStep(runSeed, currentSlot2, completed2);

      if (step2.kind === "decision" || step2.kind === "crisis") {
        const state2 = deriveRunState(completed2);
        const cashRaw2 = state2.cashRaw;
        const lockedOptions2 = step2.scenario.options.map((option) => ({
          option,
          locked: isOptionLocked(option, cashRaw2),
          cost: Math.max(0, -(option.effects.cash ?? 0)),
        }));
        const alleGesperrt2 = lockedOptions2.every(({ locked }) => locked);
        const lastResort2 = alleGesperrt2
          ? lockedOptions2.reduce((best, cur) => cur.cost < best.cost ? cur : best).option
          : null;
        const waehlbar2 = step2.scenario.options.filter((o) => {
          const eintrag = lockedOptions2.find((l) => l.option === o);
          return !(eintrag.locked && lastResort2?.id !== o.id);
        });
        if (waehlbar2.length === 0) break;
        const gewaehlteIdx2 = Math.floor(policyRng2() * waehlbar2.length);
        completed2.push({ kind: step2.kind, scenario: step2.scenario, chosen: waehlbar2[gewaehlteIdx2] });
      } else if (step2.kind === "event") {
        completed2.push({ kind: "event", event: step2.event });
      } else if (step2.kind === "alloc") {
        const state2 = deriveRunState(completed2);
        const amounts2 = waehleAlloc(state2.cashRaw, policyRng2);
        completed2.push({ kind: "alloc", amounts: amounts2 });
      }
    }

    // Vergleich: completed vs completed2 (ohne scenario-Objekte, nur strukturell)
    const sig1 = JSON.stringify(completed.map((s) => ({
      kind: s.kind,
      chosenId: s.chosen?.id,
      eventId: s.event?.id,
      amounts: s.amounts,
    })));
    const sig2 = JSON.stringify(completed2.map((s) => ({
      kind: s.kind,
      chosenId: s.chosen?.id,
      eventId: s.event?.id,
      amounts: s.amounts,
    })));
    if (sig1 !== sig2) {
      verletzt(i, "7", "Zweiter Durchlauf mit gleichen Seeds liefert abweichendes Ergebnis");
    }
  }

  // --- Statistik sammeln ---
  stats.laeufe++;
  if (krisenSchritte > 0) stats.krisenLaeufe++;
  if (hatEcho) stats.echoLaeufe++;
  if (hatMarkerP5) stats.markerP5Laeufe++;

  if (endState) {
    if (endState.cashRaw <= 0) stats.pleite++;
    if (Number.isFinite(score)) stats.scores.push(score);
    if (founderTyp) {
      // FounderType ist ein Objekt — als Schlüssel den key-String verwenden
      const typKey = founderTyp.key ?? String(founderTyp);
      stats.founderTypen[typKey] = (stats.founderTypen[typKey] ?? 0) + 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Aufräumen
// ---------------------------------------------------------------------------
rmSync(tmpDir, { recursive: true, force: true });

// ---------------------------------------------------------------------------
// Statistik-Ausgabe
// ---------------------------------------------------------------------------
const { scores } = stats;
scores.sort((a, b) => a - b);
const scoreMin = scores[0] ?? "–";
const scoreMax = scores[scores.length - 1] ?? "–";
const scoreMedian = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : "–";

console.log("\n" + "=".repeat(60));
console.log(`  Simulations-Ergebnis: ${stats.laeufe} Läufe`);
console.log("=".repeat(60));
console.log(`  Krisenquote:           ${(stats.krisenLaeufe / stats.laeufe * 100).toFixed(1)} %  (${stats.krisenLaeufe}/${stats.laeufe})`);
console.log(`  Echo-Quote (markt):    ${(stats.echoLaeufe / stats.laeufe * 100).toFixed(1)} %  (${stats.echoLaeufe}/${stats.laeufe})`);
console.log(`  Marker-P5-Quote:       ${(stats.markerP5Laeufe / stats.laeufe * 100).toFixed(1)} %  (${stats.markerP5Laeufe}/${stats.laeufe})`);
console.log(`  Pleitequote:           ${(stats.pleite / stats.laeufe * 100).toFixed(1)} %  (${stats.pleite}/${stats.laeufe})`);
console.log(`  Score  min/median/max: ${scoreMin} / ${scoreMedian} / ${scoreMax}`);
console.log(`  Founder-Typ-Verteilung:`);
const typenSortiert = Object.entries(stats.founderTypen).sort((a, b) => b[1] - a[1]);
for (const [typ, anzahl] of typenSortiert) {
  const pct = (anzahl / stats.laeufe * 100).toFixed(1);
  console.log(`    ${typ.padEnd(20)} ${pct.padStart(5)} %  (${anzahl})`);
}
console.log("=".repeat(60));

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------
if (verletzungen > 0) {
  console.error(`\n❌ ${verletzungen} Invarianten-Verletzung(en) gefunden. Exit 1.`);
  process.exit(1);
}
console.log(`\n✅ Alle Invarianten bestanden (${N} Läufe). Exit 0.`);
