# S6: Headless-Simulation — Invarianten & Spezifikation

## Überblick

Dieses Dokument spezifiziert ein Headless-Simulations-Script (`scripts/simulate.mjs`), das die Kern-Spiellogik automatisiert testet. Das Script führt **mindestens 2000 deterministische Läufe** mit verschiedenen Strategien durch, prüft dabei **Invarianten** und erzeugt einen strukturierten Report mit Abhilfeinformationen bei Verstößen.

---

## 1. Invarianten (Assertions)

Alle Invarianten werden **pro Lauf** geprüft. Bei Verstoß wird der Fehler mit Seed, Entscheidungspfad und Lauf-State dokumentiert.

### 1.1 Slot-Struktur

**I1.1.1: Slot-Count**
```
slots.length <= 9
```
- Die normale Reihenfolge (NORMAL_SLOTS) hat 8 Slots.
- Maximal 1 Krise-Slot wird eingefügt → 9 Slots max.

**I1.1.2: Maximal eine Krisen-Slot**
```
slots.filter(s => s.kind === 'crisis').length <= 1
```
- Pro Lauf kann nur einmal die Krise ausgelöst werden.

---

### 1.2 Entscheidungslogik

**I1.2.1: Jeder Slot hat wählbare Optionen**
```
For each slot in slots (excluding "alloc" und "event"):
  resolveStep(runSeed, slot) returns a Step with 
    step.scenario.options.length >= 1 &&
    options.filter(o => !isOptionLocked(o, currentCash)).length >= 1
```
- Wenigstens eine Option pro Szenario darf nicht durch Geldmangel gesperrt sein.
- `isOptionLocked(option, cash)` prüft: `option.effects.cash < 0 && -option.effects.cash > cash`.

**I1.2.2: Determinismus — Seed + Entscheidungsfolge**
```
Let run1 = simulate(seed=42, strategy=fixedDecisions)
Let run2 = simulate(seed=42, strategy=fixedDecisions)  // identische Entscheidungen
deepEqual(run1.slots, run2.slots) &&
deepEqual(run1.stats, run2.stats) &&
deepEqual(run1.finalScore, run2.finalScore)
```
- Bei gleichem Seed und identischer Entscheidungsfolge müssen alle stochastischen Ausgaben (Szenario-Auswahl, Option-Reihenfolge) **exakt wiederholt** werden.
- Seed-basiert über `mulberry32(hashSlot(runSeed, key))` für jedes `pickBySeed()`-Aufruf.

---

### 1.3 Lauf-Abschluss & Scoring

**I1.3.1: Normalabschluss**
```
Jeder Lauf durchläuft bis zum Schluss-Slot (letzte normale Entscheidung)
oder wird explizit abgebrochen. Falls abgebrochen:
  completedSteps.length >= 1
```
- Ein leerer Lauf ist nicht zulässig.

**I1.3.2: Score ist berechenbar (keine NaN/undefined)**
```
result.finalScore ∈ ℤ &&
Number.isFinite(result.finalScore) &&
result.finalScore !== NaN
```
- `computeScore(stats, decisionPoints)` gibt immer ein gültiges Integer zurück.
- Keine undefined/null in `stats`, `decisionPoints` oder Zwischen-Ergebnissen.

**I1.3.3: Cash-Stand nicht unterhalb 0**
```
result.stats.cash >= 0 &&
result.cashRaw >= 0
```
- `applyEffects()` und `applyAllocation()` clippen auf Math.max(0, ...).

**I1.3.4: Säulen-Werte ≥ 0**
```
For each scoreKey in [product, market, team, culture]:
  result.stats[scoreKey] >= 0
```

---

### 1.4 Krise-Determinismus

**I1.4.1: Krise ändert normale Slots nicht**
```
Let pathWithCrisis = simulate(seed=42, trigger_crisis=true, strategy=S)
Let pathWithoutCrisis = simulate(seed=42, trigger_crisis=false, strategy=S)
// Slot-Reihenfolge vor der Krisen-Einfügung identisch
normalSlotsBeforeCrisis(pathWithCrisis) == normalSlotsBeforeCrisis(pathWithoutCrisis)
```
- Das Einfügen einer Krise an Position X verschiebt die nachfolgenden normalen Slots, änert aber nicht deren Identität oder seed-basierte Auswahl.

