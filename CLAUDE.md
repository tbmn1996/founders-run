# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

**„Founder's Run"** — eine 3-Minuten-Startup-Simulation für den Infostand des Venture Club Münster (VCM) auf der Startup-Contacts-Messe. Besucher starten sie per QR-Code im **Handy-Browser** (primäres Zielgerät: Smartphone, Hochformat) und führen das fiktive Startup „Mira" (KI-Assistentin für Service- und Vertriebsteams in Unternehmen) durch 5 Gründungsphasen.

**Kernanforderung — Standalone:** Die Simulation läuft bewusst **unabhängig von der Messe-App** (eigene URL, eigener Build, keine geteilten Abhängigkeiten), um die App-Entwicklung nicht zu belasten. Die einzige Verbindung zur „Founders Map" der App ist eine lose Schnittstelle: Start mit `?uid=…`, Ergebnis-Rückgabe (`score`, `founderType`) per Redirect oder postMessage. Die Hooks dafür liegen gebündelt in der `Result`-Komponente in `startup-simulation/src/app/page.tsx` und sind **inaktiv**, bis das App-Team das Rückgabe-Format festlegt. Diese Entkopplung nicht aufweichen.

Kommunikationssprache mit Thomas: Deutsch.

## Befehle

Alle Befehle laufen im Ordner `startup-simulation/` (Node ≥ 20 nötig):

```bash
npm install        # Abhängigkeiten installieren
npm run dev        # Dev-Server → http://localhost:3000
                   #   im selben WLAN auch vom Handy über die Netzwerk-IP erreichbar
npm run build      # Produktions-Build
npm run start      # Produktions-Server
npm run lint       # Linting (next lint)
npx vercel --prod  # Deploy via Vercel (aus startup-simulation/; einmalig vorher: npx vercel login)
```

Es gibt keine konfigurierten Tests.

## Verifikation (nach Änderungen Pflicht)

Aus `startup-simulation/` ausführen:

```bash
npx tsc --noEmit   # TypeScript-Fehler → muss 0 ergeben
npm run build      # Produktions-Build → muss fehlerfrei durchlaufen
```

Beides muss grün sein, bevor Änderungen als fertig gelten. Der Build läuft automatisch das Content-Generator-Skript — ein ungültiges TSV bricht den Build ab.

## Git-Arbeitsregel

Wenn auf einem Feature-Branch gearbeitet wird (alles außer `main`), am Ende jedes Turns die abgeschlossenen Änderungen committen und auf den zugehörigen GitHub-Branch pushen. Auf `main` nicht automatisch pushen, außer Thomas hat das explizit für diesen Turn freigegeben.

Sobald ein Turn abgeschlossen ist und die Änderungen auf GitHub nachvollziehbar sind, die Abschlussmeldung immer zusätzlich als Codeblock in diesem Format ausgeben:

```text
Commit-SHA:
Geänderte Dateien:
Tests:
Manuelle Checks:
Bekannte Risiken:
```

## Architektur

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion · lucide-react**. Die gesamte App ist eine einzige Client-Seite, kein Backend, keine Persistenz — die Sim speichert bewusst nichts (Scoreboard lebt in der Messe-App).

**Kapital in Euro:** Startkapital €20.000, Anzeigelimit €120.000; formatiert via `formatMoney()` in `gameLogic.ts`. Stat-Metadaten (Labels, Beschreibungen, Einheiten) liegen zentral in `STAT_META` (gameData.ts).

Strikte Trennung von Inhalt, Logik und Ablauf:

