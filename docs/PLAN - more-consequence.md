# Founder's Run — Plan „more-consequence": Vom Quiz zur Simulation

> **Stand v1.1 (2026-06-12):** Codex-Peer-Review eingearbeitet (Krisen-Trigger + Schwellen konkret, Gating-Auffangnetz, Alloc-Dominanzformel, primäre Marker, Unterbau zeitgeboxt). Die Umsetzung erfolgt in 6 session-unabhängigen Schritten — **operative Roadmap: `docs/ROADMAP.md`** (§11 hier ist nur noch die Kurzfassung). Entschiedene Fragen: §13.

## 0. Kontext

**Anlass:** Testfeedback zum Spiel „Founder's Run" (3-Minuten-Startup-Simulation des Venture Club Münster, Messe-Infostand, Handy-Browser): Es fühlt sich noch zu sehr wie ein Multiple-Choice-Quiz mit Punktwerten an. Entscheidungen verändern Werte, aber der Spielverlauf reagiert nicht darauf; Geld kann auf 0 fallen, ohne dass etwas passiert; die Budget-Runde hat keine spürbaren Folgen.

**Ziel:** Mehr Selbstwirksamkeit, Realismus und Interaktivität — Spieler:innen sollen erleben „Das passiert jetzt, **weil** ich vorher diesen Weg gewählt habe" — ohne die Stärken zu verlieren: kurzer Durchlauf (~3 Min), klare Phasen, zugängliche Sprache, TSV-Content-Pflege durch Nicht-Entwickler:innen, Founder-Typ + Rückblick, VCM-Kontext.

**Gegenstand:** Repo `tbmn1996/founders-run`, App in `startup-simulation/`, analysierter Stand `main@5402ba9`. Zielbranch: **`more-consequence`** (existiert bereits auf GitHub, zeigt aktuell auf denselben Commit wie `main`).

**Methodik dieses Plans:** Vollständige Code-/Content-/UI-Analyse (3 parallele Explorationen + eigene Verifikation der tragenden Stellen in `gameLogic.ts`, `gameData.ts`, `page.tsx`), quantitative Content-Auswertung aller 20 Szenarien / 60 Optionen / 6 Events, anschließend Architektur-Stresstest des Lösungsdesigns gegen die reale Codebase. Alle Datei:Zeile-Angaben sind gegen `main@5402ba9` verifiziert.

**Harte Constraints (aus Repo-CLAUDE.md, bleiben gültig):**
1. Standalone von der Messe-App; Founders-Map-Hooks in der `Result`-Komponente nicht anfassen (Rückgabeformat `score`, `founderType` stabil).
2. Content-Pflege ausschließlich über `content/*.tsv` + Validator (`scripts/generate-content.mjs`); kaputter Content darf nie live gehen.
3. Alle Szenarien B2B-tauglich (Anforderung Eva); Fachbegriffe inline mit Ein-Satz-Erklärung.
4. Smartphone-Hochformat, kein Backend, keine Persistenz, keine neuen Dependencies ohne Freigabe.

---

## 1. Diagnose des Ist-Zustands

Das Spiel ist technisch sauber gebaut (siehe 1.6), aber es ist mechanisch ein **bewertetes Quiz mit Ressourcen-Anzeige**, keine Simulation. Belege:

### 1.1 Quiz-DNA: Jede Frage hat eine „richtige" Antwort
- **20 von 20 Szenarien haben eine eindeutig punktbeste Option** (gemessen über alle 60 Optionen; Ø Punkte-Spannweite pro Szenario 15,3, max 30). Die `punkte`-Spalte ist eine verdeckte Richtig/Falsch-Bewertung; die Outcome-Texte loben/tadeln entsprechend („Stark: Du nimmst Kapital, schützt aber deine Werte…").
- Diese Bewertungspunkte sind **im Spielverlauf unsichtbar** (das Feedback-Panel zeigt nur Stat-Deltas + Outcome-Text), dominieren aber den Endscore (`decisionPoints` ~50–120 von typ. ~200). Der größte Score-Hebel ist für Spieler:innen also weder sichtbar noch als Konsequenz erlebbar → „Werte steigen/fallen willkürlich"-Gefühl.

### 1.2 Null Konditionalität: Die Welt reagiert nicht
- Es gibt **keinerlei** `requires`/Tags/Flags — weder im Schema (`gameData.ts:34-61`) noch im Content (alle 5 TSVs geprüft). Szenario-Auswahl: 1 zufälliges aus 4 pro Phase (`buildRun()`, `gameLogic.ts:40-46`), Events: rein zufällig aus dem Kategorie-Pool (`pickLuckEvent()`, `gameLogic.ts:53-56`), alles eager beim Spielstart gezogen (`buildTimeline()`, `page.tsx:65-79`), ungeseedetes `Math.random`.
- Die einzige „Welt reagiert"-Mechanik (Markt-Events) ist vom Spielverlauf entkoppelt — dabei liegt das Material für Kausalität schon da: Das Event `markt-kosten` („Die KI-Kosten steigen", €−8k) wäre die perfekte Folge der Wahl „Große KI per API anbinden" (`p2-tech`), trifft aber zufällig auch Spieler:innen, die ein eigenes Modell trainiert haben.

### 1.3 Cash ist Anzeige, nicht Spielrealität
- Cash hat exakt **zwei** Wirkungen im ganzen Spiel: Es speist den Verteil-Topf (`computeAllocationPot`, `gameLogic.ts:83-88`) und den Endscore (`cash/2000` bzw. **−30** Pleite-Strafe, `gameLogic.ts:73-77`). Sonst: keine Sperren, keine Warnungen, keine Events, keine Burn-Rate.
- **Worst-Case-Pfad (nachgerechnet): Cash erreicht 0 € bereits nach Phase 2** — danach laufen 6 von 8 Schritten unverändert weiter; die Pleite wird erst am Ende als abstrakte Score-Strafe sichtbar.
- Schlimmer: `applyEffects` clampt auf 0 (`Math.max(0, …)`, `gameLogic.ts:62`). Wer mit €5.000 eine €20.000-Option wählt, zahlt effektiv nur €5.000 — **das Spiel verschluckt Kosten stillschweigend**, die Ressource „lügt".
- Latenter Anzeige-Bug für jede künftige Lösung: `formatMoney` nutzt `Math.abs` (`gameLogic.ts:117`) — negatives Cash würde als positiver Betrag gerendert.
- Die Cash-Spannweite ist riesig (Best-Case-Pfad €128.000, Worst-Case €0; 34/60 Optionen kosten bis −€20k, 18 bringen bis +€60k) — es gibt also genug Dynamik, sie hat nur keine Konsequenzen.

