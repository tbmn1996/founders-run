// ============================================================================
// generate-content.mjs — TSV-Generator für Spielinhalte
// ----------------------------------------------------------------------------
// Liest content/*.tsv, validiert strikt, schreibt
// src/lib/gameContent.generated.ts
//
// Aufruf: node scripts/generate-content.mjs
// Wird automatisch vor dev/build/lint via predev/prebuild/prelint gestartet.
// ============================================================================

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.resolve(ROOT, "content");
const OUT_FILE = path.resolve(ROOT, "src/lib/gameContent.generated.ts");

// ---------------------------------------------------------------------------
// TSV-Parser: strikt, kein Quoting
// ---------------------------------------------------------------------------

/**
 * Liest und parst eine TSV-Datei.
 * @returns {{ headers: string[], rows: string[][], filename: string }}
 */
function parseTsv(filename) {
  const filePath = path.resolve(CONTENT_DIR, filename);
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (err) {
    fail(filename, 0, `Datei nicht lesbar: ${err.message}`);
  }

  // BOM entfernen falls vorhanden
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  // CRLF normalisieren zu LF
  raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // In Zeilen splitten, leere Zeilen am Ende ignorieren
  const allLines = raw.split("\n");
  // Trailing-Leerzeilen entfernen
  while (allLines.length > 0 && allLines[allLines.length - 1] === "") {
    allLines.pop();
  }

  if (allLines.length === 0) {
    fail(filename, 1, "Datei ist leer — mindestens eine Header-Zeile erwartet");
  }

  // Header parsen
  const headers = allLines[0].split("\t");

  // Datenzeilen parsen und validieren
  const rows = [];
  for (let i = 1; i < allLines.length; i++) {
    const lineNum = i + 1; // 1-basiert
    const line = allLines[i];

    // Leere Zeilen mittendrin sind ein Fehler
    if (line === "") {
      fail(filename, lineNum, "Leere Zeile mittendrin (nur am Dateiende erlaubt)");
    }

    const cells = line.split("\t");

    // Spaltenanzahl muss mit Header übereinstimmen
    if (cells.length !== headers.length) {
      fail(
        filename,
        lineNum,
        `Falsche Spaltenanzahl: ${cells.length} Spalten, erwartet ${headers.length} (gemäß Header)`
      );
    }

    // Anführungszeichen-Artefakt prüfen (jede Zelle)
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      if (cell.startsWith('"') && cell.endsWith('"')) {
        fail(
          filename,
          lineNum,
          `Spalte '${headers[c]}': Zelle beginnt und endet mit Anführungszeichen — ` +
            `sieht aus wie ein Anführungszeichen-Artefakt eines Tabellen-Exports — ` +
            `Anführungszeichen entfernen oder anderes Export-Format wählen`
        );
      }
    }

    rows.push(cells);
  }

  return { headers, rows, filename };
}

/** Bricht mit deutschem Fehler ab, gibt Dateiname + Zeilennummer aus. */
function fail(filename, lineNum, message) {
  if (lineNum > 0) {
    console.error(`❌ content/${filename}, Zeile ${lineNum}: ${message}`);
  } else {
    console.error(`❌ content/${filename}: ${message}`);
  }
  process.exit(1);
}

function warn(filename, lineNum, message) {
  const location = lineNum > 0 ? `content/${filename}, Zeile ${lineNum}` : `content/${filename}`;
  console.warn(`⚠️  ${location}: ${message}`);
}

/** Validiert Header-Spalten: genau die Pflichtmenge, keine unbekannten. */
function validateHeaders(parsed, required) {
  const { headers, filename } = parsed;
  const missing = required.filter((h) => !headers.includes(h));
  const unknown = headers.filter((h) => !required.includes(h));
  if (missing.length > 0) {
    fail(filename, 1, `Fehlende Pflicht-Spalten: ${missing.join(", ")}`);
  }
  if (unknown.length > 0) {
    fail(filename, 1, `Unbekannte Spalten: ${unknown.join(", ")}`);
  }
}

/** Validiert Header-Spalten inkl. Reihenfolge. */
function validateExactHeaders(parsed, expected) {
  const { headers, filename } = parsed;
  validateHeaders(parsed, expected);
  const sameOrder = headers.length === expected.length && headers.every((h, i) => h === expected[i]);
  if (!sameOrder) {
    fail(filename, 1, `Header muss exakt lauten: ${expected.join("\t")}`);
  }
}

