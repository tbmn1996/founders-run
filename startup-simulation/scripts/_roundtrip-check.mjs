// ============================================================================
// _roundtrip-check.mjs — Round-Trip-Verifikation
// ----------------------------------------------------------------------------
// Prüft ob der Generator aus den TSVs exakt dieselben Daten erzeugt, die
// beim ursprünglichen Snapshot aus gameData.ts extrahiert wurden.
//
// Aufruf: node scripts/_roundtrip-check.mjs
// Erwartetes Ergebnis: "0 Abweichungen"
// ============================================================================

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);

// TypeScript ist als devDependency vorhanden
let ts;
try {
  ts = require("typescript");
} catch {
  console.error("❌ typescript-Paket nicht gefunden. Bitte npm install ausführen.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/** Rekursiv alphabetisch sortierte Schlüssel. */
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

/** Serialisiert Objekt mit sortierten Schlüsseln für Vergleich. */
function serialize(data) {
  return JSON.stringify(sortKeysDeep(data), null, 2);
}

/**
 * Findet die erste Abweichung zwischen zwei JSON-Strings.
 * Gibt die erste unterschiedliche Zeile zurück.
 */
function firstDiff(a, b) {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const maxLen = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < maxLen; i++) {
    if (linesA[i] !== linesB[i]) {
      return {
        lineNum: i + 1,
        expected: linesA[i] ?? "(fehlt in Snapshot)",
        actual: linesB[i] ?? "(fehlt in generierter Datei)",
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Snapshot laden
// ---------------------------------------------------------------------------

const snapshotPath = path.resolve(__dirname, ".content-snapshot.json");
let snapshot;
try {
  snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
} catch (err) {
  console.error(`❌ Snapshot nicht lesbar: ${err.message}`);
  console.error("   Bitte zuerst scripts/_snapshot-gamedata.mjs ausführen.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. gameContent.generated.ts laden und transpilieren
// ---------------------------------------------------------------------------

const generatedPath = path.resolve(ROOT, "src/lib/gameContent.generated.ts");
let generatedSource;
try {
  generatedSource = readFileSync(generatedPath, "utf8");
} catch (err) {
  console.error(`❌ gameContent.generated.ts nicht lesbar: ${err.message}`);
  console.error("   Bitte zuerst scripts/generate-content.mjs ausführen.");
  process.exit(1);
}

// Import-Zeile mit Typ-Importen entfernen (nur type-imports, kein Runtime-Code)
// Dann transpilieren
const result = ts.transpileModule(generatedSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: false,
    // Typ-only-Importe werden vom Transpiler automatisch entfernt
  },
  fileName: "gameContent.generated.ts",
});

if (result.diagnostics && result.diagnostics.length > 0) {
  console.error("❌ Transpilierungsfehler in gameContent.generated.ts:");
  result.diagnostics.forEach((d) => console.error(d.messageText));
  process.exit(1);
}

const genModule = { exports: {} };
const wrappedCode = `(function(module, exports) { ${result.outputText} })(genModule, genModule.exports)`;
try {
  eval(wrappedCode);
} catch (err) {
  console.error("❌ Fehler beim Auswerten von gameContent.generated.ts:", err.message);
  process.exit(1);
}

const {
  SCENARIOS,
  LUCK_EVENTS,
  FOUNDER_TYPES,
  SCENARIO_INTRO,
  PHASES,
} = genModule.exports;

for (const [name, val] of [
  ["SCENARIOS", SCENARIOS],
  ["LUCK_EVENTS", LUCK_EVENTS],
  ["FOUNDER_TYPES", FOUNDER_TYPES],
  ["SCENARIO_INTRO", SCENARIO_INTRO],
  ["PHASES", PHASES],
]) {
  if (!val) {
    console.error(`❌ Export '${name}' fehlt in gameContent.generated.ts`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 3. Deep-Equal-Vergleich (key-sortiert serialisiert)
// ---------------------------------------------------------------------------

const generated = {
  SCENARIOS,
  LUCK_EVENTS,
  FOUNDER_TYPES,
  SCENARIO_INTRO,
  PHASES,
};

const keys = ["SCENARIOS", "LUCK_EVENTS", "FOUNDER_TYPES", "SCENARIO_INTRO", "PHASES"];
let totalAbweichungen = 0;

for (const key of keys) {
  const snapshotSer = serialize(snapshot[key]);
  const generatedSer = serialize(generated[key]);

  if (snapshotSer === generatedSer) {
    console.log(`✓ ${key}: identisch`);
  } else {
    totalAbweichungen++;
    console.error(`❌ ${key}: ABWEICHUNG gefunden`);
    const diff = firstDiff(snapshotSer, generatedSer);
    if (diff) {
      console.error(`   Erste Differenz in Zeile ${diff.lineNum}:`);
      console.error(`   Snapshot:   ${diff.expected}`);
      console.error(`   Generiert:  ${diff.actual}`);
    }
  }
}

console.log("");
if (totalAbweichungen === 0) {
  console.log(`✅ Round-Trip-Check bestanden: 0 Abweichungen`);
  process.exit(0);
} else {
  console.error(`❌ Round-Trip-Check FEHLGESCHLAGEN: ${totalAbweichungen} Abweichung(en)`);
  process.exit(1);
}