### 1.4 Die Budget-Runde ist keine Entscheidung
- Die UI **erzwingt das Komplett-Ausgeben** des Topfs (Bestätigen-Button disabled bis Rest = 0, `page.tsx:887-894`) — „Reserve halten" existiert nicht als Option.
- Alle 4 Buckets konvertieren **identisch** (€3.000 → +4 Punkte auf die Ziel-Säule, `gameLogic.ts:104`), und alle 4 Säulen fließen identisch in den Score (Summe/2). Wohin man investiert, ist score-neutral — nur der Founder-Typ ändert sich, was man nicht sieht.
- Die +12-Pauschalpunkte fürs Investieren (`gameLogic.ts:180`) machen Ausgeben strikt dominant: 18k investieren = ~+24 Score, 18k behalten = +9 Score. Keine Wette, keine Trade-offs.
- Die Verteilung (`amounts`) wird nach dem Commit **nie wieder referenziert** — kein Folge-Event, nicht mal im Rückblick.

### 1.5 Der Rückblick zeigt Auswahl, keine Wirkung
Der Recap (`records`) listet pro Entscheidung Gewähltes + Alternativen — aber keine Kausalität („führte zu…"), keine Events, keine Budget-Runde, kein Cash-Verlauf.

### 1.6 Stärken, die unbedingt erhalten bleiben (und die Lösung tragen)
- **Replay-Architektur:** `completed: CompletedStep[]` ist Single Source of Truth; `deriveRunState()` (`gameLogic.ts:156-184`) berechnet alles per Replay, Zurück-Navigation ist `slice(0,-1)` (`page.tsx:319-339`) — desync-frei. Das ist die *ideale* Basis für abgeleitete Flags/Zustände.
- **Content-Pipeline:** TSV → Validator → generierte Datei; Build bricht bei kaputtem Content mit deutscher Fehlermeldung + Zeilennummer ab. Erweiterbar statt ersetzbar.
- Ton, Fachbegriff-Erklärungen inline, B2B-Szenarien, klare 5-Phasen-Dramaturgie, Founder-Typen, Share-Funktion.

---

## 2. Zielbild (aus Spielersicht)

Ein Durchlauf soll sich anfühlen wie eine **kleine, persönliche Gründungsgeschichte**, nicht wie ein Fragebogen:

1. **„Das Spiel hat sich gemerkt, was ich getan habe."** Mindestens ein Moment pro Lauf knüpft explizit an eine frühere Wahl an — sichtbar anmoderiert („Weil ihr auf einen einzigen Großkunden gesetzt habt …"). Die Bewährungsprobe in Phase 5 trifft *meinen* wunden Punkt, nicht einen zufälligen.
2. **„Geld ist mein Überleben, nicht mein Punktekonto."** Die Kasse hat spürbare Zustände: solide → angespannt (Warnfärbung, Runway-Hinweis) → kritisch (teure Optionen sichtbar gesperrt: „zu teuer", Krisen-Zwischenschritt mit drei realistischen, allesamt schmerzhaften Auswegen — Brückenfinanzierung gegen Anteile, harte Sparrunde, Notverkauf/Consulting). Kein hartes Game Over (Messe!), aber eine Beinahe-Pleite, die man *erlebt* und die Spuren hinterlässt (Marker, Malus, eigenes Rückblick-Kapitel).
3. **„Die Budget-Runde ist meine strategische Wette."** Ich darf Reserve behalten (Puffer gegen die Krise) oder aggressiv investieren; ein dominanter Schwerpunkt prägt, welche Chancen und Probleme später kommen (Marketing-Schwerpunkt → Wachstum + Support-/Churn-Risiko; Datenschutz vernachlässigt → Audit-Forderung eines Konzernkunden).
4. **„Am Ende verstehe ich meine Geschichte."** Der Rückblick zeigt Kausalketten (Entscheidung → ausgelöste Folge), die Budget-Wette und ggf. das Beinahe-Pleite-Kapitel — und bleibt teilbar.
5. **Verlockung funktioniert:** Schlechte Entscheidungen sehen kurzfristig gut aus (+€60k vom Investor!), ihre Kosten kommen später — als erlebte Folge, nicht als versteckter Punktabzug.

Alles davon muss **im ersten und einzigen Durchlauf** landen (Messestand: 1 Run, vielleicht 2), in ≤ ~3–4 Minuten, ohne einen einzigen zusätzlichen Erklär-Screen.

---

## 3. Lösungsansätze (konzeptionell unterschiedlich)

### Ansatz A — Marker + Cash-Bänder + Echo-Slots (zustandsbasierte Content-Selektion)
Entscheidungen setzen benannte **Marker** (z. B. `ziel:enterprise`, `tech:api`, `funding:investor`). Bestehende Zufalls-Slots (Markt-Event, Phase-5-Szenario) wählen bevorzugt Content, dessen Bedingung zu den gesetzten Markern passt — mit garantiertem generischem Fallback. Cash bekommt abgeleitete **Bänder** (solide/angespannt/kritisch) mit sichtbaren Wirkungen (Färbung, Options-Sperrung, max. 1 Krisen-Zwischenschritt). Die Budget-Runde erlaubt Reserve und setzt Strategie-/Vernachlässigungs-Marker. Alles bleibt Content-gesteuert (TSV-Spalten), die Engine bleibt eine pure Replay-Ableitung.

