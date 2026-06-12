# Founder's Run — Inhaltspflege

Willkommen! In diesem Ordner verwaltest du alle Spielinhalte der „Founder's Run"-Simulation **direkt als Tabellen-Dateien** (TSV = durch Tabulatoren getrennte Werte). Du brauchst keine Programmier-Kenntnisse.

## Was passiert mit diesen Dateien?

1. **Du bearbeitest die `.tsv`-Dateien** (z. B. neue Fragen, Antworten ändern) — am besten mit dem GitHub Web-Editor, Google Sheets oder einem Texteditor (zu Excel/Numbers siehe Warnung unten).
2. **Das Build-Skript prüft die Dateien** beim nächsten `npm run dev` (oder vor jedem Deploy). Wenn etwas falsch ist, zeigt es eine deutsche Fehlermeldung mit Datei + Zeilennummer — der fehlerhafte Inhalt geht nie live.
3. **Die Dateien werden automatisch ins Spiel übersetzt** → `src/lib/gameContent.generated.ts`. Diese Datei ist autogeneriert und du brauchst sie nie anzufassen.
4. **Das Spiel lädt die Inhalte** aus dieser generierten Datei. Wichtig: TSV-Änderungen werden **nur beim Start** eingelesen — den Dev-Server also nach jeder Änderung neu starten (es gibt keine automatische Aktualisierung im laufenden Betrieb).

---

## Die fünf Inhalts-Dateien

### 1. `fragen.tsv` — Entscheidungs-Szenarien

Jede Zeile ist **eine Frage/ein Szenario**, die der Spieler in einer bestimmten Phase antreffen kann.

| Spalten-Name | Beschreibung | Beispiel |
|---|---|---|
| `frage_id` | Eindeutige Kennung, die du erfindest | `q_hiring_001` |
| `phase` | In welcher Phase (1–5) diese Frage auftauchen kann | `2` |
| `titel` | Kurzer Titel der Situation | `Erstes Mitglied einstellen` |
| `situation` | Der Text der Situation/das Szenario — was ist das Problem? | `Mira wächst schnell. Ein erster Mitarbeiter ist nötig — DevOps oder Marketing?` |

**Beispielzeile:**

| frage_id | phase | titel | situation |
|---|---|---|---|
| q_hiring_001 | 2 | Erstes Mitglied einstellen | Mira wächst schnell. Ein erster Mitarbeiter ist nötig — DevOps oder Marketing? |

**Regeln:**
- Jede `frage_id` **muss eindeutig** sein (kommt nur eine Mal vor).
- Pro Phase **mindestens 2 Fragen** — das Spiel zieht je Durchlauf zufällig eine Frage pro Phase.
- In den Zellen **kein Tabulator** (zerstört das Format) und **keine Umbrüche**.

---

### 2. `antworten.tsv` — Die Antwort-Optionen und ihre Auswirkungen

Für **jede** Frage gibt es **exakt 3 Antwort-Optionen** (a, b, c). Diese Datei ist länger — pro Frage 3 Zeilen.

| Spalten-Name | Beschreibung | Beispiel |
|---|---|---|
| `frage_id` | Welche Frage — muss mit `fragen.tsv` übereinstimmen | `q_hiring_001` |
| `antwort_id` | `a`, `b` oder `c` | `a` |
| `antwort` | Der Text der Antwortoption | `DevOps einstellen — Tech-Foundation stärken` |
| `punkte` | Bonus-Punkte für diese Entscheidung (−10 bis +20 typisch) | `5` |
| `growth` | Effekt auf die Growth-Säule (kann leer sein) | `2` |
| `innovation` | Effekt auf die Innovation-Säule | `-1` |
| `community` | Effekt auf die Community-Säule | `` (leer = kein Effekt) |
| `impact` | Effekt auf die Impact-Säule | `` |
| `geld` | Geld-Effekt in Euro (negativ = Ausgabe) | `-4000` |
| `ergebnis` | Kurzer Erklärtext nach der Wahl — hier **Fachbegriffe erklären** | `Smart wording: Der Fokus auf Tech sichert schnelle Skalierbarkeit, kostet aber PR-Ressourcen.` |

