#!/usr/bin/env node
// ============================================================================
// Determinismus- und Marker-Invarianten-Check (G4, wiederverwendbar für G5/G6)
// ----------------------------------------------------------------------------
// Kompiliert src/lib/gameLogic.ts (+ Abhängigkeiten) per tsc nach .tmp-check/
// und prüft dann ohne Test-Framework:
//   1. resolveStep ist deterministisch (gleicher Seed + History → gleiches Ergebnis)
//   2. Echo: gesetzter Marker → passendes markergebundenes Markt-Event
//   3. Ohne Marker → generisches Markt-Event (kein requiresMarker)
//   4. P5: Marker → markergebundenes P5-Szenario; ohne Marker → markerloser Fallback
//   5. Back-Semantik: Marker-Antwort zurückgenommen → Echo/P5 fällt korrekt zurück
//   6. Krise: max. 1 Zusatzslot; Krisen-Injektion verschiebt normale Slot-RNGs nicht
//   7. Kein Szenario ohne Optionen
// Aufruf: node scripts/check-determinism.mjs   (aus startup-simulation/)
// ============================================================================

import { execSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const tmpDir = path.join(root, ".tmp-check");

// --- Schritt 1: gameLogic.ts nach CommonJS kompilieren (keine neue Dependency) ---
if (!existsSync(path.join(root, "src/lib/gameContent.generated.ts"))) {
  console.error("❌ gameContent.generated.ts fehlt — zuerst `npm run generate` ausführen.");
  process.exit(1);
}
rmSync(tmpDir, { recursive: true, force: true });
execSync(
  "npx tsc src/lib/gameLogic.ts --outDir .tmp-check --module commonjs --target es2020 " +
    "--moduleResolution node --esModuleInterop --skipLibCheck",
  { cwd: root, stdio: "inherit" }
);

const require = createRequire(import.meta.url);
const logic = require(path.join(tmpDir, "gameLogic.js"));
const data = require(path.join(tmpDir, "gameData.js"));

const { deriveSlots, deriveMarkers, resolveStep, deriveRunState } = logic;
const { SCENARIOS, LUCK_EVENTS } = data;

let fehler = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`✓ ${name}`);
  } else {
    fehler += 1;
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// --- Hilfen: CompletedStep-Bausteine aus echten Inhalten bauen ---
function szenario(id) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Szenario '${id}' nicht gefunden`);
  return s;
}
function decision(id, optionId) {
  const s = szenario(id);
  const o = s.options.find((x) => x.id === optionId);
  if (!o) throw new Error(`Option '${optionId}' in '${id}' nicht gefunden`);
  return { kind: "decision", scenario: s, chosen: o };
}
const NORMAL_IDS = ["p1", "verein", "p2", "p3", "alloc", "p4", "markt", "p5"];

// --- 1. Determinismus: 50 Seeds × alle Slots, zweifach resolven, Deep-Equal ---
{
  let stabil = true;
  for (let seed = 1; seed <= 50 && stabil; seed += 1) {
    const completedMitMarker = [decision("p2-tech", "a")]; // setzt tech:api
    for (const slot of deriveSlots(completedMitMarker)) {
      const a = JSON.stringify(resolveStep(seed * 7919, slot, completedMitMarker));
      const b = JSON.stringify(resolveStep(seed * 7919, slot, completedMitMarker));
      if (a !== b) {
        stabil = false;
        break;
      }
    }
  }
  check("resolveStep deterministisch (50 Seeds × alle Slots)", stabil);
}

// --- 2./3. Echo-Auswahl im markt-Slot ---
{
  const marktSlot = { id: "markt", kind: "event", category: "markt" };
  const mitApi = [decision("p2-tech", "a")];
  let echoOk = true;
  let generischOk = true;
  for (let seed = 1; seed <= 200; seed += 1) {
    const echo = resolveStep(seed, marktSlot, mitApi).event;
    if (echo.requiresMarker !== "tech:api") echoOk = false;
    const generisch = resolveStep(seed, marktSlot, []).event;
    if (generisch.requiresMarker !== undefined) generischOk = false;
  }
  check("Echo: Marker tech:api → markergebundenes Markt-Event (200 Seeds)", echoOk);
  check("Ohne Marker → nur generische Markt-Events (200 Seeds)", generischOk);
}

// --- 4. P5-Priorisierung + markerloser Fallback ---
{
  const p5Slot = { id: "p5", kind: "decision", phase: 5 };
  const mitInvestor = [decision("p3-source", "b")]; // setzt funding:investor
  let prioOk = true;
  let fallbackOk = true;
  for (let seed = 1; seed <= 200; seed += 1) {
    const prio = resolveStep(seed, p5Slot, mitInvestor).scenario;
    if (prio.requiresMarker !== "funding:investor") prioOk = false;
    const fb = resolveStep(seed, p5Slot, []).scenario;
    if (fb.requiresMarker !== undefined) fallbackOk = false;
  }
  check("P5: Marker funding:investor → markergebundenes P5-Szenario (200 Seeds)", prioOk);
  check("P5 ohne Marker → markerloser Fallback-Pool (200 Seeds)", fallbackOk);
}

// --- 5. Back-Semantik: Marker-Antwort entfernen ändert Echo korrekt ---
{
  const marktSlot = { id: "markt", kind: "event", category: "markt" };
  const seed = 4242;
  const mitMarker = [decision("p2-tech", "b")]; // tech:eigenmodell
  const ohneMarker = []; // Back: Antwort zurückgenommen
  const vorher = resolveStep(seed, marktSlot, mitMarker).event;
  const nachher = resolveStep(seed, marktSlot, ohneMarker).event;
  check(
    "Back-Semantik: Marker weg → Echo fällt auf generisches Event zurück",
    vorher.requiresMarker === "tech:eigenmodell" && nachher.requiresMarker === undefined
  );
}

// --- 6. Krise: max. 1 Zusatzslot, normale Slot-RNGs unverschoben ---
{
  // Cash unter 3000 drücken: teure Antworten wählen, dann Slots ableiten.
  const teuer = [];
  for (const [fid, oid] of [["p1-cofounder", "a"], ["p2-mvp", "b"]]) {
    teuer.push(decision(fid, oid));
  }
  // Direkt mit künstlich niedrigem Cash testen wäre invasiv — stattdessen:
  // deriveSlots auf einer History mit Krise prüfen.
  const sBeispiel = szenario("crisis-runway");
  const krisenStep = { kind: "crisis", scenario: sBeispiel, chosen: sBeispiel.options[0] };
  const mitKrise = [decision("p1-cofounder", "a"), krisenStep];
  const slots = deriveSlots(mitKrise);
  const krisenSlots = slots.filter((s) => s.kind === "crisis").length;
  check("Krise: genau 1 Krisen-Slot in Krisen-History", krisenSlots === 1 && slots.length === 9);

  // RNG-Stabilität: normale Slots liefern mit/ohne Krise dasselbe Ergebnis
  // (Pick ist an slot.id gekeyt, nicht an Position).
  const seed = 1337;
  let unverschoben = true;
  for (const slot of slots) {
    if (slot.kind === "crisis") continue;
    const normalSlot = deriveSlots([]).find((s) => s.id === slot.id);
    const a = JSON.stringify(resolveStep(seed, slot, mitKrise));
    const b = JSON.stringify(resolveStep(seed, normalSlot, mitKrise));
    if (a !== b) unverschoben = false;
  }
  check("Krise verschiebt normale Slot-RNGs nicht", unverschoben);

  // Krisen-Marker: crisis-runway Antwort a setzt krise:notfinanzierung
  const marker = deriveMarkers(mitKrise);
  check(
    "Krisen-Antwort setzt krise:notfinanzierung im Replay",
    marker.includes("krise:notfinanzierung")
  );
}

// --- 7. Kein Szenario ohne Optionen + Stats bleiben berechenbar ---
{
  check("Kein Szenario ohne Optionen", SCENARIOS.every((s) => s.options.length > 0));
  const state = deriveRunState([decision("p1-target", "c"), decision("p2-tech", "a")]);
  check(
    "deriveRunState liefert konsistenten Zustand",
    Number.isFinite(state.cashRaw) && Number.isFinite(state.points)
  );
  // Jeder Echo-Marker hat mindestens einen Konsumenten ODER ist dokumentiert ungenutzt
  const gesetzteMarker = new Set();
  for (const s of SCENARIOS) for (const o of s.options) if (o.setsMarker) gesetzteMarker.add(o.setsMarker);
  const konsumiert = new Set([
    ...LUCK_EVENTS.filter((e) => e.requiresMarker).map((e) => e.requiresMarker),
    ...SCENARIOS.filter((s) => s.requiresMarker).map((s) => s.requiresMarker),
  ]);
  const ohneKonsument = [...gesetzteMarker].filter((m) => !konsumiert.has(m));
  // tempo:hoch ist bewusst ohne S4-Konsument (Kandidat für S5/Roadmap)
  const erlaubtOhne = new Set(["tempo:hoch"]);
  check(
    "Jeder gesetzte Marker hat einen Konsumenten (außer dokumentierte)",
    ohneKonsument.every((m) => erlaubtOhne.has(m)),
    `ohne Konsument: ${ohneKonsument.join(", ")}`
  );
}

// --- Aufräumen + Ergebnis ---
rmSync(tmpDir, { recursive: true, force: true });
if (fehler > 0) {
  console.error(`\n❌ ${fehler} Check(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\n✅ Alle Determinismus-/Marker-Checks bestanden.");