### Ansatz B — Wirtschaftsmodell (Burn-Rate/Runway-Simulation)
Laufende Kosten pro Runde, Umsatz aus Entscheidungen abgeleitet, Cash entwickelt sich kontinuierlich; Krisen emergieren aus dem Modell.

### Ansatz C — Handgeschriebene Verzweigungspfade
Frühe Wahlen routen in eigene Fragen-Stränge (Enterprise-Pfad, Bootstrap-Pfad, …); Kausalität ist auserzählt statt selektiert.

### Ansatz D — Antwort-ID-Echos (Minimalvariante von A)
Events matchen direkt auf konkrete Antwort-IDs (`braucht_antwort: p2-tech:a`) statt auf Marker. Eine neue Spalte in `events.tsv`, null Änderungen an `antworten.tsv`.

### Bewertung

| Kriterium | A: Marker+Bänder | B: Wirtschaftsmodell | C: Branching | D: ID-Echos |
|---|---|---|---|---|
| Spielerlebnis (Selbstwirksamkeit) | **Hoch** — explizite „Weil du…"-Momente, Krise, Wette | Mittel — Druck ja, aber Ursache unsichtbar („warum sinkt mein Geld?") | Sehr hoch — aber nur auf den auserzählten Pfaden | Hoch (≈80 % von A) |
| Realismus | Mittel–hoch (glaubwürdige Folgen) | Hoch (mechanisch), aber unfair wirkend im One-Shot | Hoch | Mittel–hoch |
| Umsetzungsaufwand | Mittel (Engine S–M, Content M) | Hoch (Modell + komplette Neubalancierung) | Sehr hoch, wächst exponentiell (4 P1-Szenarien × 3 Optionen = 12 Äste schon vor P2) | Klein |
| Wartbarkeit (TSV, Nicht-Devs) | **Hoch** — Spalten + Registry + Validator | Niedrig (Autoren müssten Modell verstehen) | Sehr niedrig (Graph-Verdrahtung in Tabellen) | Mittel — bricht still bei ID-Umbenennung; keine Mehrfach-Trigger |
| Risiko | Mittel (Content-Qualität, Balancing) | Hoch (Balance-Fläche verdoppelt, 3-Min-Format passt nicht) | Hoch (Content-Explosion, Restart-Varianz sinkt) | Niedrig |
| Messe-Eignung (3 Min, selbsterklärend) | **Top** — keine Mehrzeit, max. +1 Schritt nur bei Krise | Schlecht — Burn braucht Erklärung | Ok | Top |

**B verworfen** (auch als Ergänzung): Ein unsichtbarer Abfluss pro Schritt erzeugt Druck, aber keine Selbstwirksamkeit — niemand führt „Geld wurde weniger" auf die eigene Entscheidung zurück; Erklärbedarf und Balancing-Fläche passen nicht zum Format. **C verworfen:** kombinatorische Content-Kosten, unvereinbar mit dem TSV-Workflow; Marker sind „weiches Branching" mit linearen Content-Kosten. **D ist kein Endzustand** (stille Brüche bei Umbenennungen), aber eine legitime Rückfalloption, falls Zeit knapp wird — die Marker-Indirektion lässt sich später drüberlegen.

---

## 4. Empfehlung

**Ansatz A, in sechs session-unabhängigen Entwicklungsschritten (operative Roadmap: `docs/ROADMAP.md`, Kurzfassung §11), mit D als definierter Rückfalloption für das Echo-Feature.** Konkret die Kombination aus:
1. Deterministischer Engine-Unterbau (Seed + abgeleitete Slots) — macht bedingte Auswahl, Zurück-Navigation und automatisierte Tests gleichzeitig korrekt.
2. Cash-Bänder + sichtbares Options-Gating + max. 1 Krisen-Zwischenschritt (Soft-Fail statt Game Over).
3. Marker + bedingter Echo-Slot + marker-priorisierte Phase-5-Auswahl + „Weil du…"-Anmoderation + Kausalzeilen im Rückblick.
4. Budget-Runde mit Reserve-Option, Strategie-/Vernachlässigungs-Markern und Recap-Eintrag.

**Warum dieser Trade-off:** Er liefert die drei Zielbereiche mit *einem* gemeinsamen, kleinen Mechanismus (bedingte Content-Selektion über abgeleiteten Zustand), erweitert die vorhandene Architektur statt sie zu ersetzen (Replay-Ableitung, TSV-Pipeline), hält die Spielzeit (8, max. 9 Schritte) und bleibt für Nicht-Entwickler:innen pflegbar (2–3 neue Spalten + eine Marker-Registry, validiert beim Build).

**Was daran nicht ideal ist (ehrlich):**
1. **Der Engpass ist Content-Qualität, nicht Code.** Die gefühlte Kausalität steht und fällt mit 6–10 gut geschriebenen Echo-/Krisen-Texten. Mittelmäßige Texte → Mechanik wirkt aufgesetzt.
2. **Einmal-Spieler:innen sehen nur einen Ausschnitt des Systems** (~2–3 Kausalmomente pro Lauf). Ein Teil der gebauten Tiefe (z. B. Vernachlässigungs-Marker) wird statistisch selten erlebt — bewusster Preis für Fallback-Sicherheit.
3. **TSV-Header-Migration ist ein Lockstep-Breaking-Change** (der Validator lehnt unbekannte UND fehlende Spalten ab) — ein Commit muss Generator, alle TSVs und README gemeinsam migrieren; alte lokale Kopien von Content-Pfleger:innen brechen einmalig.
4. **Balancing wird komplexer** (Reserve vs. Investieren, Krisen-Quote) und ist nur per Simulations-Suite beherrschbar — die es noch nicht gibt und die dieser Plan deshalb als Pflichtbestandteil führt.
5. Die Quiz-Entschärfung der Punktwerte (§8.3) ist Feinarbeit am bestehenden Content — sie macht den Score weniger „lösbar", kann aber Stammbesucher irritieren, die den alten Score kennen.

---

## 5. Abgrenzung Code vs. Content