**Beispielzeilen:**

| frage_id | antwort_id | antwort | punkte | growth | innovation | community | impact | geld | ergebnis |
|---|---|---|---|---|---|---|---|---|---|
| q_hiring_001 | a | DevOps einstellen | 5 | 2 | -1 | | | -4000 | Du baust eine solide Tech-Foundation auf, brauchst aber Zeit für externe Kommunikation. |
| q_hiring_001 | b | Marketing-Person | 8 | | | 3 | 1 | -3500 | Du baust Sichtbarkeit auf und gewinnen schneller Kunden — weniger technischer Tiefgang. |
| q_hiring_001 | c | Erst mal selbst machen | -5 | -1 | | | -2 | 500 | Du sparst Geld, überlastest dich aber selbst und verzögerst das Wachstum. |

**Regeln:**
- **Pro Frage exakt 3 Zeilen** mit `antwort_id` = `a`, `b`, `c`.
- **Anzeige-Reihenfolge** = alphabetisch nach `antwort_id` (also immer a → b → c).
- **Leere Zelle** bei Effekten (z. B. leer bei `community`) = kein Effekt auf diese Säule.
- **Zahlen:** nur ganze Zahlen, optional mit Minus. KEIN €-Zeichen, keine Punkte als Tausender-Trennzeichen (1000, nicht 1.000).
- **Spielbalance:** Jede Antwort bewegt mehrere Werte **gegenläufig** (Trade-off) — es gibt keinen „perfekten" Weg. Die Summe aus `punkte` + Effekten sollte zwischen den drei Optionen ungefähr ausgeglichen sein (gute vs. schlechte Entscheidungen kosten).
- **Ergebnis-Text:** Hier erklärst du Fachbegriffe (z. B. „Bootstrap" = ohne externe Geldgeber wachsen; „Pivot" = Geschäftsmodell-Wechsel). Eine Ein-Satz-Erklärung reicht.

---

### 3. `events.tsv` — Glücks-Events und Markt-Ereignisse

Diese Events tauchen **zufällig** im Spiel auf — je Durchlauf genau ein Vereins-Event und ein Markt-Event.

| Spalten-Name | Beschreibung | Beispiel |
|---|---|---|
| `event_id` | Eindeutige Kennung | `ev_climathack` |
| `kategorie` | `verein` oder `markt` | `verein` |
| `titel` | Kurzer Event-Name | `Climate Hack 2026` |
| `text` | Was passiert? | `VCM organisiert einen 24h-Hackathon zum Thema Nachhaltigkeit. Mira könnte ein Team sponsorn.` |
| `growth` | Effekt auf Growth (kann leer sein) | `1` |
| `innovation` | Effekt auf Innovation | `2` |
| `community` | Effekt auf Community | `3` |
| `impact` | Effekt auf Impact | `` |
| `geld` | Geld-Effekt in Euro | `-2000` |

**Beispielzeile:**

| event_id | kategorie | titel | text | growth | innovation | community | impact | geld |
|---|---|---|---|---|---|---|---|---|
| ev_climathack | verein | Climate Hack 2026 | VCM organisiert einen 24h-Hackathon zum Thema Nachhaltigkeit. Mira könnte ein Team sponsorn. | 1 | 2 | 3 | | -2000 |

**Regeln:**
- Mindestens **1 Event pro Kategorie** (`verein`, `markt`).
- Event-Effekte sind bewusst **klein** — Glück würzt das Spiel, dominiert aber nicht.
- Leere Effekt-Zelle = kein Effekt.

---

### 4. `gruendertypen.tsv` — Die fünf Gründer-Profile

