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

## Architektur

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion · lucide-react**. Die gesamte App ist eine einzige Client-Seite, kein Backend, keine Persistenz — die Sim speichert bewusst nichts (Scoreboard lebt in der Messe-App).

**Kapital in Euro:** Startkapital €20.000, Anzeigelimit €120.000; formatiert via `formatMoney()` in `gameLogic.ts`. Stat-Metadaten (Labels, Beschreibungen, Einheiten) liegen zentral in `STAT_META` (gameData.ts).

Strikte Trennung von Inhalt, Logik und Ablauf:

- **`startup-simulation/content/*.tsv`** — ALLE Spielinhalte liegen jetzt als Tabellen-Dateien vor (fragen, antworten, events, gruendertypen, texte). **Inhaltspflege passiert ausschließlich dort** — keine Code-Änderung nötig, um Szenarien zu ergänzen oder zu ändern. Anleitung: `content/README.md`.
- **`scripts/generate-content.mjs`** — Build-Skript, das die TSV-Dateien validiert (eindeutige IDs, Zahlenformat, Konsistenz) und die automatisierte Datei `src/lib/gameContent.generated.ts` (gitignored) generiert. Das Skript wird automatisch vor `npm run dev`, `npm run build` und `npm run lint` ausgeführt und bricht mit deutscher Fehlermeldung (Datei + Zeilennummer) ab, wenn etwas nicht passt — kaputter Inhalt geht nie live. Nach TSV-Änderungen den Dev-Server neu starten (kein Datei-Watch).
- **`src/lib/gameData.ts`** — Spielinhalte-Exports + Spielmechanik-Konstanten: `STAT_META` (Säulen-Labels/Beschreibungen), `ALLOCATION` (Verteil-Runden-Konfiguration), `INITIAL_STATS`. Importiert die generierten Inhalte (`SCENARIOS`, `LUCK_EVENTS`, `FOUNDER_TYPES`, `SCENARIO_INTRO`, `PHASES`) aus `gameContent.generated.ts` und re-exportiert sie.
- **`src/lib/gameLogic.ts`** — Spiellogik: `buildRun()` (Zufallsauswahl pro Phase), `pickLuckEvent(category)`, `applyEffects()`, Score-Berechnung, Verteil-Runden-Helfer (`computeAllocationPot`, `applyAllocation`, `formatMoney`), `determineFounderType()` (stärkste Säule → Typ, ausgeglichen → Allrounder).
- **`src/app/page.tsx`** — kompletter Spielfluss als Screen-State-Machine (`intro → sim → result`) mit den Komponenten `Intro`, `Sim`, `DecisionCard`, `EventCard`, `Result` (inkl. `RecapItem`-Rückblick mit Alternativen und `Closing`-Abschlussfolie). Hier liegen auch die inaktiven Founders-Map-Hooks.
- **`src/components/StatBar.tsx`** — Anzeige der 4 Säulen (Growth, Innovation, Community, Impact) + Geld.
- **`src/app/globals.css`** — Design-Tokens des „Aura v2"-Designs; Quelle/Referenz ist `docs/DESIGN_SYSTEM.md`.

### Spielmechanik-Invarianten (beim Ändern von Inhalten beachten)

- Jede Option bewegt mehrere Stats **gegenläufig** (Trade-offs) — es darf keinen perfekten Durchlauf geben.
- Punkte pro Entscheidung ca. −10 bis +20; schlechte Entscheidungen kosten.
- 2 Glücks-Events pro Lauf mit bewusst **kleinen** Effekten — Glück würzt, dominiert aber nicht (faire Scoreboard-Vergleichbarkeit).
- Gesamtscore = Entscheidungs-Punkte + Bonus aus den vier Säulen + Geld-Bonus (Pleite-Strafe bei `cash <= 0`).

**Timeline ist fix 8 Schritte:** Entscheidung P1 → Vereins-Event → P2 → P3 → Verteil-Runde → P4 → Markt-Event → P5. **Events pro Lauf:** genau 1 Vereins-Event (`category: "verein"`: Climate Hack, Startup Contacts, VCM-Beitritt) + 1 Markt-Event (`category: "markt"`).

**Verteil-Runde (nach Phase 3):** Pot = `min(€18.000, floor(cash / 500) × 500)`. Slider-Schritt: €500. Je €3.000: +4 Punkte auf die Ziel-Säule (Innovation, Growth, Community, Impact), proportional gerundet; pauschal +12 Punkte nur, wenn Geld investiert wurde. Wenn Pot < €500: „Kasse fast leer"-Screen, kein Verteilen, keine Punkte. Werte nicht umbalancieren — Verteil-Runde ist ein separates Gameplay-Element.

**Score-Formel:** `Punkte + round(Säulensumme / 2) + round(cash / 2000)`. Bei `cash ≤ 0`: stattdessen `−30` (Pleite-Strafe).

**Fachbegriffe:** Begriffe wie „Bootstrappen", „Business Angel", „Pivot", „Seed" immer mit einer Ein-Satz-Erklärung inline im Outcome-Text (nicht einfach nur genannt).

**Szenario-Anforderung:** Alle Szenarien müssen VC-taugliche, **skalierbare B2B-Startup-Cases** sein. Kein Friseursalon, keine lokalen One-Man-Shops (Anforderung von Eva).

## Weitere Artefakte im Repo

- **`archiv/Prototyp - Startup Simulation (Stand 2026-06-11, abgelöst durch Next.js-App).html`** — eigenständiger, klickbarer Snapshot des Spiels (Logos eingebettet, läuft per Doppelklick ohne Node). **ABGELÖST** — die Next.js-App in `startup-simulation/` ist die einzige Quelle der Wahrheit.
- **`startup-simulation/public/logos/`** — `startup-contacts.png` (Intro), `vcm.png` (Closing); via `next/image` mit `unoptimized` eingebunden.
- **`docs/`** — `KONZEPT - Startup Simulation.md` (fachliches Konzept; §12 listet die offenen Entscheidungen), `DESIGN_SYSTEM.md`, `FOUNDERS MAP Konzept - Gründungsreise.md`, Planungs-DOCX.
- **`assets/Logo SC/`** — Logos (1.png = Startup Contacts, 3.png = Venture Club Münster; beide dunkler Hintergrund).
- **`archiv/`** — Transkripte der ursprünglichen Konzept-Session (Referenz, nicht bearbeiten).