| Kategorie | Inhalte |
|---|---|
| **Code (Entwicklung)** | Seed-RNG + Slot-Ableitung (`deriveSlots`/`resolveStep`); `deriveRunState`-Erweiterung (Marker-Set, ungeclamptes `cashRaw`, Krisen-Info, Kausal-Records); Cash-Bänder + Options-Gating (UI + Logik); Krisen-Schritt-Flow; Alloc-Umbau (Reserve, Bonus-Ersatz, Marker); Recap-Kausal-UI + Alloc-Zeile; `formatMoney`-Vorzeichen-Fix; Validator-Erweiterung (`generate-content.mjs`); Sim-Suite (`scripts/simulate.mjs`, heute via `bun` lokal); CLAUDE.md-Invarianten-Update |
| **Content (danach, ohne Code)** | `marker.tsv` (Registry mit Beschreibung); `setzt_marker`-Zellen in `antworten.tsv`; `braucht_marker`/`bezug`-Zellen in `fragen.tsv`/`events.tsv`; 6–10 neue Echo-Events (positiv UND negativ); 1–2 Krisen-Szenarien; Band-/Krisen-Texte in `texte.tsv`; Punkte-Rebalancing; `content/README.md`-Erweiterung |
| **Gemischt** | Schwellenwerte (Cash-Bänder, Alloc-Dominanz/Vernachlässigung) — als Code-Konstanten in `gameData.ts`, getunt über Sim-Report + Standtests; Score-Malus-Differenzierung (Krise überlebt vs. pleite am Ende); Founder-Typ-Feinschliff |
| **Bewusst NICHT priorisieren** | Burn-Rate/Wirtschaftsmodell; echtes Branching; Telemetrie/Analytics (DSGVO-freier Stand bleibt); Persistenz/Accounts/CMS; Scoreboard-Backend; `prio`-/`verbietet_marker`-Spalten und Mehrfach-Marker pro Option (v1: genau 1 Marker, Dateireihenfolge entscheidet — nachrüstbar); hartes Game Over; Founders-Map-Aktivierung (wartet aufs App-Team) |

---

## 6. Produktanforderungen (umsetzungs- und review-fähig)

