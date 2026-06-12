// ============================================================================
// _snapshot-gamedata.mjs — Einmal-Skript: Snapshot + TSV-Export
// ----------------------------------------------------------------------------
// Läuft einmalig während der Migration. Liest gameData.ts via
// typescript.transpileModule (keine Fremd-Imports nötig, da gameData.ts
// ein reines Daten-Modul ohne Imports ist) und schreibt:
//   1. scripts/.content-snapshot.json  (Referenz für Round-Trip-Prüfung)
//   2. content/*.tsv                   (Quell-Dateien für den Generator)
// ============================================================================

import { createRequire } from "module";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/** Rekursiv alphabetisch sortierte Schlüssel — Array-Reihenfolge bleibt. */
function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeysDeep(value[k])])
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Schritt 1: gameData.ts transpilieren und laden
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);

// TypeScript ist als devDependency vorhanden
let ts;
try {
  ts = require("typescript");
} catch {
  console.error("❌ typescript-Paket nicht gefunden. Bitte npm install ausführen.");
  process.exit(1);
}

const gameDataPath = path.resolve(ROOT, "src/lib/gameData.ts");
const sourceText = readFileSync(gameDataPath, "utf8");

// Transpiliert TS → JS (CommonJS), entfernt Typ-Annotationen
const result = ts.transpileModule(sourceText, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: false,
  },
  fileName: "gameData.ts",
});

if (result.diagnostics && result.diagnostics.length > 0) {
  console.error("❌ TypeScript-Transpilierungsfehler:");
  result.diagnostics.forEach((d) => console.error(d.messageText));
  process.exit(1);
}

// Transpilierten Code in temporärer Datei im Arbeitsspeicher auswerten
// via eval in einem Modul-Scope mit gefaktem exports-Objekt
const moduleObj = { exports: {} };
const wrappedCode = `(function(module, exports) { ${result.outputText} })(moduleObj, moduleObj.exports)`;
try {
  eval(wrappedCode);
} catch (err) {
  console.error("❌ Fehler beim Auswerten des transpilierten Codes:", err.message);
  process.exit(1);
}

const {
  SCENARIOS,
  LUCK_EVENTS,
  FOUNDER_TYPES,
  SCENARIO_INTRO,
  PHASES,
} = moduleObj.exports;

// Prüfe dass alle Exporte vorhanden sind
for (const [name, val] of [
  ["SCENARIOS", SCENARIOS],
  ["LUCK_EVENTS", LUCK_EVENTS],
  ["FOUNDER_TYPES", FOUNDER_TYPES],
  ["SCENARIO_INTRO", SCENARIO_INTRO],
  ["PHASES", PHASES],
]) {
  if (!val) {
    console.error(`❌ Export '${name}' nicht gefunden in gameData.ts`);
    process.exit(1);
  }
}

console.log(`✓ gameData.ts geladen: ${SCENARIOS.length} Szenarien, ${LUCK_EVENTS.length} Events, 5 Phasen`);

// ---------------------------------------------------------------------------
// Schritt 1b: Snapshot als JSON speichern
// ---------------------------------------------------------------------------

const snapshot = {
  SCENARIOS: sortKeysDeep(SCENARIOS),
  LUCK_EVENTS: sortKeysDeep(LUCK_EVENTS),
  FOUNDER_TYPES: sortKeysDeep(FOUNDER_TYPES),
  SCENARIO_INTRO: sortKeysDeep(SCENARIO_INTRO),
  PHASES: sortKeysDeep(PHASES),
};

const snapshotPath = path.resolve(__dirname, ".content-snapshot.json");
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`✓ Snapshot gespeichert: scripts/.content-snapshot.json`);

// ---------------------------------------------------------------------------
// Schritt 2: TSV-Export
// ---------------------------------------------------------------------------

/** Prüft ob ein Wert TSV-gefährdete Zeichen enthält. Bricht ab wenn ja. */
function checkNoTsvSpecialChars(value, context) {
  const str = String(value ?? "");
  if (str.includes("\t")) {
    console.error(`❌ TSV-Fehler in ${context}: Inhalt enthält Tab-Zeichen:\n  "${str}"`);
    process.exit(1);
  }
  if (str.includes("\r")) {
    console.error(`❌ TSV-Fehler in ${context}: Inhalt enthält CR-Zeichen.`);
    process.exit(1);
  }
  if (str.includes("\n")) {
    console.error(`❌ TSV-Fehler in ${context}: Inhalt enthält LF-Zeichen:\n  "${str}"`);
    process.exit(1);
  }
}