/**
 * Validiert eine Zahl-Zelle: leer OK, oder Ganzzahl mit optionalem Minus.
 * Gibt den geparsten Wert zurück (Number oder undefined).
 */
function parseIntCell(filename, lineNum, colName, cellValue, allowEmpty = true) {
  if (cellValue === "") {
    if (!allowEmpty) {
      fail(filename, lineNum, `Spalte '${colName}': Pflichtfeld darf nicht leer sein`);
    }
    return undefined;
  }
  if (!/^-?\d+$/.test(cellValue)) {
    // Explizite Hinweise für häufige Probleme
    if (cellValue.includes("€") || cellValue.includes("$")) {
      fail(filename, lineNum, `Spalte '${colName}': Währungssymbol (€, $) nicht erlaubt — nur nackte Ganzzahl (z. B. -8000 statt €-8000)`);
    }
    if (cellValue.includes(".") || cellValue.includes(",")) {
      fail(filename, lineNum, `Spalte '${colName}': Dezimaltrenner (. oder ,) nicht erlaubt — nur Ganzzahl`);
    }
    fail(
      filename,
      lineNum,
      `Spalte '${colName}': '${cellValue}' ist keine gültige Ganzzahl (erwartet: optionales Minus + Ziffern)`
    );
  }
  return parseInt(cellValue, 10);
}

/** Prüft ob Pflicht-Text-Zelle nicht leer ist. */
function requireNonEmpty(filename, lineNum, colName, cellValue) {
  if (!cellValue || cellValue.trim() === "") {
    fail(filename, lineNum, `Spalte '${colName}': Pflichtfeld ist leer`);
  }
}

// ---------------------------------------------------------------------------
// Spalten-Index-Helfer
// ---------------------------------------------------------------------------
function colIdx(headers, name) {
  const i = headers.indexOf(name);
  if (i === -1) throw new Error(`Spalte '${name}' nicht im Header`);
  return i;
}

// ---------------------------------------------------------------------------
// Dateien laden und validieren
// ---------------------------------------------------------------------------

// --- marker.tsv ---
const markerParsed = parseTsv("marker.tsv");
validateExactHeaders(markerParsed, ["marker_id", "label", "beschreibung"]);

// Einfache stabile IDs, optional mit genau einem Namensraum wie "tech:api".
const MARKER_ID_RE = /^[a-z]+(?:_[a-z]+)*(?::[a-z]+(?:_[a-z]+)*)?$/;

const markerById = new Map(); // marker_id → { label, beschreibung }
markerParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const mh = markerParsed.headers;
  const mId          = row[colIdx(mh, "marker_id")];
  const label        = row[colIdx(mh, "label")];
  const beschreibung = row[colIdx(mh, "beschreibung")];

  requireNonEmpty("marker.tsv", lineNum, "marker_id", mId);
  requireNonEmpty("marker.tsv", lineNum, "label", label);
  requireNonEmpty("marker.tsv", lineNum, "beschreibung", beschreibung);

  if (!MARKER_ID_RE.test(mId)) {
    fail(
      "marker.tsv",
      lineNum,
      `marker_id '${mId}' ungültig — erlaubt sind einfache stabile IDs wie tech:api oder cash:discipline`
    );
  }
  if (markerById.has(mId)) {
    fail("marker.tsv", lineNum, `Doppelte marker_id: '${mId}'`);
  }
  markerById.set(mId, { label, beschreibung });
});

if (markerById.size === 0) {
  fail("marker.tsv", 0, "Mindestens 1 Marker erwartet");
}

/** Prüft eine Marker-Referenz-Zelle: leer OK (→ undefined), sonst muss der Marker existieren. */
function checkMarkerRef(filename, lineNum, colName, value) {
  if (value === "" || value === undefined) return undefined;
  if (!markerById.has(value)) {
    fail(filename, lineNum, `Spalte '${colName}': Marker '${value}' existiert nicht in marker.tsv`);
  }
  return value;
}

// --- fragen.tsv ---
const fragenParsed = parseTsv("fragen.tsv");
validateHeaders(fragenParsed, ["frage_id", "phase", "titel", "situation", "braucht_marker", "bezug"]);