**I1.4.2: Krise-Auswahl deterministisch**
```
resolveStep(seed=42, crisesSlot) -> crisis_scenario
resolveStep(seed=42, crisisSlot) -> (same crisis_scenario)
```
- Die Krise selbst wird auch seed-determiniert gewählt.

---

### 1.5 Echo & P5-Auswahl (markergebunden)

**I1.5.1: Maximal ein Echo pro Lauf**
```
completed.filter(step => step.scenario?.category === 'echo').length <= 1
```
- Echo ist an einen Marker gebunden (z. B. bei Crisis/P2/P3 trigger).

**I1.5.2: Echo-Auswahl deterministisch**
```
resolveStep(seed, echoSlot) returns same scenario 
  when called twice with same seed & preceding context
```
- Verwendet `pickBySeed(pool, seed, 'echo:pick')`.

---

## 2. Import & Toolchain

### 2.1 Verfügbare Optionen (Reihenfolge: Vorzug)

| Option | Verfügbarkeit | Aufwand | Empfehlung |
|--------|--------------|--------|------------|
| **Option A: TypeScript via `node_modules/.bin/tsc`** | ✓ Vorhanden | Niedrig | **EMPFOHLEN** |
| Option B: Next.js `.next/` Build (React-gebunden) | ✓ Vorhanden | Mittel | Nicht geeignet (UI-overhead) |
| Option C: Manuelle TS→JS-Transpilation im Script | - | Hoch | Fallback; nicht nötig |

### 2.2 Empfohlener Weg: TypeScript via tsc

**Struktur:**
```
scripts/simulate.ts          # TypeScript-Quelle
  ├─ import { deriveSlots, resolveStep, ... } from '../src/lib/gameLogic'
  ├─ defineStrategies() → { random, cheapest, expensive, scoreGreedy, allocationVariants }
  ├─ runSimulation(seed, strategy) → { stats, cashRaw, points, slots, finalScore, violations }
  └─ reportSummary(runs) → { totalRuns, crisisCounts, echoViolations, scoreDistribution, ... }

scripts/simulate.mjs         # npm-Script (Wrapper)
  └─ exec: node_modules/.bin/tsc scripts/simulate.ts --outDir scripts --module esnext --target es2020 --skipLibCheck --esModuleInterop
  └─ then: node scripts/simulate.js --runs 2000 --seed-start 1
```

**Build-Befehl (in `package.json`):**
```json
"scripts": {
  "simulate": "tsc scripts/simulate.ts --outDir scripts --module esnext --target es2020 --skipLibCheck --esModuleInterop && node scripts/simulate.js --runs 2000"
}
```

**Alternativ (einfacher, direkter):**
```mjs
// scripts/simulate.mjs (Node 18+)
import { execSync } from 'child_process';

// Kompiliere TS zu JS inline
execSync('tsc scripts/simulate.ts --outDir scripts --module esnext --target es2020 --skipLibCheck', { stdio: 'inherit' });

// Laden + Starten
const { runSimulation } = await import('./simulate.js');
// ... Simulation starten
```

**Warum nicht tsx/npx tsx:**
- tsx nicht installiert, würde neue Dependency erfordern.
- tsc ist bereits in `node_modules/.bin/` vorhanden (als transitive Dev-Dep von TypeScript).
- Kein Runtime-Overhead für ts-node; einfacher tsc-Aufruf.

---

## 3. Lauf-Schleife & Strategie-Framework

### 3.1 Pseudocode

