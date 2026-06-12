# Founder's Run — Feature-Roadmap

Übersicht über alle umgesetzten und geplanten Features. Wird laufend gepflegt.

**Legende:** ✅ Umgesetzt · 📋 In der Pipeline

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

---

## 📋 In der Pipeline

### Spielbetrieb & Inhalte

| Feature | Beschreibung |
|---|---|
| Punkte-Tuning | Score-Formel und Punkterange am Stand ausprobieren, ggf. nachjustieren |
| Eva-Review B2B-Texte | Alle Outcome-Texte auf korrekte Zielgruppe prüfen (Service-/Vertriebsteams, nicht Kleinbetriebe) |
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