const fragenById = new Map(); // frage_id → { phase, titel, situation }
const frageIds = [];

fragenParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const fId = row[colIdx(fragenParsed.headers, "frage_id")];
  const phaseStr = row[colIdx(fragenParsed.headers, "phase")];
  const titel = row[colIdx(fragenParsed.headers, "titel")];
  const situation = row[colIdx(fragenParsed.headers, "situation")];
  const bezug = row[colIdx(fragenParsed.headers, "bezug")];

  // Eindeutigkeit frage_id
  if (fragenById.has(fId)) {
    fail("fragen.tsv", lineNum, `Doppelte frage_id: '${fId}'`);
  }

  requireNonEmpty("fragen.tsv", lineNum, "frage_id", fId);
  requireNonEmpty("fragen.tsv", lineNum, "titel", titel);
  requireNonEmpty("fragen.tsv", lineNum, "situation", situation);

  // phase ist entweder Ganzzahl 1-5 oder die Sondersituation "krise"
  let phase;
  if (phaseStr === "krise") {
    phase = "krise";
  } else {
    phase = parseIntCell("fragen.tsv", lineNum, "phase", phaseStr, false);
    if (phase < 1 || phase > 5) {
      fail("fragen.tsv", lineNum, `Spalte 'phase': Wert ${phase} außerhalb des erlaubten Bereichs 1–5 oder 'krise'`);
    }
  }

  const brauchtMarker = checkMarkerRef("fragen.tsv", lineNum, "braucht_marker", row[colIdx(fragenParsed.headers, "braucht_marker")]);
  fragenById.set(fId, { phase, titel, situation, brauchtMarker, bezug });
  frageIds.push(fId);
});

// Pro Phase (1-5) mindestens 2 Fragen
for (let p = 1; p <= 5; p++) {
  const count = [...fragenById.values()].filter((f) => f.phase === p).length;
  if (count < 2) {
    fail("fragen.tsv", 0, `Phase ${p} hat nur ${count} Frage(n) — mindestens 2 erwartet`);
  }
}

const krisenFragen = [...fragenById.entries()]
  .filter(([, f]) => f.phase === "krise")
  .map(([fId]) => fId);
if (krisenFragen.length < 1) {
  fail("fragen.tsv", 0, "Mindestens 1 Frage mit phase 'krise' erwartet");
}

// --- antworten.tsv ---
const antwortenParsed = parseTsv("antworten.tsv");
validateHeaders(antwortenParsed, [
  "frage_id", "antwort_id", "antwort", "punkte",
  "growth", "innovation", "community", "impact", "geld", "ergebnis", "setzt_marker",
]);

// Map: frage_id → Array von Antwort-Objekten (Reihenfolge: alphabetisch nach antwort_id)
const antwortenByFrage = new Map(); // frage_id → Antwort[]
const antwortenPairs = new Set(); // "frage_id|antwort_id" für Eindeutigkeit

antwortenParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const ah = antwortenParsed.headers;
  const fId   = row[colIdx(ah, "frage_id")];
  const aId   = row[colIdx(ah, "antwort_id")];
  const label = row[colIdx(ah, "antwort")];
  const ergebnis = row[colIdx(ah, "ergebnis")];

  requireNonEmpty("antworten.tsv", lineNum, "frage_id", fId);
  requireNonEmpty("antworten.tsv", lineNum, "antwort_id", aId);
  requireNonEmpty("antworten.tsv", lineNum, "antwort", label);
  requireNonEmpty("antworten.tsv", lineNum, "ergebnis", ergebnis);

  // Eindeutigkeit frage_id+antwort_id
  const pair = `${fId}|${aId}`;
  if (antwortenPairs.has(pair)) {
    fail("antworten.tsv", lineNum, `Doppeltes Paar frage_id+antwort_id: '${fId}' + '${aId}'`);
  }
  antwortenPairs.add(pair);

  // frage_id muss in fragen.tsv existieren
  if (!fragenById.has(fId)) {
    fail("antworten.tsv", lineNum, `frage_id '${fId}' existiert nicht in fragen.tsv`);
  }

  const punkte = parseIntCell("antworten.tsv", lineNum, "punkte", row[colIdx(ah, "punkte")], false);
  const growth     = parseIntCell("antworten.tsv", lineNum, "growth",     row[colIdx(ah, "growth")]);
  const innovation = parseIntCell("antworten.tsv", lineNum, "innovation", row[colIdx(ah, "innovation")]);
  const community  = parseIntCell("antworten.tsv", lineNum, "community",  row[colIdx(ah, "community")]);
  const impact     = parseIntCell("antworten.tsv", lineNum, "impact",     row[colIdx(ah, "impact")]);
  const geld       = parseIntCell("antworten.tsv", lineNum, "geld",       row[colIdx(ah, "geld")]);

  const effects = {};
  if (growth     !== undefined) effects.growth     = growth;
  if (innovation !== undefined) effects.innovation = innovation;
  if (community  !== undefined) effects.community  = community;
  if (impact     !== undefined) effects.impact     = impact;
  if (geld       !== undefined) effects.cash       = geld;

  // setzt_marker: leer = neutrale Antwort, sonst muss der Marker existieren
  const setztMarker = checkMarkerRef("antworten.tsv", lineNum, "setzt_marker", row[colIdx(ah, "setzt_marker")]);

  if (!antwortenByFrage.has(fId)) antwortenByFrage.set(fId, []);
  antwortenByFrage.get(fId).push({ id: aId, label, effects, points: punkte, outcome: ergebnis, setsMarker: setztMarker });
});