```typescript
interface SimulationConfig {
  runs: number;              // z.B. 2000
  seedStart?: number;        // default: 1
  strategy: Strategy;
  verbose?: boolean;         // console.log pro Lauf
}

interface Strategy {
  name: string;
  pickOption(scenario: Scenario, currentCash: number): Option;
  pickAllocation?(currentCash: number, availableBuckets: number): number[];
}

interface SimulationRun {
  seed: number;
  strategy: string;
  slots: Slot[];
  completed: CompletedStep[];
  stats: Stats;
  cashRaw: number;
  finalScore: number;
  decisionPoints: number;
  violations: Violation[];  // Invarianten-Verstöße
  path: string;             // "P1→random,P2→cheap,crisis@4,alloc→[3k,0,0,0],..."
}

interface Violation {
  invariant: string;        // z.B. "I1.1.2", "I1.2.1"
  message: string;
  severity: "error" | "warn";
}

function simulate(config: SimulationConfig): SimulationRun[] {
  const results: SimulationRun[] = [];
  
  for (let i = 0; i < config.runs; i++) {
    const seed = config.seedStart + i;
    const run = runSingleLaunch(seed, config.strategy);
    results.push(run);
    
    if (config.verbose) {
      console.log(`[${seed}] ${run.strategy}: ${run.finalScore} pts, violations: ${run.violations.length}`);
    }
  }
  
  return results;
}

function runSingleLaunch(seed: number, strategy: Strategy): SimulationRun {
  let stats = { ...INITIAL_STATS };
  let cashRaw = INITIAL_STATS.cash;
  let decisionPoints = 0;
  const completed: CompletedStep[] = [];
  const violations: Violation[] = [];
  const path: string[] = [];
  
  // Slots ableiten (wird nach jeder Entscheidung neu berechnet)
  let slots = deriveSlots(completed);
  
  while (slots.length > 0) {
    const slot = slots[0];
    
    // Slot-Art prüfen
    if (slot.kind === 'alloc') {
      // Allocation-Entscheidung
      const pot = computeAllocationPot(cashRaw);
      const amounts = strategy.pickAllocation?.(cashRaw, 4) ?? [0, 0, 0, 0];
      completed.push({ kind: 'alloc', amounts });
      cashRaw -= amounts.reduce((s, a) => s + a, 0);
      stats = applyAllocation(stats, amounts);
      if (amounts.reduce((s, a) => s + a, 0) > 0) decisionPoints += ALLOCATION.bonusPoints;
      path.push(`alloc→[${amounts.join(',')}]`);
    } 
    else if (slot.kind === 'event') {
      // Event triggern
      const event = pickBySeed(...)  // LUCK_EVENTS pool
      completed.push({ kind: 'event', event });
      cashRaw += event.effects.cash ?? 0;
      stats = applyEffects(stats, event.effects);
      path.push(`event:${event.id}`);
    }
    else {
      // Decision oder Crisis
      const step = resolveStep(seed, slot);
      if (step.kind === 'decision' || step.kind === 'crisis') {
        // Verfügbare (nicht gesperrte) Optionen
        const available = step.scenario.options.filter(o => !isOptionLocked(o, cashRaw));
        if (available.length === 0) {
          violations.push({
            invariant: 'I1.2.1',
            message: `Keine wählbare Option in ${step.scenario.id} bei cash=${cashRaw}`,
            severity: 'error'
          });
          break; // Lauf abbrechen
        }
        
        const chosen = strategy.pickOption(step.scenario, cashRaw);
        completed.push({
          kind: step.kind,
          scenario: step.scenario,
          chosen
        });
        cashRaw += chosen.effects.cash ?? 0;
        stats = applyEffects(stats, chosen.effects);
        decisionPoints += chosen.points;
        path.push(`${slot.id}→${chosen.id}`);
      }
    }
    
    // Slots neu ableiten (berücksichtigt Krise)
    slots = deriveSlots(completed);
    // Ersten verarbeiteten Slot entfernen (simuliert Fortschritt)
    slots = slots.slice(1);
  }
  
  // Invarianten-Check
  checkInvariants(completed, stats, cashRaw, violations);
  
  const finalScore = computeScore(stats, decisionPoints);
  
  return {
    seed,
    strategy: strategy.name,
    slots: deriveSlots(completed),
    completed,
    stats,
    cashRaw,
    finalScore,
    decisionPoints,
    violations,
    path: path.join(' → ')
  };
}

function checkInvariants(completed, stats, cashRaw, violations) {
  // I1.1.1: Slot-Count <= 9
  const slots = deriveSlots(completed);
  if (slots.length > 9) {
    violations.push({ invariant: 'I1.1.1', message: `Slot-Count ${slots.length} > 9`, severity: 'error' });
  }
  
  // I1.1.2: Max 1 Krise
  const crises = completed.filter(s => s.kind === 'crisis');
  if (crises.length > 1) {
    violations.push({ invariant: 'I1.1.2', message: `${crises.length} Krisen gefunden`, severity: 'error' });
  }
  
  // I1.3.3 / I1.3.4: Stats >= 0
  if (cashRaw < 0) violations.push({ invariant: 'I1.3.3', message: `cashRaw < 0: ${cashRaw}`, severity: 'error' });
  ['product', 'market', 'team', 'culture'].forEach(k => {
    if (stats[k] < 0) violations.push({ invariant: 'I1.3.4', message: `${k} < 0: ${stats[k]}`, severity: 'error' });
  });
  
  // I1.3.2: Score ist Number
  const finalScore = computeScore(stats, completed
    .filter(s => s.kind === 'decision' || s.kind === 'crisis')
    .reduce((sum, s) => sum + s.chosen.points, 0));
  if (!Number.isFinite(finalScore)) {
    violations.push({ invariant: 'I1.3.2', message: `finalScore nicht finite: ${finalScore}`, severity: 'error' });
  }
}
```

