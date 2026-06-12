# Founder's Run — Plan „more-consequence": Vom Quiz zur Simulation

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

**Ansatz A, in fünf inkrementellen Stufen (Roadmap §11), mit D als definierter Rückfalloption für das Echo-Feature.** Konkret die Kombination aus:
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
| **Code (Entwicklung)** | Seed-RNG + Slot-Ableitung (`deriveSlots`/`resolveStep`); `deriveRunState`-Erweiterung (Marker-Set, ungeclamptes `cashRaw`, Krisen-Info, Kausal-Records); Cash-Bänder + Options-Gating (UI + Logik); Krisen-Schritt-Flow; Alloc-Umbau (Reserve, Bonus-Ersatz, Marker); Recap-Kausal-UI + Alloc-Zeile; `formatMoney`-Vorzeichen-Fix; Validator-Erweiterung (`generate-content.mjs`); Sim-Suite (`scripts/simulate.mjs` + `node:test`); CLAUDE.md-Invarianten-Update |
| **Content (danach, ohne Code)** | `marker.tsv` (Registry mit Beschreibung); `setzt_marker`-Zellen in `antworten.tsv`; `braucht_marker`/`bezug`-Zellen in `fragen.tsv`/`events.tsv`; 6–10 neue Echo-Events (positiv UND negativ); 1–2 Krisen-Szenarien; Band-/Krisen-Texte in `texte.tsv`; Punkte-Rebalancing; `content/README.md`-Erweiterung |
| **Gemischt** | Schwellenwerte (Cash-Bänder, Alloc-Dominanz/Vernachlässigung) — als Code-Konstanten in `gameData.ts`, getunt über Sim-Report + Standtests; Score-Malus-Differenzierung (Krise überlebt vs. pleite am Ende); Founder-Typ-Feinschliff |
| **Bewusst NICHT priorisieren** | Burn-Rate/Wirtschaftsmodell; echtes Branching; Telemetrie/Analytics (DSGVO-freier Stand bleibt); Persistenz/Accounts/CMS; Scoreboard-Backend; `prio`-/`verbietet_marker`-Spalten und Mehrfach-Marker pro Option (v1: genau 1 Marker, Dateireihenfolge entscheidet — nachrüstbar); hartes Game Over; Founders-Map-Aktivierung (wartet aufs App-Team) |

---

## 6. Produktanforderungen (umsetzungs- und review-fähig)