/** Schreibt eine TSV-Datei aus Header-Array und Zeilen-Arrays. */
function writeTsv(filename, headers, rows) {
  const contentDir = path.resolve(ROOT, "content");
  mkdirSync(contentDir, { recursive: true });

  // Validierung: keine TSV-Sonderzeichen in Header
  headers.forEach((h) => checkNoTsvSpecialChars(h, `${filename} Header`));

  const lines = [headers.join("\t")];
  rows.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      const cellStr = cell === null || cell === undefined ? "" : String(cell);
      checkNoTsvSpecialChars(cellStr, `${filename} Zeile ${rowIdx + 2} Spalte ${headers[colIdx]}`);
    });
    lines.push(row.map((c) => (c === null || c === undefined ? "" : String(c))).join("\t"));
  });

  const outPath = path.resolve(contentDir, filename);
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`✓ Geschrieben: content/${filename} (${rows.length} Zeilen)`);
}

// --- 1. fragen.tsv ---
const fragenRows = SCENARIOS.map((s) => [
  s.id,
  s.phase,
  s.title,
  s.situation,
]);
writeTsv("fragen.tsv", ["frage_id", "phase", "titel", "situation"], fragenRows);

// --- 2. antworten.tsv ---
const antwortenRows = [];
SCENARIOS.forEach((s) => {
  s.options.forEach((opt) => {
    // Effekt-Spalten: leer wenn nicht vorhanden, cash → geld
    const eff = opt.effects || {};
    antwortenRows.push([
      s.id,                              // frage_id
      opt.id,                            // antwort_id
      opt.label,                         // antwort
      opt.points,                        // punkte
      eff.growth   !== undefined ? eff.growth   : "", // growth
      eff.innovation !== undefined ? eff.innovation : "", // innovation
      eff.community !== undefined ? eff.community : "", // community
      eff.impact   !== undefined ? eff.impact   : "", // impact
      eff.cash     !== undefined ? eff.cash     : "", // geld
      opt.outcome,                       // ergebnis
    ]);
  });
});
writeTsv(
  "antworten.tsv",
  ["frage_id", "antwort_id", "antwort", "punkte", "growth", "innovation", "community", "impact", "geld", "ergebnis"],
  antwortenRows
);

// --- 3. events.tsv ---
const eventsRows = LUCK_EVENTS.map((ev) => {
  const eff = ev.effects || {};
  return [
    ev.id,
    ev.category,
    ev.title,
    ev.text,
    eff.growth   !== undefined ? eff.growth   : "",
    eff.innovation !== undefined ? eff.innovation : "",
    eff.community !== undefined ? eff.community : "",
    eff.impact   !== undefined ? eff.impact   : "",
    eff.cash     !== undefined ? eff.cash     : "",
  ];
});
writeTsv(
  "events.tsv",
  ["event_id", "kategorie", "titel", "text", "growth", "innovation", "community", "impact", "geld"],
  eventsRows
);

// --- 4. gruendertypen.tsv ---
// Reihenfolge: growth, innovation, community, impact, balanced
const FOUNDER_ORDER = ["growth", "innovation", "community", "impact", "balanced"];
const gruenderRows = FOUNDER_ORDER.map((key) => {
  const ft = FOUNDER_TYPES[key];
  if (!ft) {
    console.error(`❌ FOUNDER_TYPES.${key} nicht gefunden`);
    process.exit(1);
  }
  return [key, ft.name, ft.tagline, ft.description, ft.emoji];
});
writeTsv(
  "gruendertypen.tsv",
  ["typ", "name", "tagline", "beschreibung", "emoji"],
  gruenderRows
);

// --- 5. texte.tsv ---
const texteRows = [];

// Intro-Zeilen
texteRows.push(["intro", "startup",  SCENARIO_INTRO.startup]);
texteRows.push(["intro", "oneLiner", SCENARIO_INTRO.oneLiner]);
texteRows.push(["intro", "pitch",    SCENARIO_INTRO.pitch]);
SCENARIO_INTRO.conditions.forEach((cond, i) => {
  texteRows.push(["intro", `bedingung${i + 1}`, cond]);
});

// Phasen-Zeilen (aus PHASES-Array, das as const ist)
const phasesArray = Array.isArray(PHASES) ? PHASES : Object.values(PHASES);
phasesArray.forEach((phase) => {
  texteRows.push([`phase${phase.n}`, "name",  phase.name]);
  texteRows.push([`phase${phase.n}`, "intro", phase.intro]);
});

writeTsv("texte.tsv", ["bereich", "schluessel", "wert"], texteRows);

console.log("\n✅ Snapshot und TSV-Export abgeschlossen.");