### 3.2 Strategien

```typescript
const strategies: Strategy[] = [
  {
    name: 'random',
    pickOption: (scenario, cash) => {
      const available = scenario.options.filter(o => !isOptionLocked(o, cash));
      return available[Math.floor(Math.random() * available.length)];
    }
  },
  {
    name: 'cheapest',
    pickOption: (scenario, cash) => {
      const available = scenario.options.filter(o => !isOptionLocked(o, cash));
      return available.reduce((a, b) => (a.effects.cash ?? 0) > (b.effects.cash ?? 0) ? a : b);
    }
  },
  {
    name: 'expensive',
    pickOption: (scenario, cash) => {
      const available = scenario.options.filter(o => !isOptionLocked(o, cash));
      return available.reduce((a, b) => (a.effects.cash ?? 0) < (b.effects.cash ?? 0) ? a : b);
    }
  },
  {
    name: 'score-greedy',
    pickOption: (scenario, cash) => {
      const available = scenario.options.filter(o => !isOptionLocked(o, cash));
      return available.reduce((a, b) => (b.points ?? 0) > (a.points ?? 0) ? b : a);
    }
  },
  {
    name: 'alloc-none',
    pickAllocation: (cash) => [0, 0, 0, 0]
  },
  {
    name: 'alloc-half',
    pickAllocation: (cash) => {
      const half = Math.floor((cash / 2) / 500) * 500;
      return [half / 4, half / 4, half / 4, half / 4].map(Math.round);
    }
  },
  {
    name: 'alloc-full',
    pickAllocation: (cash) => {
      const pot = computeAllocationPot(cash);
      return [pot / 4, pot / 4, pot / 4, pot / 4].map(Math.round);
    }
  }
];
```

---

## 4. Report-Format

### 4.1 Struktur

```typescript
interface Report {
  timestamp: string;
  totalRuns: number;
  strategies: string[];
  
  // Zusammenfassung
  summary: {
    successfulRuns: number;
    runsWithViolations: number;
    totalViolations: number;
  };
  
  // Slot-Statistik
  slots: {
    crisisRuns: number;
    echoRuns: number;
    averageSlotCount: number;
  };
  
  // Score-Verteilung pro Strategie
  scoreDistribution: {
    [strategy: string]: {
      min: number;
      max: number;
      mean: number;
      median: number;
      stdDev: number;
    }
  };
  
  // Violations
  violations: {
    [invariant: string]: {
      count: number;
      examples: Array<{ seed: number; message: string; path: string }>
    }
  };
  
  // Reproduzierungspfade
  failingRuns: Array<{
    seed: number;
    strategy: string;
    violations: Violation[];
    path: string;
    command: string; // z.B. "node scripts/simulate.js --seed 42 --strategy random --verbose"
  }>
}
```