1. **PA-1 Cash-Bänder:** Cash hat drei abgeleitete Zustände (solide / angespannt / kritisch; Schwellen zentral konfiguriert). Der Zustand ist jederzeit im HUD erkennbar (Farbe + kurzes Label/Runway-Satz).
2. **PA-2 Sichtbares Gating:** Optionen, deren Kosten das verfügbare Cash übersteigen, sind sichtbar gesperrt mit Begründung („Zu teuer — braucht €X"), niemals versteckt. Jedes Szenario garantiert ≥1 Option ohne Cash-Kosten (Validator-Regel) — pleite sein heißt „nur noch unbequeme Optionen", nie „keine Optionen".
3. **PA-3 Krise statt stillem Clamping:** Fällt Cash nach einem committeten Schritt ins kritische Band, wird genau einmal pro Lauf ein Krisen-Zwischenschritt eingefügt (3 realistische Auswege, alle mit Kosten/Marker). Kosten werden nie mehr stillschweigend verschluckt; ein hartes Game Over gibt es nicht.
4. **PA-4 Insolvenz hinterlässt Spuren:** Wer die Krise durchläuft bzw. pleite endet, bekommt ein eigenes Rückblick-Kapitel und differenzierten Score-Malus (Beinahe-Pleite < Pleite am Ende). Die −30-Endstrafe bleibt als Obergrenze erhalten.
5. **PA-5 Marker-Gedächtnis:** Prägende Antworten setzen genau einen benannten Marker (namespaced, z. B. `tech:api`). Marker sind ausschließlich aus `completed` abgeleitet (Replay) — Zurück-Navigation bleibt automatisch konsistent.
6. **PA-6 Echo-Slot:** Der Markt-Event-Slot bevorzugt Events, deren `braucht_marker` erfüllt ist; ohne Treffer greift garantiert ein generisches Fallback-Event. Max. 1 markergebundenes Echo pro Lauf. Der Vereins-Event-Slot (VCM-Branding) bleibt unverändert.
7. **PA-7 Konsequente Bewährungsprobe:** Die Phase-5-Szenario-Auswahl priorisiert Szenarien mit erfülltem `braucht_marker` (gleicher Selektionsmechanismus wie PA-6), Fallback: heutige Zufallsauswahl.
8. **PA-8 Erlebte Kausalität:** Jedes markergebunden ausgespielte Element (Echo, P5, Krise) zeigt eine kurze `bezug`-Anmoderation („Weil ihr früher … habt"). Keine stillen Konsequenzen.
9. **PA-9 Budget-Wette:** Die Verteil-Runde erlaubt Teilinvestition (Rest bleibt sichtbar als Rücklage in der Kasse); der +12-Pauschalbonus entfällt bzw. wird score-neutral ersetzt; ein dominanter Schwerpunkt setzt einen `fokus:`-Marker, komplett leere Buckets (bei nennenswerter Investition) einen `vernachlaessigt:`-Marker. Die Verteilung erscheint im Rückblick.
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
| 8 | Score-Vergleichbarkeit am Stand bricht | Formel stabil; Bonus-Wegfall kompensieren; Sim-Verteilungsvergleich alt/neu vor Merge |
| 9 | Sim-Suite scheitert an TS-Imports (extensionslose Specifier, `node --test`) | Stufe 1 klärt Import-Strategie: Extension-Imports + `allowImportingTsExtensions` (Zero-Dependency, gegen Webpack-Dev UND Turbopack-Build verifizieren); Fallback `tsx` nur nach Freigabe |

---

## 11. Priorisierte Roadmap (jede Stufe einzeln shippable & testbar)

| Stufe | Inhalt | Priorität | Verifikation | Risiko |
|---|---|---|---|---|
| **1. Deterministischer Unterbau** | `runSeed`-State ersetzt `timeline`-State; `deriveSlots(completed)` + `resolveStep(seed, slot, marker)` mit **slot-ID-gekeytem** PRNG (mulberry32) — nicht sequenziell, nicht index-gekeyt (sonst ändert eine Krisen-Injektion alle Folge-Draws); Options-Shuffle aus demselben Stream; `buildRun`/`pickLuckEvent` gehen darin auf; TS-Import-Fix; `simulate.mjs`-Skelett + Determinismus-Property-Test. **Spielverhalten: unverändert.** | Must | `npx tsc --noEmit` + `npm run build` grün; manuell: Zurück+Vor → identische Frage & Optionsreihenfolge; Property-Test | niedrig |
| **2. Cash-Realität** | `cashBand()`, HUD-Färbung + Band-Label, Options-Gating („zu teuer", PA-2), `formatMoney`-Fix, ungeclamptes `cashRaw` in `deriveRunState`, Validator-Regel „≥1 kostenfreie Option/Szenario" (+ ggf. 2–3 Content-Zellen nachziehen) | Must | Worst-Case-Pfad manuell; Validator-Rot/Grün-Probe; Sim-Invariante „nie 0 wählbare Optionen" | niedrig–mittel |
| **3. Gedächtnis (Herzstück)** | TSV-Migration (Lockstep): `setzt_marker` (antworten), `braucht_marker`+`bezug` (fragen, events), `marker.tsv`; Marker in `deriveRunState`; Echo-Slot mit Fallback (PA-6); **P5-Priorisierung aus Entscheidungs-Markern (PA-7)** — gleicher Selektionscode, Content fast gratis (4 Zellen + 4 Bezugs-Sätze); Echo-Badge + Bezug-UI; Recap-Kausalzeilen; 6–10 Echo-Events | Must | Sim: Fallback-Garantie, max 1 Echo; gezielte Läufe (Marker → Echo erscheint mit Bezug; ohne → generisch); Text-Review | mittel (Content-Qualität) |
| **4. Krise & Beinahe-Pleite** | Krisen-Slot-Injektion in `deriveSlots` (max 1, Trigger = kritisches Band nach committetem Schritt); Krisen-Content (3 Optionen + Marker); Result-Trigger gegen `deriveSlots(nextCompleted).length`; Recap-Kapitel; Score-Differenzierung | Should (stark empfohlen) | Sim-Krisen-Quote-Report; manuell durch Krise zurück/vor navigieren; Stoppuhr ≤ ~4 Min | mittel |
| **5. Budget-Wette** | Bestätigen ohne Vollverteilung (implizite Reserve — `computeAllocationPot`/`applyAllocation` bleiben unverändert); +12-Bonus ersetzen (Logik `gameLogic.ts:180` UND UI-Badge synchron); `fokus:`/`vernachlaessigt:`-Marker (Schwellen; vernachlässigt nur bei nennenswerter Investition); Alloc im Recap; Hinweis-Texte | Should | Alloc-Randfälle (pot<500, alles Reserve, Dominanz); Sim-Score-Verteilung alt/neu (Scoreboard!) | niedrig–mittel |
| **6. Feinschliff** | Punkte-Rebalancing (Quiz-Entschärfung §8.3); weitere positive Ernte-Events; Korridor-Schwellen in Sim scharf schalten; Repo-CLAUDE.md-Invarianten aktualisieren („8 + max 1 Krisenschritt", neue Verifikationskommandos) | Nice→Should | Sim-Korridore grün; 3 geskriptete Playthroughs (Pleite-Pfad, Enterprise-Pfad, Sparsam-Pfad) | niedrig |

Nach **Stufe 3** ist das Produktziel zu ~70 % erlebbar; Stufen sind einzeln mergebar (Branch `more-consequence`, PR-fähig je Stufe). Bewusste Abweichung vom Architektur-Stresstest: P5-Priorisierung in Stufe 3 statt 5, weil sie denselben Selektionsmechanismus nutzt und Kausalität, die in eine *Entscheidung* mündet, stärkere Selbstwirksamkeit erzeugt als ein weiteres Event.

---

## 12. Akzeptanzkriterien

1. **Determinismus:** Gleicher Seed + gleiche Wahlen (auch mit Zurück-Umwegen) → bit-identischer Endzustand inkl. Optionsreihenfolge (Property-Test grün).
2. **Echo:** Lauf mit gesetztem Marker und passendem Pool-Event zeigt im Echo-Slot das bedingte Event **mit** Bezug-Anmoderation; Lauf ohne Marker zeigt ein generisches Event. Nie >1 markergebundenes Echo. (Sim + manuell)
3. **P5-Kausalität:** Bei gesetztem passendem Marker erscheint das zugehörige P5-Szenario priorisiert mit Bezug; im Rückblick ist die Kette Entscheidung→Folge sichtbar.
4. **Cash-Konsequenz:** Jeder Lauf, der das kritische Band erreicht, enthält ≥1 sichtbare Folge (Band-Anzeige, Sperrung oder Krise); Erreichen des kritischen Bands nach einem Commit injiziert genau einmal den Krisen-Schritt; Kosten > Kassenstand sind nicht mehr wählbar (kein stilles Verschlucken mehr).
5. **Keine Sackgassen:** 10.000 Sim-Läufe (random + Extremstrategien): nie 0 wählbare Optionen, jeder Slot auflösbar, `slots.length ≤ 9`, Spiel terminiert immer im Result.
6. **Budget-Wette:** Zwei Läufe mit identischen Entscheidungen, aber gegensätzlicher Allokation (z. B. alles Marketing vs. alles Datenschutz + Reserve) unterscheiden sich in mindestens einem späteren Spielelement und im Rückblick; Reserve ist wählbar und im Recap ausgewiesen.
7. **Nachvollziehbarkeit:** Stichproben-Playthrough: jede Wertänderung einer Quelle zuordenbar (Chips/Karte/Bezug); keine stille Änderung.
8. **Format:** Standardlauf 8 Schritte, Krisenlauf 9; geskriptete Playthroughs ≤ ~4 Min; mobile Darstellung (max-w-md, Touch-Targets) unverändert nutzbar.
9. **Content-Robustheit:** Validator-Rotproben (unbekannter Marker, fehlender Fallback im Echo-Pool, Szenario ohne kostenfreie Option, fehlende Spalte) brechen den Build mit deutscher Fehlermeldung + Datei/Zeile; Grünprobe baut durch.
10. **Kompatibilität:** `npx tsc --noEmit` + `npm run build` grün; `Result`-Signatur/Founders-Map-Hooks unverändert; Score-Verteilung alt/neu dokumentiert verglichen.
11. **Quiz-Entschärfung (nach Stufe 6):** ≥8/20 Szenarien ohne eindeutig dominante Option (Top-Abstand ≤4 Punkte), gemessen per Content-Skript.

---

## 13. Offene Fragen (entscheidungsrelevant, je mit Empfehlung)

1. **Krisen-Trigger:** Band-Schwelle (z. B. < €3.000) statt „Wahl würde unter 0 drücken"? Die beiden Mechanismen schließen sich teilweise aus, weil Gating (PA-2) Unter-0-Versuche fast unmöglich macht. **Empfehlung: Band-Schwelle** — muss vor Stufe 2/4 fixiert sein.
2. **+12-Alloc-Bonus-Ersatz:** ersatzlos streichen (einfach, verschiebt Score-Ökonomie um −12) oder kleiner kontextneutraler Ausgleich? **Empfehlung: ersatzlos + Kompensation im Punkte-Rebalancing**, Sim-Vergleich entscheidet.
3. **Sim-Suite-Imports:** Falls der Zero-Dependency-Weg (Extension-Imports + `allowImportingTsExtensions`) im Next-Build hakt: Ist die Einzel-devDependency `tsx` freigegeben? **Empfehlung: erst Zero-Dependency versuchen; `tsx` nur nach deiner Freigabe.**
4. **Tiefe der Quiz-Entschärfung:** Punkte-Rebalancing aller 20 Szenarien jetzt (Stufe 6) oder nach erstem Messe-Einsatz mit echtem Spielerfeedback? **Empfehlung: nach Stufe 3–5 mit Sim-Daten, vor der nächsten Messe.**

---

## 14. Verifikation (extern prüfbar)

1. **Automatisch, je Stufe:** `npx tsc --noEmit` · `npm run build` (führt Content-Validator aus) · `node --test scripts/` (Determinismus-Property, Slot-Invarianten) · `node scripts/simulate.mjs --runs 10000 --report` (Sackgassen, Krisen-Quote, Score-/Säulen-Verteilungen, Fallback-Garantie).
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
- `scripts/simulate.mjs` + `scripts/*.test.mjs` — Sim & Tests (node:test, Zero-Dependency-Imports).
- Repo-`CLAUDE.md` — Invarianten-Update (Timeline „8 + max 1", Alloc-Reserve, neue Checks).

**TSV-Schema-Erweiterung (v1, deutsch, leere Zellen erlaubt):**
- `antworten.tsv` + Spalte `setzt_marker` (genau 0–1 Marker)
- `fragen.tsv` + Spalten `braucht_marker`, `bezug`
- `events.tsv` + Spalten `braucht_marker`, `bezug`
- neu `marker.tsv`: `marker  beschreibung`
- bewusst NICHT in v1: `prio`, `verbietet_marker`, Marker-Listen (Dateireihenfolge + „spezifischste Bedingung zuerst" genügt bei dieser Pool-Größe)