1. **PA-1 Cash-Bänder:** Cash hat drei abgeleitete Zustände (solide / angespannt / kritisch; Schwellen zentral konfiguriert). Der Zustand ist jederzeit im HUD erkennbar (Farbe + kurzes Label/Runway-Satz).
2. **PA-2 Sichtbares Gating mit Auffangnetz:** Optionen, deren Cash-Kosten den Kontostand übersteigen, sind sichtbar gesperrt mit Begründung („Zu teuer — braucht €X"), niemals versteckt; Optionen, die die Kasse unter €5.000 drücken würden, tragen ein „Riskant"-Badge. Ein **Code-Guard** garantiert, dass nie alle Optionen eines Szenarios gesperrt sind: Die günstigste bleibt als „Letzter Ausweg" wählbar, auch wenn sie die Kasse rechnerisch überzieht — die Krise (PA-3) fängt das auf. Der Validator **warnt** (kein Build-Abbruch), wenn ein Szenario keine Option mit `geld ≥ 0` hat; für das Krisen-Szenario gilt hart: ≥1 cash-positive Rettungsoption.
3. **PA-3 Krise statt stillem Clamping:** Fällt das intern ungeclampte Cash (`cashRaw`) nach einem committeten Schritt (Entscheidung, Event oder Verteil-Runde) **unter €3.000** (schließt ≤ 0 ein), wird genau einmal pro Lauf ein Krisen-Zwischenschritt eingefügt (3 realistische Auswege, alle mit Kosten/Marker, mindestens einer cash-positiv). Kosten werden nie mehr stillschweigend verschluckt; ein hartes Game Over gibt es nicht.
4. **PA-4 Insolvenz hinterlässt Spuren:** Wer die Krise durchläuft bzw. pleite endet, bekommt ein eigenes Rückblick-Kapitel und differenzierten Score-Malus (Beinahe-Pleite < Pleite am Ende). Die −30-Endstrafe bleibt als Obergrenze erhalten.
5. **PA-5 Marker-Gedächtnis:** Prägende Antworten setzen genau einen benannten **primären** Marker (namespaced, z. B. `tech:api`); das Schema ist bewusst auf spätere sekundäre Marker erweiterbar — kein dauerhaftes Limit. Marker sind ausschließlich aus `completed` abgeleitet (Replay) — Zurück-Navigation bleibt automatisch konsistent.
6. **PA-6 Echo-Slot:** Der Markt-Event-Slot bevorzugt Events, deren `braucht_marker` erfüllt ist; ohne Treffer greift garantiert ein generisches Fallback-Event. Max. 1 markergebundenes Echo pro Lauf. Der Vereins-Event-Slot (VCM-Branding) bleibt unverändert.
7. **PA-7 Konsequente Bewährungsprobe:** Die Phase-5-Szenario-Auswahl priorisiert Szenarien mit erfülltem `braucht_marker` (gleicher Selektionsmechanismus wie PA-6), Fallback: heutige Zufallsauswahl.
8. **PA-8 Erlebte Kausalität:** Jedes markergebunden ausgespielte Element (Echo, P5, Krise) zeigt eine kurze `bezug`-Anmoderation („Weil ihr früher … habt"). Keine stillen Konsequenzen.
9. **PA-9 Budget-Wette:** Die Verteil-Runde erlaubt Teilinvestition (Rest bleibt sichtbar als Rücklage in der Kasse); der +12-Pauschalbonus entfällt ersatzlos; ein dominanter Schwerpunkt setzt einen `fokus:`-Marker (exakte Dominanzformel: §8.8, sonst `fokus:balanced`), komplett leere Buckets bei nennenswerter Investition einen `vernachlaessigt:`-Marker, deutliche Zurückhaltung mit gesunder Kasse `cash_discipline` (wird über ein positives Echo belohnt). Die Verteilung erscheint im Rückblick.
10. **PA-10 Nachvollziehbarkeit:** Jede Wertänderung hat eine sichtbare Quelle (Delta-Chips + Karte + ggf. Bezug). Der Rückblick zeigt Kausalketten (Entscheidung → ausgelöste Folge) zusätzlich zu den heutigen Alternativen.
11. **PA-11 Determinismus & Robustheit:** Ein Lauf ist durch (Seed, Entscheidungen) vollständig bestimmt; Zurück + identisch neu wählen reproduziert exakt denselben Verlauf (inkl. Optionsreihenfolge). Refresh = Neustart bleibt akzeptiert.
12. **PA-12 Format-Erhalt:** Standardlauf 8 Schritte (~3 Min), Krisenlauf max. 9 Schritte (~4 Min); keine neuen Pflicht-Erklärscreens; `Result`-Schnittstelle (Founders-Map-Hooks) unverändert.

---

## 7. Content-Ziele

**Neue Inhaltstypen** (alle TSV-pflegbar, alle B2B-tauglich, Fachbegriffe inline erklärt):

1. **Marker-Registry** (`marker.tsv`, ~10–12 Einträge, je 1 Zeile Beschreibung). Startliste aus dem *vorhandenen* Content ableitbar: `ziel:enterprise`, `tech:api`, `tech:eigenmodell`, `funding:investor`, `funding:bootstrap`, `risiko:datendeal`, `tempo:hoch`, `abhaengigkeit:marketplace`, `fokus:produkt|marketing|community|datenschutz`, `vernachlaessigt:datenschutz|produkt`, `krise:notfinanzierung`.
2. **Echo-Events** (6–10 Stück, Kategorie `markt`, je mit `braucht_marker` + `bezug`). **Wichtig: nicht nur Strafen — auch verdiente Ernten**, sonst fühlt sich das Gedächtnis wie eine Falle an. Beispiele:
   - `tech:api` → „Euer KI-Anbieter verdoppelt die API-Preise." (€−8k, in−2) — heutiges `markt-kosten` wird zur verdienten Variante.
   - `ziel:enterprise` → „Euer Großkunde verschiebt den Rollout — ein Quartal Umsatz fehlt." (€−6k, gr−4)
   - `funding:investor` (positiv) → „Euer Angel öffnet sein Netzwerk: zwei warme Enterprise-Intros." (gr+8)
   - `fokus:community` (positiv) → „Eure Community verteidigt euch öffentlich gegen einen Shitstorm." (co+6, im+4)
   - `vernachlaessigt:datenschutz` → „Ein Konzernkunde verlangt vor Verlängerung ein Datenschutz-Audit." (€−6k, im−4)
   - `tempo:hoch` → „Zwei Schlüsselleute melden sich erschöpft krank." (co−8, gr−4)
3. **Krisen-Szenario(s)** (1–2, neue Kategorie/Phase `krise`, 3 Optionen): Brückenfinanzierung („Bridge" = kurzfristiger Kredit/Wandeldarlehen, kostet Anteile/Vertrauen, +Cash), harte Sparrunde (Team-/Tempo-Malus), Notumsatz/Consulting (Fokus-Malus, +Cash). Lehrtext erklärt „Runway" in einem Satz.
4. **Bezugs-Sätze** für die 4 bestehenden P5-Szenarien (die thematisch bereits perfekt auf Marker passen: `p5-keycustomer`↔enterprise, `p5-burnout`↔tempo, `p5-incumbent-copy`↔api/marketplace, `p5-crisis`↔generisch) + `braucht_marker`-Zellen.
5. **Zustandstexte** (`texte.tsv`): Band-Labels/Runway-Sätze („Angespannt: Noch ~2 schwere Ausgaben bis zur Krise"), Krisen-Anmoderation, Recap-Kapitel „Beinahe-Pleite".
6. **Punkte-Rebalancing** (Bestandscontent): Spannweiten reduzieren, sodass mehrere Wege tragfähig sind (§8.3); verlockend-schlechte Optionen behalten hohe Sofort-Erträge, ihre Kosten wandern in Marker-Folgen.

**Gute Frageart (Muster):** Sofortnutzen vs. Spätfolge sichtbar im Text angelegt („+€60.000 sofort — aber der Investor will Mitsprache"), sodass das spätere Echo als logisch empfunden wird, nicht als Strafe aus dem Nichts.

---

## 8. Balancing-Ziele

1. **Score-Komposition bleibt stabil** (Formel unangetastet: Punkte + Säulensumme/2 + Cash-Bonus/Strafe), damit Scoreboard-Vergleiche am Stand gültig bleiben; Verschiebungen (Alloc-Bonus-Wegfall ≈ −12) werden über Punkte-Rebalancing kompensiert und per Sim-Verteilungsvergleich vor/nach belegt.
2. **Krisen-Quote als Zielkorridor:** ~20–35 % der Läufe bei risikofreudigem Spiel, <10 % bei umsichtigem; 0 % Soft-Locks. Quote wird per Monte-Carlo (random / billigst / punkte-greedy / cash-aggressiv) gemessen — zunächst als Report, Fail-Schwellen erst nach Standtest.
3. **Quiz-Entschärfung:** Ziel ≥8 der 20 Szenarien mit Top-Punktabstand ≤4 (heute: 0; alle 20 eindeutig). Differenzierung wandert von verdeckten Punkten in erlebbare Konsequenzen (Marker-Folgen, Cash).
4. **Keine dominante Strategie:** Voll-Investieren vs. Reserve dürfen sich im Erwartungs-Score nur kontextabhängig unterscheiden (Reserve gewinnt in knappen Läufen via Krisen-Vermeidung, Investieren in soliden); kein Pfad darf strikt dominieren (Sim-Check).
5. **Glück klein, Konsequenz mittel:** Zufalls-Events bleiben klein (Invariante); markergebundene Echos dürfen größer sein als Glück, weil verdient — neue Invariante fürs Repo-CLAUDE.md.
6. **Wertebereiche überwachen:** Säulen haben kein Logik-Maximum (nur UI-Max 80) — die Sim reportet Min/Max je Säule, damit Marker-/Alloc-Änderungen die Anzeige nicht sprengen.
7. **Pleite-Differenzierung:** Krise überlebt = Kosten bereits über Optionen + Marker bezahlt (kein Pauschal-Malus); Cash ≤ 0 am Ende = −30 wie heute.
8. **Konkrete Default-Schwellen** (zentrale Konstanten in `gameData.ts`, per Playtest/Sim tunbar):
   - **Cash-Bänder:** solide ≥ €10.000 · angespannt €5.000–9.999 · kritisch < €5.000. „Riskant"-Badge auf Optionen, deren Wahl die Kasse unter €5.000 drücken würde. **Krisen-Trigger: `cashRaw` < €3.000** nach einem committeten Schritt (max. 1/Lauf; schließt ≤ 0 ein — deckt damit auch ungegatete Events und den „Letzter Ausweg"-Fall ab).
   - **Alloc-Dominanz:** `fokus:<bucket>` nur wenn höchster Bucket ≥ €6.000 **und** ≥ 40 % des ausgegebenen Budgets **und** Abstand zum zweithöchsten ≥ €2.000; sonst bei Investition ≥ €6.000 `fokus:balanced`. `vernachlaessigt:datenschutz` wenn ≥ €9.000 investiert und der Impact-Bucket €0 bleibt. `cash_discipline` wenn ≤ 40 % des Pots ausgegeben und Cash danach ≥ €10.000.
   - **Bewusst kein `runway_risk`-Marker:** Das Cash-Band *ist* bereits der abgeleitete Zustand dafür (steuert UI und Krise) — ein zusätzlicher Marker würde dieselbe Wahrheit duplizieren.

---

## 9. UX-Ziele

1. **Bänder sofort lesbar:** Cash-Zeile in der StatBar färbt sich (neutral → warm → rot) + Ein-Wort-Label; bei Bandwechsel ein kurzer Hinweis-Satz auf der nächsten Karte — kein Modal, kein Extra-Screen.
2. **Gesperrt ≠ versteckt:** Zu teure Optionen bleiben sichtbar, ausgegraut, mit „Zu teuer (braucht €X)" — der Lerneffekt „kein Geld = keine guten Optionen" ist gewollt.
3. **Krise als Sondersituation:** eigener visueller Akzent (Farbe/Icon), Anmoderation nennt die Ursache („Eure Kasse ist unter €X gefallen"), 3 Optionen im vertrauten Karten-Layout — null neue Bedienmuster.
4. **Echo-Badge:** markergebundene Karten tragen eine kleine Kennzeichnung „Folge eurer Entscheidung" + `bezug`-Satz. Delta-Chips (bestehend) bleiben die Quelle jeder Wertänderung.
5. **Budget-Runde:** Restbetrag wird als „bleibt als Rücklage" positiv geframt (nicht als Fehler); beim Bestätigen kurzer Hinweis auf den gewählten Schwerpunkt („Starker Marketing-Fokus — mal sehen, ob das Produkt mithält"), ohne den Ausgang zu verraten.
6. **Rückblick erzählt die Geschichte:** Kausalzeilen („→ löste in Phase 5 … aus"), Budget-Zeile, ggf. Beinahe-Pleite-Kapitel; Share-Funktion unverändert.
7. **Akzeptierte Kosmetik:** Der Fortschrittsbalken springt beim Einfügen des Krisen-Schritts einmalig leicht zurück (8→9 Segmente) — bewusst akzeptiert und dokumentiert statt wegarchitektiert.

---

## 10. Risiken und Gegenmaßnahmen

| # | Risiko | Gegenmaßnahme |
|---|---|---|
| 1 | Content-Aufwand unterschätzt; Echos wirken generisch | Klein starten (6–10 Echos, Registry ≤12 Marker); `bezug` als Pflichtfeld bedingter Inhalte; Eva-/Thomas-Review der Texte vor Live |
| 2 | Kausalität wirkt künstlich („Das Spiel bestraft mich") | Max. 1 markergebundenes Echo/Lauf; positive Ernten einbauen; Folgen im Optionstext andeuten (§7) |
| 3 | Balancing kippt (Reserve- statt Invest-Dominanz; Krisen-Quote falsch) | Sim-Suite ab Stufe 1 als Report; Schwellen als zentrale Konstanten; Korridore erst nach Standtest zu Fail-Kriterien machen |
| 4 | TSV-Migration bricht Content-Pfleger-Workflow (Exact-Match-Header) | Lockstep-Commit (Generator + TSVs + README + Beispielzeilen); Generator-Fehlermeldungen nennen Datei+Zeile+erwartete Header |
| 5 | goBack/Krisen-Randfälle erzeugen inkonsistente Zustände | Alles abgeleitet (Seed + `completed`), kein gecachter Timeline-State; Determinismus-Property-Test; React-StrictMode-sicher weil idempotent |
| 6 | Spielzeit wächst über Messe-Format | Hartes Budget: max. +1 Schritt (nur Krise), keine neuen Pflicht-Screens, `bezug` ≤1 Satz; Stoppuhr-Playthroughs als Abnahme |
| 7 | Zu deterministisch — zweiter Run fühlt sich gleich an | Seed pro Run neu; Pools bleiben zufällig innerhalb der Eligibility; Fallbacks rotieren |
| 8 | Score-Vergleichbarkeit am Stand bricht | Formel stabil; +12-Wegfall dokumentieren (Annahme: Scoreboard startet zur Messe frisch); Sim-Verteilungsvergleich alt/neu vor Merge |
| 9 | Sim-/Check-Skripte scheitern an TS-Imports (extensionslose Specifier in `node`) | Heute pragmatisch: Skripte lokal mit `bun` ausführen (auf dem Rechner installiert, keine Projekt-Dependency); saubere `node:test`-Integration ist Follow-up nach der Messe |
| 10 | Same-Day-Deploy 3 Tage vor der Messe (15.06.) | Gates A–D: jeder Zwischenstand ist ein konsistentes Spiel; Merge auf `main` erst nach S6-Gesamtverifikation; Vercel-Rollback-Ziel vor dem Merge notieren; Live-Smoke über Mobilfunk (Uni-Netz fängt `*.vercel.app` ab) |

---

## 11. Roadmap (Kurzfassung — operative Detailplanung in `docs/ROADMAP.md`)

Die Umsetzung ist in **6 session-unabhängige Entwicklungsschritte** geschnitten, die jeweils in einer frischen Agent-Session umsetzbar sind (Ziel: alle am 2026-06-12, am Ende Merge auf `main` = Auto-Deploy via Vercel). Jede Session hat in `docs/ROADMAP.md` einen self-contained Block mit Arbeitsregeln, Aufgaben, Architektur-Details, Definition of Done und kopierbarem Session-Start-Prompt.

| # | Session | Kern | Gate danach |
|---|---|---|---|
| S1 | Cash-Sichtbarkeit | Bänder + HUD-Färbung, sichtbares Gating („Zu teuer"), „Riskant"-Badge, „Letzter Ausweg"-Guard, `formatMoney`-Fix, `cashRaw` | **A** (deploybar) |
| S2 | Deterministischer Unterbau (zeitgeboxt) | `runSeed` + `deriveSlots` + `resolveStep` mit slot-ID-gekeytem PRNG inkl. Options-Shuffle; Verhalten unverändert | — |
| S3 | Krise & Beinahe-Pleite | Krisen-Slot-Injektion (Trigger `cashRaw` < €3.000, max. 1), Krisen-Content via `phase = krise`, Recap-Eintrag | **B** (deploybar) |
| S4 | Gedächtnis (Herzstück) | TSV-Lockstep-Migration (Marker/Bezug), Echo-Slot + P5-Priorisierung (ein Selektor), Echo-Badge + „Weil ihr…", 4–6 Echo-Events (≥2 positiv), Recap-Kausalzeile | **C** (Kernziel) |
| S5 | Budget-Wette | Reserve statt Vollausgabe-Zwang, +12-Bonus raus (Logik+UI), Dominanz-/`vernachlaessigt:`-/`cash_discipline`-Marker (§8.8), Alloc im Recap | **D** (komplett) |
| S6 | Stabilisierung + Deploy | simulate.mjs light (harte Invarianten + Report), 3 Stoppuhr-Playthroughs, Doku/CLAUDE.md, Merge → `main`, Live-Smoke via Mobilfunk, Rollback-Ziel notiert | **Live** |

**Reihenfolge-Begründung:** S1 zuerst (sichtbarer Nutzen sofort — Review-Empfehlung gegen „unsichtbare Infrastruktur zuerst"); S2 bleibt zwingend **vor** S3/S4, weil bedingte Auswahl ohne deterministisches Lazy-Resolve die Zurück-Navigation bricht — dafür hart zeitgeboxt. P5-Priorisierung liegt in S4 (gleicher Selektionscode wie Echo-Slot, Content fast gratis, und Kausalität, die in eine *Entscheidung* mündet, erzeugt stärkere Selbstwirksamkeit als ein weiteres Event). Die Gates A–D sind die Stoppregeln: Was bis Tagesende nicht verifiziert ist, fliegt aus dem Merge — jedes Gate hinterlässt ein konsistentes Spiel.

---

## 12. Akzeptanzkriterien

1. **Determinismus:** Gleicher Seed + gleiche Wahlen (auch mit Zurück-Umwegen) → bit-identischer Endzustand inkl. Optionsreihenfolge (Property-Test grün).
2. **Echo:** Lauf mit gesetztem Marker und passendem Pool-Event zeigt im Echo-Slot das bedingte Event **mit** Bezug-Anmoderation; Lauf ohne Marker zeigt ein generisches Event. Nie >1 markergebundenes Echo. (Sim + manuell)
3. **P5-Kausalität:** Bei gesetztem passendem Marker erscheint das zugehörige P5-Szenario priorisiert mit Bezug; im Rückblick ist die Kette Entscheidung→Folge sichtbar.
4. **Cash-Konsequenz:** Jeder Lauf, der das kritische Band erreicht, enthält ≥1 sichtbare Folge (Band-Anzeige, Sperrung, Badge oder Krise); `cashRaw` < €3.000 nach einem Commit injiziert genau einmal den Krisen-Schritt; Kosten > Kassenstand sind nicht mehr wählbar — einzige Ausnahme ist der gekennzeichnete „Letzter Ausweg" (nie alle Optionen gesperrt), dessen Überziehung die Krise auslöst. Kein stilles Verschlucken von Kosten mehr.
5. **Keine Sackgassen:** ≥2.000 Sim-Läufe heute (Ausbau auf 10.000 im Follow-up; random + Extremstrategien): nie 0 wählbare Optionen, jeder Slot auflösbar, `slots.length ≤ 9`, Spiel terminiert immer im Result.
6. **Budget-Wette:** Zwei Läufe mit identischen Entscheidungen, aber gegensätzlicher Allokation (z. B. alles Marketing vs. alles Datenschutz + Reserve) unterscheiden sich in mindestens einem späteren Spielelement und im Rückblick; Reserve ist wählbar und im Recap ausgewiesen.
7. **Nachvollziehbarkeit:** Stichproben-Playthrough: jede Wertänderung einer Quelle zuordenbar (Chips/Karte/Bezug); keine stille Änderung.
8. **Format:** Standardlauf 8 Schritte, Krisenlauf 9; geskriptete Playthroughs ≤ ~4 Min; mobile Darstellung (max-w-md, Touch-Targets) unverändert nutzbar.
9. **Content-Robustheit:** Validator-Rotproben (unbekannter Marker, fehlender Fallback im Echo-Pool/pro Phase, Krisen-Szenario ohne cash-positive Option, fehlende Spalte) brechen den Build mit deutscher Fehlermeldung + Datei/Zeile; Szenario ohne `geld ≥ 0`-Option erzeugt eine Warnung; Grünprobe baut durch.
10. **Kompatibilität:** `npx tsc --noEmit` + `npm run build` grün; `Result`-Signatur/Founders-Map-Hooks unverändert; Score-Verteilung alt/neu dokumentiert verglichen.
11. **Quiz-Entschärfung (Follow-up nach der Messe):** ≥8/20 Szenarien ohne eindeutig dominante Option (Top-Abstand ≤4 Punkte), gemessen per Content-Skript.

---

## 13. Entschiedene und offene Fragen

**Entschieden (Peer-Review + Owner, 2026-06-12):**
1. **Krisen-Trigger:** Band-basiert — `cashRaw` < €3.000 nach einem committeten Schritt (nicht „Unter-0-Versuch"); Gating sperrt zu teure Optionen, der „Letzter Ausweg"-Guard verhindert Voll-Sperrung (PA-2/PA-3, §8.8).
2. **+12-Alloc-Bonus:** entfällt ersatzlos; Kompensation erst mit dem Punkte-Rebalancing nach der Messe.
3. **Quiz-Entschärfung (Punkte-Rebalancing):** Follow-up nach der Messe, mit Sim- und Standdaten.
4. **Skript-Runner:** Check-/Sim-Skripte laufen heute lokal via `bun` (auf dem Rechner installiert, keine Projekt-Dependency); `node:test`-Integration ist Follow-up — keine neue devDependency nötig.

**Noch offen:**
1. **Scoreboard-Annahme bestätigen:** Der +12-Wegfall verschiebt Scores um ca. −12; Annahme: Das Scoreboard startet zur Messe frisch, alte Scores zählen nicht weiter (Konfidenz 85 % — falls doch, braucht es einen kleinen Ausgleichsbonus).
2. **Schwellen-Feintuning:** €10k/€5k/€3k und die Dominanzformel sind Startwerte; finale Justierung nach dem ersten Playtest (Konfidenz 80 % — Konstanten liegen zentral in `gameData.ts`, Änderung = 1 Zeile).

---

## 14. Verifikation (extern prüfbar)

1. **Automatisch, je Session:** `npx tsc --noEmit` · `npm run build` (führt Content-Validator aus) · Determinismus-/Invarianten-Checks und `scripts/simulate.mjs` (heute ≥2.000 Läufe, lokal via `bun` ausgeführt; `node:test`-Integration + 10.000er-Läufe als Follow-up) — Sackgassen, Krisen-Quote, Score-/Säulen-Verteilungen, Fallback-Garantie.
2. **Content-Negativproben:** je Validator-Regel ein bewusst kaputtes TSV-Fixture → Build muss mit verständlicher deutscher Meldung brechen.
3. **Manuelle Playthrough-Skripte (Stoppuhr, am Handy):** (a) Pleite-Pfad (teuerste Optionen) → Band-Eskalation, Gating, Krise, Recap-Kapitel; (b) Enterprise/API-Pfad → Echo + passende P5 mit Bezug; (c) Sparsam-Pfad mit Reserve → keine Krise, Reserve im Recap; jeweils mit Zurück-Umwegen zur Determinismus-Kontrolle.
4. **Score-Regression:** Sim-Verteilungsvergleich `main` vs. `more-consequence` dokumentiert (Scoreboard-Fairness).

## 15. Anhang: Datei-Mapping & Schema (Ticket-Basis)

**Kerndateien** (alle unter `startup-simulation/`):
- `src/lib/gameLogic.ts` — neu: `mulberry32`, `hashSlot`, `deriveSlots`, `resolveStep`, `cashBand`, `isOptionLocked`; erweitert: `deriveRunState` (Marker-Set, `cashRaw`, Krisen-Info, Kausal-Records — ein Replay-Pass); Fixes: `formatMoney`-Vorzeichen (Z. 117), Alloc-Bonus (Z. 180), Cash-Clamp-Behandlung (Z. 62).
- `src/lib/gameData.ts` — Konstanten `CASH_BANDS`, `CRISIS`, `ALLOCATION`-Anpassungen; Typ-Erweiterungen (`Option.marker?`, `Scenario`/`LuckEvent.requiresMarker?/reference?`, `Slot`).
- `src/app/page.tsx` — `Game`: `runSeed` statt `timeline`-State (Z. 258, 270-275), `advance`/`finishAlloc` gegen `deriveSlots(nextCompleted).length` (Z. 301, 314), Krisen-Zweig in `advance`; `DecisionCard`: Locked-State + Badge + Bezug (Krise rendert über dieselbe Komponente); `EventCard`: Bezug; `AllocationCard`: Button-Freigabe (Z. 887-894) + Badge-Ersatz (Z. 780-793) + Reserve-Label; `Result`/`RecapItem`: Kausalzeilen, Alloc-Zeile, Krisen-Kapitel — Founders-Map-Hooks unangetastet.
- `scripts/generate-content.mjs` — Header-Erweiterung (Exact-Match beachten!), `marker.tsv`-Parsing, neue Regeln (Marker-Syntax/-Referenzen, Fallback-Garantien, kostenfreie Option, Krisen-Pool).
- `content/*.tsv` + `marker.tsv` + `content/README.md` — Lockstep-Migration; `texte.tsv` um Band-/Krisen-Texte.
- `scripts/simulate.mjs` + Check-Skripte — Sim & Invarianten (heute lokal via `bun` ausgeführt; `node:test`-Integration Follow-up).
- Repo-`CLAUDE.md` — Invarianten-Update (Timeline „8 + max 1", Alloc-Reserve, neue Checks).

**TSV-Schema-Erweiterung (v1, deutsch, leere Zellen erlaubt):**
- `antworten.tsv` + Spalte `setzt_marker` (genau 0–1 **primärer** Marker; sekundäre Marker-Spalte später nachrüstbar)
- `fragen.tsv` + Spalten `braucht_marker`, `bezug`
- `events.tsv` + Spalten `braucht_marker`, `bezug`
- neu `marker.tsv`: `marker  beschreibung`
- bewusst NICHT in v1: `prio`, `verbietet_marker`, Marker-Listen (Dateireihenfolge + „spezifischste Bedingung zuerst" genügt bei dieser Pool-Größe)
