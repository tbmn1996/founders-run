# Founder's Run — Feature-Roadmap

Übersicht über alle umgesetzten und geplanten Features. Wird laufend gepflegt.

**Legende:** ✅ Umgesetzt · 🚧 In Umsetzung · 📋 In der Pipeline

---

## 🚧 In Umsetzung: Umbau „more-consequence" (Quiz → Simulation)

**Grundlage & Pflichtlektüre:** `docs/PLAN - more-consequence.md` (v1.1) — Diagnose, Produktanforderungen (PA-1…PA-12), Schwellen (§8.8), UX-Ziele, Akzeptanzkriterien.
**Branch:** `more-consequence` · **Ziel:** alle Sessions am 2026-06-12, danach Merge auf `main` (= Auto-Deploy via Vercel) · Messe ist am 15.06.

### Arbeitsregeln für JEDE Session (S1–S6)

1. Diese Datei (Abschnitt der eigenen Session + diese Regeln) und die in der Session genannten PLAN-Abschnitte **zuerst lesen**; ebenso die Repo-`CLAUDE.md`.
2. Auf Branch `more-consequence` arbeiten (`git checkout more-consequence && git pull`). Sessions laufen **sequenziell**, nie parallel (mehrere Sessions editieren `page.tsx` → Konfliktgefahr).
3. Verifikation vor jedem Commit: `npx tsc --noEmit` und `npm run build` aus `startup-simulation/` — beides muss grün sein. Zusätzlich die Session-DoD unten.
4. Tabu: `src/lib/gameContent.generated.ts` direkt editieren (wird generiert); Founders-Map-Hooks in der `Result`-Komponente; neue Dependencies in `package.json` (auch keine devDependencies — `bun` ist lokal auf dem Rechner installiert und darf als Skript-Runner benutzt werden, ist aber KEINE Projekt-Dependency).
5. Schwellen/Konstanten ausschließlich zentral in `gameData.ts` anlegen (Werte: PLAN §8.8) — nie inline in Komponenten.
6. Session-Ende: Commit(s) + Push auf `more-consequence`, Status-Tabelle hier abhaken (Commit-Hash eintragen) und committen. **Kein Merge auf `main` außer in S6.**
7. Wenn die DoD nicht erreichbar ist: stoppen, Befund in die Status-Tabelle schreiben, nichts halb mergen — jedes Gate muss ein konsistentes Spiel hinterlassen.

### Status

| # | Session | Gate nach Abschluss | Status | Commit |
|---|---|---|---|---|
| S1 | Cash-Sichtbarkeit (Bänder, Gating, Fixes) | A — deploybarer Zwischenstand | ☑ abgeschlossen | e9736df |
| S2 | Deterministischer Unterbau (Seed + Slots) | — (unsichtbares Refactoring) | ☑ abgeschlossen | 530f0b2 |
| S3 | Krise & Beinahe-Pleite | B — deploybarer Zwischenstand | ☑ abgeschlossen | 7ef3f0e |
| S4 | Gedächtnis: Marker + Echo + P5 (Herzstück) | C — Kern-Produktziel erreicht | ☑ abgeschlossen | 0c927fd / ef718c8 / a5c1844 |
| S5 | Budget-Wette (Reserve + Alloc-Marker) | D — Feature-komplett | ☑ abgeschlossen | 2a2a6aa |
| S6 | Stabilisierung, Sim-Checks, Merge + Deploy | Live auf main | ⏳ in Arbeit | — |

---

### S1 — Cash-Sichtbarkeit (Bänder, Gating, Fixes)

**Ziel:** Geld wird vom Anzeigewert zur erlebbaren Ressource: Der Kassen-Zustand ist farblich ablesbar, zu teure Optionen sind sichtbar gesperrt, riskante Optionen gekennzeichnet. Spielverhalten sonst unverändert.
**Abhängigkeiten:** keine. · **Pflichtlektüre:** PLAN §1.3, §6 (PA-1, PA-2), §8.8, §9.1–9.2.