- **`startup-simulation/content/*.tsv`** — ALLE Spielinhalte liegen jetzt als Tabellen-Dateien vor (fragen, antworten, events, gruendertypen, texte). **Inhaltspflege passiert ausschließlich dort** — keine Code-Änderung nötig, um Szenarien zu ergänzen oder zu ändern. Anleitung: `content/README.md`.
- **`scripts/generate-content.mjs`** — Build-Skript, das die TSV-Dateien validiert (eindeutige IDs, Zahlenformat, Konsistenz) und die automatisierte Datei `src/lib/gameContent.generated.ts` (gitignored) generiert. Das Skript wird automatisch vor `npm run dev`, `npm run build` und `npm run lint` ausgeführt und bricht mit deutscher Fehlermeldung (Datei + Zeilennummer) ab, wenn etwas nicht passt — kaputter Inhalt geht nie live. Nach TSV-Änderungen den Dev-Server neu starten (kein Datei-Watch).
- **`src/lib/gameData.ts`** — Spielinhalte-Exports + Spielmechanik-Konstanten: `STAT_META` (Säulen-Labels/Beschreibungen), `ALLOCATION` (Verteil-Runden-Konfiguration), `INITIAL_STATS`. Importiert die generierten Inhalte (`SCENARIOS`, `LUCK_EVENTS`, `FOUNDER_TYPES`, `SCENARIO_INTRO`, `PHASES`) aus `gameContent.generated.ts` und re-exportiert sie.
- **`src/lib/gameLogic.ts`** — deterministische Spiellogik: slot-gekeytes RNG (`mulberry32`, `hashSlot(runSeed, key)`), `deriveSlots(completed)` (baut die Slot-Folge, fügt bei drohender Pleite max. 1 Krisenslot ein), `resolveStep(runSeed, slot, completed)` (zieht Szenario/Event deterministisch, priorisiert Echo-/P5-Marker), `deriveRunState(completed)` (Replay der History → Stats/Cash/Score), `deriveMarkers(completed)` (Marker rein aus `completed` — Single Source of Truth, kein React-State), `deriveAllocFocus()` (Schwerpunkt-Marker der Budget-Runde). Dazu die reinen Helfer `applyEffects`, `computeScore`, `computeAllocationPot`, `applyAllocation`, `cashBand`, `isOptionLocked`, `formatMoney`, `determineFounderType()` (stärkste Säule → Typ, ausgeglichen → Allrounder).
- **`src/app/page.tsx`** — kompletter Spielfluss als Screen-State-Machine (`intro → sim → result`) mit den Komponenten `Intro`, `Sim`, `DecisionCard`, `EventCard`, `Result` (inkl. `RecapItem`-Rückblick mit Alternativen und `Closing`-Abschlussfolie). Hier liegen auch die inaktiven Founders-Map-Hooks.
- **`src/components/StatBar.tsx`** — Anzeige der 4 Säulen (Growth, Innovation, Community, Impact) + Geld.
- **`src/app/globals.css`** — Design-Tokens des „Aura v2"-Designs; Quelle/Referenz ist `docs/DESIGN_SYSTEM.md`.

### Spielmechanik-Invarianten (beim Ändern von Inhalten beachten)

- Jede Option bewegt mehrere Stats **gegenläufig** (Trade-offs) — es darf keinen perfekten Durchlauf geben.
- Punkte pro Entscheidung ca. −10 bis +20; schlechte Entscheidungen kosten.
- 2 Glücks-Events pro Lauf mit bewusst **kleinen** Effekten — Glück würzt, dominiert aber nicht (faire Scoreboard-Vergleichbarkeit).
- Gesamtscore = Entscheidungs-Punkte + Bonus aus den vier Säulen + Geld-Bonus (Pleite-Strafe bei `cash <= 0`).