Nach dem Spiel bekommt der Spieler einen dieser Typen vorgestellt — basierend auf seiner stärksten Säule (oder „Allrounder", wenn ausgewogen).

| Spalten-Name | Beschreibung | Beispiel |
|---|---|---|
| `typ` | Muss **exakt** eine diese Werte haben | `growth` |
| `name` | Der Anzeige-Name des Profils | `Die Wachstums-Besessene` |
| `tagline` | Ein Satz, wofür dieser Typ steht | `Du willst schnell skalieren — mit allem, was dafür nötig ist.` |
| `beschreibung` | Längerer Beschreibungs-Text (2–4 Sätze) | `Deine Priorität: Marktdurchdringung und exponentiales Wachstum. Du packst alles rein — Investoren, Partner, aggressive Pricing. Dein Risiko: Qualität und Mitarbeitenden-Wohlbefinden leiden.` |
| `emoji` | Ein einzelnes Emoji | `🚀` |

**Beispielzeile:**

| typ | name | tagline | beschreibung | emoji |
|---|---|---|---|---|
| growth | Die Wachstums-Besessene | Du willst schnell skalieren — mit allem, was dafür nötig ist. | Deine Priorität: Marktdurchdringung und exponentiales Wachstum. Du packst alles rein — Investoren, Partner, aggressive Pricing. Dein Risiko: Qualität und Mitarbeitenden-Wohlbefinden leiden. | 🚀 |

**Gültige Werte für `typ`:**
- `growth` — Growth-Säule dominiert
- `innovation` — Innovation-Säule dominiert
- `community` — Community-Säule dominiert
- `impact` — Impact-Säule dominiert
- `balanced` — Alle Säulen ausgeglichen

**Regeln:**
- Exakt **5 Zeilen**, eine pro Typ.
- `typ`-Wert muss genau einer dieser fünf sein (keine Typos!).
- `emoji` — genau ein Emoji, nichts anderes.

---

### 5. `texte.tsv` — Statische Texte und Labels

Intro-Texte, Phase-Namen, Bedingungen — alles was nicht Fragen/Antworten/Events ist.

| Spalten-Name | Beschreibung | Beispiel |
|---|---|---|
| `bereich` | Thema/Kategorie | `intro` |
| `schluessel` | Eindeutiger Schlüssel innerhalb des Bereichs | `oneLiner` |
| `wert` | Der Inhalt | `KI-Assistentin für B2B-Service-Teams` |

**Beispielzeilen:**

| bereich | schluessel | wert |
|---|---|---|
| intro | startup | Mira |
| intro | oneLiner | KI-Assistentin für B2B-Service-Teams |
| intro | pitch | Mit Mira automatisierst du Kundengespräche, sparst Zeit und skalierst deinen Service. |
| intro | bedingung1 | Du hast nur wenig Startkapital. |
| intro | bedingung2 | Die Tech-Konkurrenz ist groß. |
| phase1 | name | Gründung |
| phase1 | intro | Alles fängt mit einer Idee an … |
| phase2 | name | MVP & Validierung |
| phase2 | intro | Jetzt musst du deine Hypothese testen. |
| phase3 | name | Team & Funding |
| phase4 | name | Skalierung |
| phase5 | name | Exit & Zukunft |

**Regeln:**
- `bereich` = `intro` oder `phase1` bis `phase5`.
- Unter `intro`: die Schlüssel `startup`, `oneLiner`, `pitch`, `bedingung1`, `bedingung2`.
- Unter `phase<N>`: die Schlüssel `name` (Phase-Name) und `intro` (Intro-Text pro Phase).
- Der `wert` ist einfacher Text — kein HTML, keine Formatierung nötig.

---

## Goldene Regeln für alle Dateien

1. **Eindeutigkeit:** Jede ID (`frage_id`, `event_id`) darf nur einmal vorkommen — das Build-Skript meldet Duplikate.
2. **Zahlen:** Nur ganze Zahlen, optional mit Minus (z. B. `2`, `-1500`). KEINE Dezimalzahlen, KEINE €-Zeichen, KEINE Punkte als Tausender-Trennzeichen.
3. **Tabulator/Zeilenumbruch:** Verboten in Zellen — sie zerstören das Format. Nutze stattdessen normalen Text (die Zelle wird mehrzeilig angezeigt, wenn nötig).
4. **Anführungszeichen:** Am Anfang/Ende einer Zelle vermeiden — sie verwirren den TSV-Parser. Der Zelleninhalt sollte „rein" sein.
5. **Formatierung:** TSV ist eine **Tabelle mit Tabulatoren als Trenner**, nicht mit Kommas oder Semikola. Der Header (erste Zeile) **muss** genau so aussehen wie dokumentiert.
6. **Spielbalance:**
   - Keine perfekten Durchläufe — jede Wahl muss Trade-offs haben (z. B. viel Growth, wenig Community).
   - Punkte pro Entscheidung ca. −10 bis +20.
   - Events sind bewusst klein (2–3 Säulen-Punkte, −1000 bis +500 Euro).
   - Alle Szenarien = skalierbare B2B-Startup-Cases (nicht: Friseursalon, lokale Shops).
   - Fachbegriffe immer im `ergebnis`-Text mit einer Ein-Satz-Erklärung.

---

## Empfohlene Editoren & Methoden

### GitHub Web-Editor (am einfachsten)
1. Gehe auf github.com, öffne die Datei (z. B. `fragen.tsv`).
2. Klick auf das **Stift-Symbol** (Bearbeiten).
3. Ändere den Inhalt.
4. Scrolle unten, schreib eine Beschreibung (z. B. „neue Frage q_hiring_002"), klick **Commit changes**.
5. Automatisch: Deploy auf Vercel nach wenigen Minuten. Das Spiel ist live mit deinen Änderungen.

### Google Sheets (für größere Änderungen)
1. Öffne https://sheets.google.com.
2. **Datei → Importieren → Hochladen**. Wähle die `.tsv`-Datei.
3. Bearbeite die Tabelle.
4. **Datei → Herunterladen → Durch Tabulatoren getrennte Werte (.tsv)**.
5. Lade die neue Datei via GitHub-Web-Editor hoch.

### Texteditor (VS Code, Sublime, etc.)
1. Öffne die `.tsv`-Datei.
2. Bearbeite eine Zeile (oder mehrere).
3. **WICHTIG:** Stelle sicher, dass die Spalten-Trenner Tabulatoren sind, nicht Leerzeichen oder Kommas. In VS Code: nutze **View → Toggle Whitespace** um zu sehen, wo die Tabulatoren sind.
4. Speichern, GitHub-Web-Editor → Commit.

### WARNUNG: Excel & Numbers
- **Excel „Tab delimited"-Export:** kann Umlaute zerschießen (ä → ae). Nutze stattdessen Google Sheets.
- **Apple Numbers:** hat keinen TSV-Export — nicht empfohlen.

---

## So gehst du vor

### Szenario: Eine Antwort-Text ändern

1. Öffne `antworten.tsv` im GitHub-Web-Editor oder deinem Texteditor.
2. Finde die Zeile mit der `frage_id` und `antwort_id` (z. B. `q_hiring_001` + `a`).
3. Ändere nur die `antwort`-Spalte (den Antwort-Text).
4. Commit & Push (GitHub Web-Editor macht das automatisch).
5. **Dev-Server neu starten** (`npm run dev` stoppen + wieder starten) — TSV-Änderungen werden nur beim Start eingelesen.
6. Spiel im Browser prüfen.

### Szenario: Neue Frage anlegen

1. **Schritt 1:** Öffne `fragen.tsv`. Schreibe eine neue Zeile:
   ```
   q_funding_001	3	Seed-Runde oder Bootstrapping	Investoren klopfen an. Sollen wir Geld nehmen oder lieber unabhängig bleiben?
   ```
   (Nutze Tabulatoren als Spalten-Trenner.)

2. **Schritt 2:** Öffne `antworten.tsv`. Schreibe **exakt 3 neue Zeilen** mit dieser `frage_id`:
   ```
   q_funding_001	a	Seed-Investor nehmen	12	3	2	-1	 	-0	Mit Investor schneller skalieren, aber externe Ziele.
   q_funding_001	b	Ausgleich: kleine Investition + Bootstrapping	5	1	 	1	2	-3000	Langsameres Wachstum, aber mehr Kontrolle.
   q_funding_001	c	Komplett bootstrappen	-8	-2	-1	2	 	8000	Du bewahrst Unabhängigkeit, wächst aber langsam.
   ```

3. **Commit & Deploy** via GitHub.

4. **Dev-Server neu starten** und testen.

### Szenario: Event-Text ändern

1. Öffne `events.tsv`.
2. Finde die Zeile mit der `event_id` (z. B. `ev_climathack`).
3. Ändere die `text`-Spalte (oder andere Spalten wie `titel`).
4. Commit, Dev-Server neu starten, testen.

### Szenario: Eine Phase umbenennen

1. Öffne `texte.tsv`.
2. Finde die Zeile mit `bereich = phase2` und `schluessel = name`.
3. Ändere den `wert` (z. B. von `MVP & Validierung` zu `MVP & Testing`).
4. Commit, Dev-Server neu starten, testen.

---

## Fehlerbehebung

### Fehler beim Build: „Unerwartete Spalte"
**Beispiel:** `Fehler in fragen.tsv, Zeile 3: Unerwartete Spalte 'frage_id2'`

→ Du hast einen Spalten-Namen falsch geschrieben. Vergleiche mit der Spezifikation oben (z. B. `frage_id`, nicht `frage_id2`). Korrigiere die Kopfzeile (erste Zeile).

### Fehler beim Build: „Doppelte ID"
**Beispiel:** `Fehler in fragen.tsv: frage_id 'q_hiring_001' erscheint zweimal`

→ Du hast eine ID doppelt verwendet. Jede `frage_id`, jede `event_id` darf nur einmal vorkommen. Vergib eine neue, eindeutige ID.

### Fehler beim Build: „Ungültige Zahl"
**Beispiel:** `Fehler in antworten.tsv, Zeile 5: 'punkte' hat Wert '5,5' (erwartet ganze Zahl)`

→ Du hast eine Dezimalzahl eingegeben (5,5 oder 5.5). Nutze nur ganze Zahlen (5, nicht 5,5).

### Fehler beim Build: „Frage existiert nicht"
**Beispiel:** `Fehler in antworten.tsv: frage_id 'q_xyz' existiert nicht in fragen.tsv`

→ Du hast in `antworten.tsv` eine `frage_id` verwendet, die es in `fragen.tsv` nicht gibt. Entweder die Frage in `fragen.tsv` hinzufügen oder den Namen in `antworten.tsv` korrigieren.

### Fehler beim Build: „Zu wenige/zu viele Antworten"
**Beispiel:** `Fehler in antworten.tsv: frage_id 'q_hiring_001' hat nur 2 Antworten (erwartet 3)`

→ Pro Frage braucht es **exakt 3 Antworten** (a, b, c). Prüfe, ob eine fehlt oder doppelt ist.

### Spielinhalt ist nach Änderung nicht aktuell
→ Der **Dev-Server lädt TSV-Dateien nur beim Start**. Starte ihn neu:
```bash
npm run dev
```
(Stoppe den laufenden Server mit Ctrl+C, dann `npm run dev` erneut.)

### Umlaute sehen komisch aus (ä → ae)
→ Die Datei wurde mit falscher Zeichenkodierung exportiert (z. B. Excel „Tab delimited"). Nutze stattdessen:
- **Google Sheets** für Edits + TSV-Export.
- Oder einen Text-Editor mit **UTF-8-Kodierung**.

---

## Zusammenfassung

| Aktion | Weg |
|---|---|
| **Text ändern** | GitHub Web-Editor (Stift-Symbol) → Commit |
| **Neue Frage** | `fragen.tsv` + 3 Zeilen `antworten.tsv` → Commit |
| **Testen** | `npm run dev`, Browser, Dev-Server neu starten |
| **Deploy** | GitHub Commit = automatisch Vercel-Deploy (Minuten) |
| **Fehler beheben** | Build-Meldung lesen (nennt Datei + Zeile), korrigieren, Commit |

Viel Erfolg beim Feintunen von Mira! 🚀