// Jede frage_id in fragen.tsv muss Antworten haben und umgekehrt; pro Frage EXAKT 3 Antworten
for (const fId of frageIds) {
  const antworten = antwortenByFrage.get(fId) || [];
  if (antworten.length !== 3) {
    fail("antworten.tsv", 0, `frage_id '${fId}' hat ${antworten.length} Antwort(en) — EXAKT 3 erwartet`);
  }
  const frage = fragenById.get(fId);
  const hasNonNegativeCashOption = antworten.some((a) => (a.effects.cash ?? 0) >= 0);
  const hasCashPositiveOption = antworten.some((a) => (a.effects.cash ?? 0) > 0);
  if (frage?.phase === "krise" && !hasCashPositiveOption) {
    fail(
      "antworten.tsv",
      0,
      `Krisenfrage '${fId}' braucht mindestens 1 cash-positive Rettungsoption (geld > 0)`
    );
  }
  if (frage?.phase !== "krise" && !hasNonNegativeCashOption) {
    warn(
      "antworten.tsv",
      0,
      `frage_id '${fId}' hat keine Option mit geld ≥ 0 — Laufzeit-Guard "Letzter Ausweg" muss greifen`
    );
  }
}

// Alle antworten frage_ids müssen in fragen.tsv sein (bereits oben geprüft, aber Vollständigkeit)
for (const fId of antwortenByFrage.keys()) {
  if (!fragenById.has(fId)) {
    fail("antworten.tsv", 0, `frage_id '${fId}' in antworten.tsv, aber nicht in fragen.tsv`);
  }
}

// --- events.tsv ---
const eventsParsed = parseTsv("events.tsv");
validateHeaders(eventsParsed, [
  "event_id", "kategorie", "titel", "text",
  "growth", "innovation", "community", "impact", "geld",
  "braucht_marker", "bezug",
]);

const GUELTIGE_KATEGORIEN = new Set(["verein", "markt"]);
const eventIds = new Set();
const eventsData = [];
let hatVerein = false;
let hatMarkt = false;

eventsParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const eh = eventsParsed.headers;
  const eId      = row[colIdx(eh, "event_id")];
  const kategorie = row[colIdx(eh, "kategorie")];
  const titel    = row[colIdx(eh, "titel")];
  const text     = row[colIdx(eh, "text")];

  requireNonEmpty("events.tsv", lineNum, "event_id", eId);
  requireNonEmpty("events.tsv", lineNum, "titel", titel);
  requireNonEmpty("events.tsv", lineNum, "text", text);

  if (eventIds.has(eId)) {
    fail("events.tsv", lineNum, `Doppelte event_id: '${eId}'`);
  }
  eventIds.add(eId);

  if (!GUELTIGE_KATEGORIEN.has(kategorie)) {
    fail("events.tsv", lineNum, `Spalte 'kategorie': '${kategorie}' nicht erlaubt — erlaubt: verein, markt`);
  }

  const bezug = row[colIdx(eh, "bezug")];
  const brauchtMarker = checkMarkerRef("events.tsv", lineNum, "braucht_marker", row[colIdx(eh, "braucht_marker")]);

  if (kategorie === "verein") hatVerein = true;
  if (kategorie === "markt") hatMarkt = true;

  const growth     = parseIntCell("events.tsv", lineNum, "growth",     row[colIdx(eh, "growth")]);
  const innovation = parseIntCell("events.tsv", lineNum, "innovation", row[colIdx(eh, "innovation")]);
  const community  = parseIntCell("events.tsv", lineNum, "community",  row[colIdx(eh, "community")]);
  const impact     = parseIntCell("events.tsv", lineNum, "impact",     row[colIdx(eh, "impact")]);
  const geld       = parseIntCell("events.tsv", lineNum, "geld",       row[colIdx(eh, "geld")]);

  const effects = {};
  if (growth     !== undefined) effects.growth     = growth;
  if (innovation !== undefined) effects.innovation = innovation;
  if (community  !== undefined) effects.community  = community;
  if (impact     !== undefined) effects.impact     = impact;
  if (geld       !== undefined) effects.cash       = geld;

  eventsData.push({
    id: eId,
    category: kategorie,
    title: titel,
    text,
    effects,
    requiresMarker: brauchtMarker,
    referenceText: bezug,
  });
});

if (!hatVerein) fail("events.tsv", 0, "Mindestens 1 Event mit kategorie 'verein' erwartet");
if (!hatMarkt) fail("events.tsv", 0, "Mindestens 1 Event mit kategorie 'markt' erwartet");

// --- gruendertypen.tsv ---
const gruenderParsed = parseTsv("gruendertypen.tsv");
validateHeaders(gruenderParsed, ["typ", "name", "tagline", "beschreibung", "emoji"]);

const PFLICHT_TYPEN = new Set(["growth", "innovation", "community", "impact", "balanced"]);
const gefundeneTypen = new Set();
const gruenderData = {};

gruenderParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const gh = gruenderParsed.headers;
  const typ         = row[colIdx(gh, "typ")];
  const name        = row[colIdx(gh, "name")];
  const tagline     = row[colIdx(gh, "tagline")];
  const beschreibung = row[colIdx(gh, "beschreibung")];
  const emoji       = row[colIdx(gh, "emoji")];

  requireNonEmpty("gruendertypen.tsv", lineNum, "typ", typ);
  requireNonEmpty("gruendertypen.tsv", lineNum, "name", name);
  requireNonEmpty("gruendertypen.tsv", lineNum, "tagline", tagline);
  requireNonEmpty("gruendertypen.tsv", lineNum, "beschreibung", beschreibung);
  requireNonEmpty("gruendertypen.tsv", lineNum, "emoji", emoji);

  if (gefundeneTypen.has(typ)) {
    fail("gruendertypen.tsv", lineNum, `Doppelter typ: '${typ}'`);
  }
  gefundeneTypen.add(typ);

  gruenderData[typ] = { key: typ, name, tagline, description: beschreibung, emoji };
});

// Exakt die Pflicht-Menge
const missingTypen = [...PFLICHT_TYPEN].filter((t) => !gefundeneTypen.has(t));
const extraTypen = [...gefundeneTypen].filter((t) => !PFLICHT_TYPEN.has(t));
if (missingTypen.length > 0) {
  fail("gruendertypen.tsv", 0, `Fehlende Typen: ${missingTypen.join(", ")}`);
}
if (extraTypen.length > 0) {
  fail("gruendertypen.tsv", 0, `Unbekannte Typen: ${extraTypen.join(", ")}`);
}

// --- texte.tsv ---
const texteParsed = parseTsv("texte.tsv");
validateHeaders(texteParsed, ["bereich", "schluessel", "wert"]);

const texteMap = new Map(); // "bereich/schluessel" → wert
texteParsed.rows.forEach((row, rowIdx) => {
  const lineNum = rowIdx + 2;
  const th = texteParsed.headers;
  const bereich   = row[colIdx(th, "bereich")];
  const schluessel = row[colIdx(th, "schluessel")];
  const wert      = row[colIdx(th, "wert")];

  requireNonEmpty("texte.tsv", lineNum, "bereich", bereich);
  requireNonEmpty("texte.tsv", lineNum, "schluessel", schluessel);
  requireNonEmpty("texte.tsv", lineNum, "wert", wert);

  texteMap.set(`${bereich}/${schluessel}`, wert);
});