**Aufgaben:**
1. `CASH_BANDS`-Konstanten in `gameData.ts` (solide ≥ €10.000 · angespannt €5.000–9.999 · kritisch < €5.000) + pure Helper `cashBand(cash)` und `isOptionLocked(option, cash)` (gesperrt wenn Cash-Kosten > Kontostand) in `gameLogic.ts`.
2. `deriveRunState` führt zusätzlich ein **ungeclamptes** `cashRaw` mit (Anzeige bleibt ≥ 0 geclampt); das bestehende `Math.max(0,…)`-Clamping in `applyEffects` für die Anzeige-Stats bleibt.
3. `formatMoney`-Fix (`gameLogic.ts:117`): `Math.abs` entfernen, Vorzeichen korrekt rendern.
4. `StatBar.tsx`: Cash-Zeile färbt sich nach Band (neutral → warm → rot) + Ein-Wort-Label des Bands.
5. `DecisionCard` (in `page.tsx`): gesperrte Optionen ausgegraut mit „Zu teuer — braucht €X" (sichtbar, nicht versteckt, nicht klickbar); „Riskant"-Badge auf Optionen, deren Wahl die Kasse unter €5.000 drücken würde.
6. **„Letzter Ausweg"-Guard:** Wären alle Optionen eines Szenarios gesperrt, bleibt die günstigste wählbar (Badge „Letzter Ausweg"); sie darf die Kasse rechnerisch überziehen (`cashRaw` < 0, Anzeige 0) — die Konsequenz (Krise) kommt in S3.
7. `scripts/generate-content.mjs`: **Warnung** (kein Build-Abbruch), wenn ein Szenario keine Option mit `geld ≥ 0` hat (aktuell betrifft das `p2-tech`, `p4-hire`, `p4-marketing` — bewusst Warnung statt Fehler, der Guard aus Aufgabe 6 fängt es zur Laufzeit).

**Nicht in dieser Session:** Krise (S3), Marker (S4), Timeline-/Seed-Umbau (S2).
**DoD:** `tsc` + `build` grün; manueller Pleite-Pfad im Dev-Server (immer teuerste Option): Band-Färbung wechselt, ab knapper Kasse erscheinen Sperren/Badges, „Letzter Ausweg" greift, negative Beträge rendern korrekt mit Vorzeichen; ein normaler Lauf sieht bis auf die Cash-Färbung unverändert aus.

**Session-Start-Prompt:**
> Setze Session S1 aus `docs/ROADMAP.md` um (Cash-Sichtbarkeit). Lies zuerst dort die Arbeitsregeln + den S1-Block, dann `docs/PLAN - more-consequence.md` §1.3, §6 (PA-1/PA-2), §8.8, §9.1–9.2 sowie die Repo-CLAUDE.md. Branch `more-consequence`. Am Ende: DoD verifizieren, committen, pushen, Status-Tabelle abhaken.

---

### S2 — Deterministischer Unterbau (Seed + abgeleitete Slots)

**Ziel:** Reines Refactoring ohne Verhaltensänderung: Der Lauf wird durch einen `runSeed` + die History `completed` vollständig bestimmt. Das ist die Voraussetzung für bedingte Auswahl (S3/S4), korrekte Zurück-Navigation und Sim-Tests.
**Abhängigkeiten:** keine harte (S1 empfohlen zuerst). **Zeitbox: max. ~60–90 Min — kein Test-Framework-Ausbau, keine Extras.** · **Pflichtlektüre:** PLAN §6 (PA-11), §15 (Datei-Mapping); Architektur-Kerndetails stehen vollständig hier.

**Aufgaben (Architektur-Kerndetails — exakt so umsetzen):**
1. `gameLogic.ts`: `mulberry32(seed)`-PRNG + `hashSlot(runSeed, slotId)`. **Der RNG-Stream muss pro Slot-IDENTITÄT gekeyt sein** (`"p1"`, `"verein"`, `"p5"` …), nicht sequenziell und nicht über den Array-Index — sonst ändert die spätere Krisen-Injektion (S3) alle nachfolgenden Draws bzw. verschiebt P5 auf einen anderen Index.
2. `Slot`-Typ + `deriveSlots(completed): Slot[]` (in S2 noch konstant 8 Slots: p1, verein, p2, p3, alloc, p4, markt, p5).
3. `resolveStep(runSeed, slot): Step` — ersetzt `buildRun()`/`pickLuckEvent()`: filtert den Pool (Phase bzw. Event-Kategorie), zieht per `hashSlot`-gekeytem PRNG; **auch der Options-Shuffle** kommt aus diesem Stream (sonst stehen Antworten nach Zurück+Vor in anderer Reihenfolge).
4. `page.tsx` (`Game`): `timeline`-State (Z. 258) ersetzen durch `runSeed`-State (in `startGame()` neu gesetzt); `currentStep` als `useMemo` aus `(runSeed, completed)`; `advance`/`finishAlloc` prüfen das Spielende gegen `deriveSlots(...).length`; `goBack`-Intro-Zweig setzt Seed-Reset statt `setTimeline([])`.
5. `buildTimeline`/`buildRun`/`pickLuckEvent` entfernen (gehen in `deriveSlots`/`resolveStep` auf); `npx tsc --noEmit` fängt Restreferenzen.