### 4.2 Report-Ausgabe (Text)

```
═══════════════════════════════════════════════════════════════
VCM Startup-Simulation — Invarianten-Report
2024-12-15T14:32:00Z
═══════════════════════════════════════════════════════════════

Runs: 2000
Strategies: random, cheapest, expensive, score-greedy, alloc-none, alloc-half, alloc-full

SUMMARY
───────────────────────────────────────────────────────────────
Successful:          1987 runs (99.35%)
With Violations:     13 runs (0.65%)
Total Violations:    18

SLOTS & EVENTS
───────────────────────────────────────────────────────────────
Runs with Crisis:    257 (12.85%)
Runs with Echo:      183 (9.15%)
Avg Slot Count:      8.05

SCORE DISTRIBUTION (mean ± σ)
───────────────────────────────────────────────────────────────
random:              342 ± 87
cheapest:            298 ± 102
expensive:           415 ± 76
score-greedy:        475 ± 63
alloc-none:          225 ± 91
alloc-half:          287 ± 78
alloc-full:          412 ± 85

VIOLATIONS (Invarianten-Verstöße)
───────────────────────────────────────────────────────────────
I1.2.1 (No selectable option):
  Count: 8
  Seed 142 (random):   "Keine wählbare Option in p2 bei cash=−500"
    Path: P1→cheap, P2→expensive, ...
    Reproduce: node scripts/simulate.js --seed 142 --strategy random --verbose
  Seed 289 (cheapest): "Keine wählbare Option in alloc bei cash=−200"
    Path: P1→cheap, P3→expensive, ...
    Reproduce: node scripts/simulate.js --seed 289 --strategy cheapest --verbose

I1.3.3 (Cash < 0):
  Count: 10
  [...]

═══════════════════════════════════════════════════════════════
```

---

## 5. Abbruchkriterien & Fehlerbehandlung

- **Keine wählbare Option:** Lauf sofort abbrechen, Violation dokumentieren.
- **NaN/undefined in Werten:** Violation, Lauf trotzdem fertigstellen.
- **Cash < 0:** Violation (sollte nicht vorkommen, wenn applyEffects korrekt clipt).
- **Mehr als 1 Krise:** Violation, Lauf weiterführen.

---

## 6. Implementierungs-Checkliste

- [ ] `scripts/simulate.ts` erzeugen (TypeScript-Quelle)
  - [ ] `deriveSlots`, `resolveStep`, `applyEffects`, etc. importieren
  - [ ] 7 Strategien implementieren
  - [ ] Invarianten-Checks in `checkInvariants()`
  - [ ] Report-Generator
- [ ] Build-Script in `package.json`: `"simulate": "tsc ... && node scripts/simulate.js"`
- [ ] CLI-Optionen: `--runs`, `--seed-start`, `--strategy`, `--verbose`
- [ ] Test: `npm run simulate --runs 100 --verbose`
  - Mindestens 2 Krisen erwartet, mindestens 1 Echo
  - Keine Violations ausgegeben → OK
- [ ] Report zu stdout oder `sim-report.json`

---

## 7. Beispiel-Kommandos (Zielzustand)

```bash
# Schnelltest: 100 Läufe
npm run simulate -- --runs 100

# Vollständige Simulation: 2000 Läufe, alle Strategien
npm run simulate -- --runs 2000

# Eine Strategie, verbose, Seed-Bereich
npm run simulate -- --runs 50 --seed-start 1 --strategy score-greedy --verbose

# Einen fehlgeschlagenen Lauf reproduzieren
npm run simulate -- --runs 1 --seed 142 --strategy random --verbose
```

---

## Anhang: Verwandte Dateien

- **Spiellogik:** `/src/lib/gameLogic.ts` (Quelle, read-only)
- **Content-Datenbank:** `/src/lib/content.ts` (Szenarien, Optionen, Events)
- **Build-Output:** `/.next/` (Next.js-Build für Referenz)

---

**Version:** S6-Spec-001  
**Datum:** 2024-12-15  
**Status:** Bereit zur Implementierung