// Pflicht-Schlüssel prüfen
const PFLICHT_INTRO = ["intro/startup", "intro/oneLiner", "intro/pitch"];
for (const key of PFLICHT_INTRO) {
  if (!texteMap.has(key)) {
    fail("texte.tsv", 0, `Pflicht-Schlüssel '${key}' fehlt`);
  }
}
// Mindestens bedingung1
if (!texteMap.has("intro/bedingung1")) {
  fail("texte.tsv", 0, "Pflicht-Schlüssel 'intro/bedingung1' fehlt");
}
// Exakt phase1-phase5 mit name und intro
for (let p = 1; p <= 5; p++) {
  if (!texteMap.has(`phase${p}/name`)) {
    fail("texte.tsv", 0, `Pflicht-Schlüssel 'phase${p}/name' fehlt`);
  }
  if (!texteMap.has(`phase${p}/intro`)) {
    fail("texte.tsv", 0, `Pflicht-Schlüssel 'phase${p}/intro' fehlt`);
  }
}

console.log("✓ Alle TSV-Dateien validiert");

// ---------------------------------------------------------------------------
// Daten aus texte.tsv rekonstruieren
// ---------------------------------------------------------------------------

const scenarioIntro = {
  startup:  texteMap.get("intro/startup"),
  oneLiner: texteMap.get("intro/oneLiner"),
  pitch:    texteMap.get("intro/pitch"),
  conditions: [],
};
// Alle bedingungen einsammeln (bedingung1, bedingung2, ...)
let bedNr = 1;
while (texteMap.has(`intro/bedingung${bedNr}`)) {
  scenarioIntro.conditions.push(texteMap.get(`intro/bedingung${bedNr}`));
  bedNr++;
}

// PHASES rekonstruieren (als readonly-kompatibles Array)
const phasesData = [];
for (let p = 1; p <= 5; p++) {
  phasesData.push({
    n: p,
    name:  texteMap.get(`phase${p}/name`),
    intro: texteMap.get(`phase${p}/intro`),
  });
}

// ---------------------------------------------------------------------------
// SCENARIOS aufbauen (Antworten alphabetisch nach antwort_id sortieren)
// ---------------------------------------------------------------------------