**Timeline normal 8 Schritte:** Entscheidung P1 → Vereins-Event → P2 → P3 → Verteil-Runde → P4 → Markt-Event → P5. **Optionaler Zusatzslot:** bei drohender Pleite (`cashRaw < €3.000`) schiebt `deriveSlots` genau **1 Krisenslot** (`crisis:runway`) ein — max. 1 pro Lauf. **Events pro Lauf:** genau 1 Vereins-Event (`category: "verein"`: Climate Hack, Startup Contacts, VCM-Beitritt) + 1 Markt-Event (`category: "markt"`). **Echo (S4):** Liegt zum Markt-Slot ein passender aktiver Marker vor, spielt der `markt`-Slot statt eines generischen ein **Echo-Event** aus (mit „Weil ihr…"-Bezug auf eine frühere Entscheidung); sonst Fallback auf den normalen Markt-Pool. Phase 5 priorisiert analog ein markergebundenes Szenario, sonst den markerlosen Fallback. Max. 1 markergebundenes Echo pro Lauf.

**Verteil-Runde (nach Phase 3):** Pot = `min(€18.000, floor(cash / 500) × 500)`. Slider-Schritt: €500. Je €3.000: +4 Punkte auf die Ziel-Säule (Innovation, Growth, Community, Impact), proportional gerundet. **Kein Vollausgabe-Zwang (S5):** Teilinvestition ist erlaubt, der nicht verteilte Rest bleibt als sichtbare Rücklage in der Kasse. **Kein Pauschalbonus mehr:** der frühere +12-Bonus fürs Investieren wurde mit S5 ersatzlos gestrichen. Stattdessen Marker-Echo — ein dominanter Schwerpunkt setzt einen `fokus:`-Marker (Dominanzformel zentral in `gameData.ts` → `ALLOC_MARKERS`), Gleichverteilung `fokus:balanced`, deutliche Zurückhaltung bei gesunder Kasse `cash:discipline`; diese Marker können ein positives Echo auslösen. Wenn Pot < €500: „Kasse fast leer"-Screen, kein Verteilen, keine Punkte. Werte nicht umbalancieren — Verteil-Runde ist ein separates Gameplay-Element.

**Score-Formel:** `Punkte + round(Säulensumme / 2) + round(cash / 2000)`. Bei `cash ≤ 0`: stattdessen `−30` (Pleite-Strafe).

**Fachbegriffe:** Begriffe wie „Bootstrappen", „Business Angel", „Pivot", „Seed" immer mit einer Ein-Satz-Erklärung inline im Outcome-Text (nicht einfach nur genannt).

**Szenario-Anforderung:** Alle Szenarien müssen VC-taugliche, **skalierbare B2B-Startup-Cases** sein. Kein Friseursalon, keine lokalen One-Man-Shops (Anforderung von Eva).

## Weitere Artefakte im Repo

- **`archiv/Prototyp - Startup Simulation (Stand 2026-06-11, abgelöst durch Next.js-App).html`** — eigenständiger, klickbarer Snapshot des Spiels (Logos eingebettet, läuft per Doppelklick ohne Node). **ABGELÖST** — die Next.js-App in `startup-simulation/` ist die einzige Quelle der Wahrheit.
- **`startup-simulation/public/logos/`** — `startup-contacts.png` (Intro), `vcm.png` (Closing); via `next/image` mit `unoptimized` eingebunden.
- **`docs/`** — `KONZEPT - Startup Simulation.md` (fachliches Konzept; §12 listet die offenen Entscheidungen), `DESIGN_SYSTEM.md`, `FOUNDERS MAP Konzept - Gründungsreise.md`, Planungs-DOCX.
- **`assets/Logo SC/`** — Logos (1.png = Startup Contacts, 3.png = Venture Club Münster; beide dunkler Hintergrund).
- **`archiv/`** — Transkripte der ursprünglichen Konzept-Session (Referenz, nicht bearbeiten).

## Bekannte Stolperfallen

- **`gameContent.generated.ts` nie direkt editieren** — wird von `scripts/generate-content.mjs` überschrieben. Inhalte ausschließlich in `content/*.tsv` ändern.
- **Pot-Berechnung zur Laufzeit, nicht vorab:** `computeAllocationPot()` wird erst beim Auflösen des `alloc`-Slots (Mount der `AllocationCard`) aufgerufen (Cash-Stand nach Phase 3 zählt). Nicht vorausberechnen — der Pot hängt vom Replay der bisherigen Entscheidungen ab (`deriveRunState`).
- **Kein globaler State:** Die gesamte App läuft als lokale State-Machine in `page.tsx`. Kein Zustand wird persistiert — bei jedem Reload startet das Spiel neu.
- **`navigator.share` ist Pflicht** für den Teilen-Button auf dem Ergebnis-Screen. Vor Deployment prüfen, dass die API vorhanden und eingebunden ist.
- **Keine alten API-Referenzen:** Beim Refactoring darauf achten, dass veraltete Feldnamen (z. B. frühere Scoring-Hilfsfunktionen) vollständig entfernt werden — `npx tsc --noEmit` fängt das ab.

## Token-Disziplin (Agent-Hinweis)

Vollständige Regeln stehen in `Scripts/CLAUDE.md §3`. Kurzfassung für dieses Projekt:

- Befehle mit langer Ausgabe (Build-Log, `grep` auf `src/`) über `ctx_batch_execute` statt `Bash` laufen lassen.
- `gameContent.generated.ts` ist groß und auto-generiert — bei Bedarf `ctx_execute_file` statt `Read`.
- Codex-Sessions und Claude-Sessions nicht in einer Riesensession stapeln; nach abgeschlossener Teilaufgabe `/clear`.

## graphify

Dieser Wissens-Graph liegt unter `startup-simulation/src/graphify-out/` (Node-/Edge-/Community-Zahlen siehe aktueller Graph — mit `graphify update` aktuell halten). Zentrale Knoten: `formatMoney`, `Stats`, `AllocationCard`, `Result` sowie der deterministische Kern `deriveSlots`/`resolveStep`/`deriveRunState`.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Regeln:
- Für Codebase-Fragen zuerst `graphify query "<frage>"` ausführen, wenn `startup-simulation/src/graphify-out/graph.json` existiert. `graphify path "<A>" "<B>"` für Abhängigkeiten, `graphify explain "<konzept>"` für fokussierte Konzepte.
- `graphify-out/` darf nach Hooks oder inkrementellen Updates dirty sein — kein Grund, Graphify zu überspringen.
- `startup-simulation/src/graphify-out/GRAPH_REPORT.md` nur für breite Architektur-Reviews lesen.
- Nach Code-Änderungen Graph aktualisieren (kein API-Aufruf, nur AST): `graphify update startup-simulation/src`