**Nicht in dieser Session:** Krisen-Slot, Marker-Bedingungen, simulate.mjs-Ausbau.
**DoD:** `tsc` + `build` grün; manuell: kompletter Durchlauf spielbar; **Zurück + identisch neu wählen → exakt dieselbe Frage, dieselben Events, dieselbe Options-Reihenfolge**; Neustart erzeugt einen anderen Lauf. Optional (wenn `bun` verfügbar): Mini-Skript `scripts/determinism-check.ts`, das für 100 Seeds zweimal denselben Lauf ableitet und Gleichheit prüft — mit `bun scripts/determinism-check.ts` ausführen.

**Session-Start-Prompt:**
> Setze Session S2 aus `docs/ROADMAP.md` um (deterministischer Unterbau). Lies zuerst dort die Arbeitsregeln + den S2-Block (enthält die Architektur-Details: slot-ID-gekeyter PRNG!), dann PLAN §6 PA-11 + §15 sowie die Repo-CLAUDE.md. Branch `more-consequence`. Reines Refactoring — Spielverhalten muss identisch bleiben. Zeitbox beachten. Am Ende: DoD, Commit, Push, Status abhaken.

---

### S3 — Krise & Beinahe-Pleite

**Ziel:** Eine leere Kasse hat erstmals Spielfolgen: Fällt `cashRaw` nach einem committeten Schritt unter €3.000 (schließt ≤ 0 ein), wird genau einmal pro Lauf ein Krisen-Zwischenschritt eingeschoben — drei realistische, allesamt schmerzhafte Auswege statt Game Over.
**Abhängigkeiten:** S1 (cashRaw, Bänder) + S2 (Slots). · **Pflichtlektüre:** PLAN §6 (PA-3, PA-4), §7.3, §8.8, §9.3.