const scenarios = frageIds.map((fId) => {
  const { phase, titel, situation, brauchtMarker, bezug } = fragenById.get(fId);
  const options = (antwortenByFrage.get(fId) || [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    id: fId,
    phase,
    title: titel,
    situation,
    options,
    requiresMarker: brauchtMarker,
    referenceText: bezug,
  };
});

// ---------------------------------------------------------------------------
// TypeScript-Quelldatei generieren
// ---------------------------------------------------------------------------

/** String mit JSON.stringify escapen. */
function esc(str) {
  return JSON.stringify(str);
}

/** Effekt-Objekt als TS-Literal-Ausdruck. */
function renderEffects(effects) {
  const entries = Object.entries(effects);
  if (entries.length === 0) return "{}";
  return `{ ${entries.map(([k, v]) => `${k}: ${v}`).join(", ")} }`;
}

/** Option als mehrzeiliges TS-Literal. */
function renderOption(opt) {
  const lines = [
    `        {`,
    `          id: ${esc(opt.id)},`,
    `          label: ${esc(opt.label)},`,
    `          effects: ${renderEffects(opt.effects)},`,
    `          points: ${opt.points},`,
    `          outcome: ${esc(opt.outcome)},`,
  ];
  // Optionales Feld nur ausgeben, wenn gesetzt — hält die generierte Datei schlank
  if (opt.setsMarker) lines.push(`          setsMarker: ${esc(opt.setsMarker)},`);
  lines.push(`        }`);
  return lines.join("\n");
}

/** Szenario als mehrzeiliges TS-Literal. */
function renderScenario(s) {
  const optStr = s.options.map(renderOption).join(",\n");
  const phaseExpr = typeof s.phase === "string" ? esc(s.phase) : s.phase;
  const lines = [
    `  {`,
    `    id: ${esc(s.id)},`,
    `    phase: ${phaseExpr},`,
    `    title: ${esc(s.title)},`,
    `    situation: ${esc(s.situation)},`,
  ];
  if (s.requiresMarker) {
    lines.push(`    requiresMarker: ${esc(s.requiresMarker)},`);
  }
  if (s.referenceText) {
    lines.push(`    referenceText: ${esc(s.referenceText)},`);
  }
  lines.push(`    options: [`, optStr, `    ],`, `  }`);
  return lines.join("\n");
}

/** LuckEvent als mehrzeiliges TS-Literal. */
function renderEvent(ev) {
  const lines = [
    `  {`,
    `    id: ${esc(ev.id)},`,
    `    title: ${esc(ev.title)},`,
    `    text: ${esc(ev.text)},`,
    `    effects: ${renderEffects(ev.effects)},`,
    `    category: ${esc(ev.category)},`,
  ];
  if (ev.requiresMarker) {
    lines.push(`    requiresMarker: ${esc(ev.requiresMarker)},`);
  }
  if (ev.referenceText) {
    lines.push(`    referenceText: ${esc(ev.referenceText)},`);
  }
  lines.push(`  }`);
  return lines.join("\n");
}

/** FounderType-Eintrag als TS-Literal. */
function renderFounderType(key, ft) {
  return [
    `  ${key}: {`,
    `    key: ${esc(ft.key)},`,
    `    name: ${esc(ft.name)},`,
    `    tagline: ${esc(ft.tagline)},`,
    `    description: ${esc(ft.description)},`,
    `    emoji: ${esc(ft.emoji)},`,
    `  }`,
  ].join("\n");
}

/** PHASES-Array als TS-Literal (as const für Readonly-Kompatibilität). */
function renderPhases(phases) {
  const entries = phases
    .map((p) => `  { n: ${p.n} as const, name: ${esc(p.name)}, intro: ${esc(p.intro)} }`)
    .join(",\n");
  return `[\n${entries},\n] as const`;
}

// Reihenfolge der Founder-Types in der Ausgabe
const FOUNDER_OUTPUT_ORDER = ["growth", "innovation", "community", "impact", "balanced"];

const tsOutput = `// AUTOGENERIERT — nicht von Hand editieren, Quelle: content/*.tsv
// Generiert von: scripts/generate-content.mjs
// Letzter Build: ${new Date().toISOString()}

import type {
  Scenario,
  LuckEvent,
  FounderType,
  MarkerDef,
  StatKey,
} from "./gameData";

// ---------------------------------------------------------------------------
// Marker
// ---------------------------------------------------------------------------
export const MARKERS: MarkerDef[] = [
${[...markerById.entries()]
  .map(([id, m]) => `  { id: ${esc(id)}, label: ${esc(m.label)}, description: ${esc(m.beschreibung)} }`)
  .join(",\n")}
];

// ---------------------------------------------------------------------------
// Szenarien
// ---------------------------------------------------------------------------
export const SCENARIOS: Scenario[] = [
${scenarios.map(renderScenario).join(",\n")}
];

// ---------------------------------------------------------------------------
// Glücks-Events
// ---------------------------------------------------------------------------
export const LUCK_EVENTS: LuckEvent[] = [
${eventsData.map(renderEvent).join(",\n")}
];

// ---------------------------------------------------------------------------
// Founder-Typen
// ---------------------------------------------------------------------------
export const FOUNDER_TYPES: Record<StatKey | "balanced", FounderType> = {
${FOUNDER_OUTPUT_ORDER.map((k) => renderFounderType(k, gruenderData[k])).join(",\n")}
};

// ---------------------------------------------------------------------------
// Szenario-Intro
// ---------------------------------------------------------------------------
export const SCENARIO_INTRO = {
  startup: ${esc(scenarioIntro.startup)},
  oneLiner: ${esc(scenarioIntro.oneLiner)},
  pitch: ${esc(scenarioIntro.pitch)},
  conditions: [
${scenarioIntro.conditions.map((c) => `    ${esc(c)}`).join(",\n")}
  ],
};

// ---------------------------------------------------------------------------
// Phasen (as const für Readonly-Kompatibilität mit PHASES.find() und .map())
// ---------------------------------------------------------------------------
export const PHASES = ${renderPhases(phasesData)};
`;

writeFileSync(OUT_FILE, tsOutput, "utf8");
console.log(`✓ Geschrieben: src/lib/gameContent.generated.ts (${scenarios.length} Szenarien, ${eventsData.length} Events, ${markerById.size} Marker)`);
console.log("✅ Generierung abgeschlossen.");