**Aufgaben:**
1. `CRISIS`-Konfig in `gameData.ts` (Trigger-Schwelle €3.000, max. 1/Lauf).
2. `deriveSlots(completed)` erweitern: Replay zählt abgeschlossene Krisen-Steps; ist der Endzustand unter der Schwelle, noch keine Krise verbraucht und das Spiel nicht am letzten Slot → Krisen-Slot an Position `completed.length` einfügen (`slots.length` ∈ {8, 9}). Keine Timeline-Mutation, reine Ableitung — Zurück-Navigation bleibt dadurch automatisch konsistent.
3. Neue `CompletedStep`-Variante `{ kind: "crisis", scenario, chosen }`; `advance()` bekommt einen Krisen-Zweig; Ende-Prüfung gegen `deriveSlots(nextCompleted).length` (gegen den NÄCHSTEN Zustand, sonst beendet der letzte reguläre Schritt das Spiel trotz frisch getriggerter Krise).
4. Krisen-Content als TSV: `fragen.tsv`/`antworten.tsv` mit `phase = krise` (Validator: Wert `krise` zulassen, aus der normalen Phasen-Auswahl ausschließen, **hart prüfen: ≥1 cash-positive Option**). Inhalt: Brückenfinanzierung (+Cash, kostet Community/Anteile; „Bridge" in einem Satz erklären), harte Sparrunde, Notumsatz/Consulting (+Cash, Fokus-Malus). Anmoderation („Eure Kasse ist fast leer …") aus `texte.tsv` (bereich `krise`).
5. UI: Krise rendert über die bestehende `DecisionCard` mit eigenem visuellen Akzent (Farbe/Icon) — keine neuen Bedienmuster. Fortschrittsbalken-Sprung 8→9 ist akzeptiert (PLAN §9.7).
6. Recap: Krisen-Schritt erscheint als eigener Eintrag („Beinahe-Pleite") mit gewähltem Ausweg.
7. Score: −30-Strafe bleibt nur für Endstand ≤ 0; die durchlebte Krise kostet über ihre Optionen, kein zusätzlicher Pauschal-Malus.

**Nicht in dieser Session:** Marker auf Krisen-Optionen (rüstet S4 nach), Echo-Events.
**DoD:** `tsc` + `build` grün; Pleite-Pfad am Handy: Krise erscheint genau einmal, danach läuft die Timeline normal weiter (9 Schritte gesamt); durch die Krise zurück- und wieder vornavigieren ist konsistent (gleiche Krise, gleiche Optionen); ein solventer Lauf bleibt bei 8 Schritten; Validator-Rotprobe: Krisen-Szenario ohne cash-positive Option bricht den Build mit deutscher Meldung.

**Session-Start-Prompt:**
> Setze Session S3 aus `docs/ROADMAP.md` um (Krise & Beinahe-Pleite). Lies zuerst dort die Arbeitsregeln + den S3-Block, dann PLAN §6 (PA-3/PA-4), §7.3, §8.8, §9.3 sowie die Repo-CLAUDE.md. Branch `more-consequence`. Am Ende: DoD inkl. Zurück-Navigation durch die Krise, Commit, Push, Status abhaken.

---

### S4 — Gedächtnis: Marker + Echo-Slot + P5-Priorisierung (Herzstück)

**Ziel:** Das Spiel merkt sich prägende Entscheidungen (Marker) und spielt darauf zugeschnittene Folgen aus: Der Markt-Event-Slot wird zum Echo-Slot, die Phase-5-Auswahl trifft den wunden Punkt — jeweils sichtbar anmoderiert („Weil ihr früher …"). Der Rückblick zeigt die Kausalkette.
**Abhängigkeiten:** S2 (Slots/Selektor); S3 empfohlen zuerst (Krisen-Optionen bekommen hier ihre Marker). · **Pflichtlektüre:** PLAN §6 (PA-5–PA-8), §7.1–7.2 + 7.4, §8.5, §9.4, §15 (TSV-Schema).

**Aufgaben:**
1. **TSV-Migration im Lockstep (EIN Commit):** `antworten.tsv` + Spalte `setzt_marker` (0–1 primärer Marker, Format `namespace:wert`); `fragen.tsv` + `braucht_marker`, `bezug`; `events.tsv` + `braucht_marker`, `bezug`; neu `content/marker.tsv` (`marker  beschreibung`); `content/README.md` aktualisieren. Achtung: Der Validator prüft Header exakt — Generator, alle TSVs und README müssen im selben Commit migrieren.
2. `generate-content.mjs`-Validierung: Marker-Syntax; jede `setzt_marker`/`braucht_marker`-Referenz existiert in `marker.tsv`; **Fallback-Garantie** (pro Phase ≥1 Frage ohne `braucht_marker`; Kategorie `markt` ≥1 Event ohne `braucht_marker`); ungenutzte Registry-Einträge → Warnung.
3. `deriveRunState`: `flags: Set<string>` aus `completed` ableiten (Entscheidungs- + Krisen-Optionen; Replay → goBack-konsistent).
4. `resolveStep`: Slots `markt` und `p5` priorisieren Kandidaten mit erfülltem `braucht_marker` (unter mehreren Treffern seeded-zufällig); ohne Treffer regulärer Fallback-Pool. Ein Selektionsmechanismus für beide Slots.
5. UI: Echo-Badge „Folge eurer Entscheidung" + `bezug`-Satz auf markergebunden ausgespielten Karten (`EventCard` + `DecisionCard`); Recap-Kausalzeile bei den verursachenden Entscheidungen („→ führte zu: …").
6. **Content:** ~10 `setzt_marker`-Zellen gemäß Startliste PLAN §7.1 (`ziel:enterprise`, `tech:api`, `tech:eigenmodell`, `funding:investor`, `funding:bootstrap`, `risiko:datendeal`, `tempo:hoch`, `abhaengigkeit:marketplace`, Krisen-Optionen → `krise:notfinanzierung`); 4 P5-Szenarien bekommen `braucht_marker` + `bezug` (keycustomer↔enterprise, burnout↔tempo, incumbent-copy↔api/marketplace, crisis = Fallback ohne Bedingung); **4–6 neue Echo-Events** nach PLAN §7.2, davon **≥2 positiv**. Alle Texte B2B-tauglich, Fachbegriffe inline erklärt, `bezug` ≤ 1 Satz.

**Nicht in dieser Session:** Alloc-Marker (S5), Punkte-Rebalancing (nach Messe).
**DoD:** `tsc` + `build` grün; gezielter Lauf A (API-Wahl in P2) → Echo „API-Preise" MIT Bezug-Anmoderation erscheint im Markt-Slot, Recap zeigt die Kette; Lauf B (Eigenmodell) → generisches Markt-Event ohne Bezug; P5 passt zum gesetzten Marker (z. B. Enterprise → Großkunden-Ultimatum mit Bezug); Validator-Rotproben (unbekannter Marker; Phase ohne bedingungsfreie Frage; markt ohne bedingungsfreies Event) brechen den Build mit deutscher Meldung; Zurück + andere frühere Wahl → anderes (passendes) Echo, gewollt.

**Session-Start-Prompt:**
> Setze Session S4 aus `docs/ROADMAP.md` um (Marker + Echo + P5 — das Herzstück). Lies zuerst dort die Arbeitsregeln + den S4-Block, dann PLAN §6 (PA-5–PA-8), §7.1–7.2+7.4, §9.4, §15 sowie die Repo-CLAUDE.md. Branch `more-consequence`. TSV-Migration als EIN Lockstep-Commit. Am Ende: DoD mit den beiden Vergleichsläufen, Commit, Push, Status abhaken.

---

### S5 — Budget-Wette (Reserve + Alloc-Marker)

**Ziel:** Die Verteil-Runde wird eine echte strategische Wette: Rücklage halten ist erlaubt und sinnvoll (Krisen-Puffer), ein dominanter Schwerpunkt prägt spätere Folgen, die Verteilung erscheint im Rückblick.
**Abhängigkeiten:** S4 (Marker-Pipeline). · **Pflichtlektüre:** PLAN §6 (PA-9), §8.8 (Dominanzformel!), §9.5.

**Aufgaben:**
1. `AllocationCard` (`page.tsx`): Bestätigen ab beliebiger Verteilung (Vollausgabe-Zwang Z. 887–894 entfernen); Restbetrag positiv geframt anzeigen („€X bleiben als Rücklage in der Kasse"); beim Bestätigen Schwerpunkt-Hinweis ohne Ausgangs-Spoiler (PLAN §9.5). `computeAllocationPot`/`applyAllocation` bleiben unverändert (Rest verbleibt automatisch im Cash).
2. **+12-Pauschalbonus entfernen — an BEIDEN Stellen synchron:** Logik (`gameLogic.ts:180`) und UI-Badge (`page.tsx:780-793`).
3. Alloc-Marker in `deriveRunState` nach PLAN §8.8: `fokus:<bucket>` (höchster Bucket ≥ €6.000 ∧ ≥ 40 % des Ausgegebenen ∧ Abstand ≥ €2.000), sonst `fokus:balanced` (bei Investition ≥ €6.000); `vernachlaessigt:datenschutz` (≥ €9.000 investiert ∧ Impact-Bucket €0); `cash_discipline` (≤ 40 % des Pots ∧ Cash danach ≥ €10.000). Marker in `marker.tsv` registrieren.
4. Content: 2–3 Alloc-Echo-Events — mindestens `fokus:marketing` → Churn-/Support-Problem (negativ), `cash_discipline` → verdienter Vorteil (positiv, z. B. günstige Förderlinie dank solider Kasse), optional `fokus:community` → öffentliche Verteidigung (positiv). Der Echo-Slot (Schritt 7) liegt nach der Alloc — die Marker können dort und in P5 feuern.
5. Recap: Alloc-Zeile (Verteilung + Rücklage).

**Nicht in dieser Session:** Score-Formel-Änderungen, Rebalancing.

> **Bewusst nicht umgesetzt (Entscheidung Thomas, 2026-06-12):** `vernachlaessigt:datenschutz` aus PLAN §8.8 wurde nicht eingebaut — Nachrüst-Kandidat nach der Messe. Die Formel steht in PLAN §8.8 (≥ €9.000 im Pot investiert ∧ Impact-Bucket = €0). Einbau wäre eine kleine Erweiterung von `deriveMarkers` + 1 passendes Echo-Event.

**DoD:** `tsc` + `build` grün; Randfälle manuell: Pot < €500 („Kasse fast leer"-Screen unverändert), alles in Rücklage (0 investiert → kein fokus-Marker, kein Bonus, Geld bleibt), klare Dominanz (Marker gesetzt, passendes Echo möglich), Gleichverteilung (`fokus:balanced`); kein +12 mehr in Logik UND UI; Alloc-Zeile im Recap sichtbar.

**Session-Start-Prompt:**
> Setze Session S5 aus `docs/ROADMAP.md` um (Budget-Wette). Lies zuerst dort die Arbeitsregeln + den S5-Block, dann PLAN §6 PA-9, §8.8, §9.5 sowie die Repo-CLAUDE.md. Branch `more-consequence`. Achtung: +12-Bonus existiert in Logik UND UI — beide synchron entfernen. Am Ende: DoD-Randfälle, Commit, Push, Status abhaken.

---

### S6 — Stabilisierung, Sim-Checks, Merge + Deploy

**Ziel:** Gesamtverifikation, Dokumentation, Merge auf `main` → Auto-Deploy, Live-Smoke. Danach ist der Umbau live.
**Abhängigkeiten:** S1–S5 abgeschlossen. · **Pflichtlektüre:** PLAN §12 (Akzeptanzkriterien), §14 (Verifikation), §8.2 + 8.6.

**Aufgaben:**
1. `scripts/simulate.mjs` (light): ≥ 2.000 Läufe × Strategien (random / immer-billigste / immer-teuerste / punkte-greedy). Harte Invarianten: Spiel terminiert immer; `slots.length ≤ 9`; nie 0 wählbare Optionen; Echo-Slot immer auflösbar (Fallback greift); max. 1 Krise. Report (kein Fail): Krisen-Quote je Strategie, Score-Verteilung, Säulen-Min/Max. Ausführung lokal (z. B. `bun scripts/simulate.mjs`-kompatibel halten); node:test-Integration ist Follow-up, heute nicht.
2. Drei Stoppuhr-Playthroughs am Handy (Dev-Server über Netzwerk-IP): (a) Pleite-Pfad → Bänder, Sperren, Krise, Recap-Kapitel; (b) Enterprise-/API-Pfad → Echo + passende P5 mit Bezug; (c) Sparsam-Pfad mit Rücklage → keine Krise, `cash_discipline`-Vorteil möglich, Alloc im Recap. Jeweils mit Zurück-Umwegen; jeder Lauf ≤ ~4 Min.
3. Doku: Repo-`CLAUDE.md`-Invarianten aktualisieren (Timeline „8 + max. 1 Krisenschritt", Alloc-Reserve statt Vollausgabe-Pflicht, neue TSV-Spalten, neue Verifikationsschritte); `content/README.md` final prüfen; Score-Stichprobe alt/neu kurz dokumentieren (Annahme: Scoreboard startet zur Messe frisch).
4. **Merge + Deploy:** vorher aktuelles Production-Deployment in Vercel notieren (Rollback-Ziel); `git checkout main && git merge more-consequence && git push` → Auto-Deploy. Live-Smoke **über Mobilfunk** (im Uni-Netz wird `*.vercel.app` abgefangen): 1 kompletter Lauf inkl. Share-Button.
5. Rollback-Plan (nur falls Live-Smoke scheitert): Vercel Instant Rollback auf das notierte Deployment ODER `git revert -m 1 <merge-commit> && git push`.

**DoD:** Alle harten Sim-Invarianten grün; 3 Playthroughs ohne Befund und ≤ ~4 Min; `tsc` + `build` grün; live auf https://founders-run-sepia.vercel.app verifiziert; Status-Tabelle vollständig; PLAN §12-Kriterien 1–10 stichprobenartig erfüllt.

**Session-Start-Prompt:**
> Setze Session S6 aus `docs/ROADMAP.md` um (Stabilisierung + Deploy). Lies zuerst dort die Arbeitsregeln + den S6-Block, dann PLAN §12 + §14 sowie die Repo-CLAUDE.md. Branch `more-consequence`; Merge auf `main` erst nach grüner Gesamtverifikation, Live-Smoke über Mobilfunk. Am Ende: Status-Tabelle final, Rollback-Ziel dokumentiert.

---

### Nach der Messe (Backlog aus dem Umbau — bewusst NICHT heute)

| Punkt | Begründung |
|---|---|
| Punkte-Rebalancing (Quiz-Entschärfung, PLAN §8.3: ≥8/20 Szenarien ohne dominante Option) | Braucht Sim-/Standdaten; Score-Ökonomie nicht 3 Tage vor Messe umwerfen |
| Sim-Korridore als harte Fail-Schwellen + node:test-Integration | Erst Report-Daten sammeln (PLAN §8.2) |
| Sekundäre Marker pro Antwort, `prio`/`verbietet_marker` | Erst nötig, wenn Event-Pool wächst (PLAN §15) |
| Weitere Echo-Events / positive Ernten ausbauen | Content-Qualität vor Quantität; Eva-Review einplanen |
| Marker `aggressive_spend` / `underinvested` | Kein Content, der sie heute nutzt — tote Registry-Einträge vermeiden |

---

## ✅ Umgesetzt

| Feature | Anlass / Quelle |
|---|---|
| KI-Startup „Mira" als Szenario (B2B-SaaS) | Eva-Feedback: Pivot weg von Nachhaltigkeits-Startup |
| Kapital in Euro (€) anzeigen | Eva-Feedback |
| Fachbegriffe inline erklärt statt abgekürzt | Eva-Feedback |
| VCM-Vereins-Events (Climate Hack, Startup Contacts, VCM-Beitritt) | Eva-Feedback |
| 5 Founder-Typen aus stärkster Säule | Konzept |
| Verteil-Runde mit Schieberegler nach Phase 3 | Konzept |
| Rückblick mit aufklappbaren Alternativen (alle 5 Entscheidungen) | Konzept |
| Share-Button + VCM-Logo auf dem Result-Screen | Konzept |
| Story-Grafik teilen (Ergebnis als teilbares Bild) | Feature |
| Mini-CMS via TSV-Dateien — Inhalte ohne Code editierbar | Codex-Umbau |
| Auto-Deploy via Vercel + GitHub (push to main → live) | Setup |
| Öffentliches GitHub-Repo + onboarding-freundliches README | Setup |
| CMS-Handbuch (`docs/CMS-HANDBUCH.md`) | Prozess-Guide: TSV editieren → Build testen → deployen |

---

## 📋 In der Pipeline

### Spielbetrieb & Inhalte

| Feature | Beschreibung |
|---|---|
| Punkte-Tuning | Score-Formel und Punkterange am Stand ausprobieren, ggf. nachjustieren — zusammen mit dem Punkte-Rebalancing aus dem Umbau-Backlog (oben) |
| Eva-Review B2B-Texte | Alle Outcome-Texte auf korrekte Zielgruppe prüfen (Service-/Vertriebsteams, nicht Kleinbetriebe) — inkl. der neuen Echo-/Krisen-Texte |
| Eva-Review Abschlussfolie | CTA und Vereinsvorteile auf Aktualität prüfen |
| Szenario-Pool erweitern | Aktuell 20 Szenarien (4 pro Phase) — mehr Varianz möglich |

### Founders-Map-Integration

| Punkt | Beschreibung |
|---|---|
| Rückgabe-Format klären | Redirect vs. postMessage — wartet auf Entscheidung des App-Teams. Hooks in der `Result`-Komponente (`page.tsx`) sind bereits vorbereitet, aber inaktiv. |

### Neue Features

#### 1. Real-World Case Studies im Rückblick

Im aufklappbaren Rückblick jeder Entscheidung erscheint optional eine weitere Karte:

> **„So hat [Unternehmen] entschieden"**
> Ähnliche Situation → konkrete Vorgehensweise → Ergebnis (2–3 Sätze)

- Nicht jede Antwort braucht eine Case Study — leeres Feld bedeutet: keine Anzeige
- Beispiele: Airbnb bootstrappt früh anstatt VC-Geld zu nehmen · Dropbox ändert Go-to-Market von B2C auf B2B · Notion lehnt frühe Akquisitionsangebote ab

**Technische Umsetzung:**
- Zwei neue optionale Spalten in `content/antworten.tsv`: `case_study_company` und `case_study_text`
- `scripts/generate-content.mjs` braucht keine Änderung (leere Felder werden einfach als `undefined` weitergereicht)
- `RecapItem` in `src/app/page.tsx` bekommt eine optionale dritte expandierbare Sektion (gleiches Muster wie die bestehende Alternativen-Sektion)

#### 2. Englische Version _(nachrangig)_

Alle TSV-Inhalte auf Englisch für internationale Messebesucher. Sprachwahl auf dem Intro-Screen.
