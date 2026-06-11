# Konzept: Startup-Simulation „Founder's Run"

**Für:** Infostand Venture Club Münster · Startup Contacts
**Einbindung:** Founders Map → Stationstyp **Playground / Gamification**
**Stand:** 2026-06-11 — umgesetzt in `startup-simulation/` (Next.js), Deploy via Vercel

---

## 1. Idee in einem Satz

Eine **3-Minuten-Startup-Simulation**, in der Besucher:innen am Stand (per QR-Code
gestartet) ein fiktives Startup durch 5 Gründungs-Phasen führen. **Jede
Entscheidung hat Trade-offs** — es gibt keinen perfekten Durchlauf. Am Ende:
**„Welcher Founder-Typ bist du?"** + Punktzahl + ein Rückblick, der zeigt, was die
Alternativen gebracht hätten.

> **Ziel:** Spaß + „Aha, so funktioniert Gründen!" — und am Ende Lust auf den
> Venture Club.

---

## 2. Was die Planung verlangt → wie es gelöst ist

| Anforderung aus der Planung | Umsetzung im Konzept |
|---|---|
| Start per QR / aus der App, **separat** gespielt | Standalone-Web-App, eigene URL hinter dem QR-Code |
| Kein perfekter Durchlauf, **Trade-offs** | Jede Option bewegt mehrere Werte gegenläufig (z. B. +Growth, −Cash) |
| Szenario zu Beginn vorstellen | Intro-Screen: Startup „Loop", Produkt, Bedingungen |
| Startwerte in Kategorien | **Growth · Innovation · Community · Impact** (+ Runway/Cash als Überlebens-Ressource) |
| Mehrere Runden, realistische Herausforderungen | 5 Phasen entlang der echten Gründungsreise |
| Schlechte Entscheidungen = Minuspunkte | Punkte pro Option, dürfen negativ sein |
| Punkte nach jeder Entscheidung | Sofort-Feedback mit Punkten + Werte-Änderungen |
| Zufällige Fragenauswahl, „bleibt frisch" | Pro Phase wird 1 Szenario aus einem Pool gezogen; Optionen gemischt |
| Glück als Element, nicht spielbestimmend | 2 zufällige Marktereignisse pro Lauf, kleine Effekte |
| Founder-Typ am Ende | Aus stärkster Säule abgeleitet (5 Typen) |
| Punkte einsehbar | Score-Screen + Werte-Balken |
| Rückblick inkl. **Alternativen** | Aufklappbare Entscheidungs-Historie: Wahl + was die anderen Optionen gebracht hätten |
| Abschlussfolie für den Verein | Closing-Screen: Vorteile + „Neuaufnahmen im Oktober" |
| Dauer 3–5 Min | 5 Entscheidungen + 2 Events ≈ 3 Min |
| Spaß & Wissen als Hauptzweck | Lockerer Ton, jede Konsequenz erklärt ein echtes Gründungs-Prinzip |

---

## 3. Das Szenario: „Mira"

**Mira — KI-Assistentin für Service- und Vertriebsteams in Unternehmen.** Ein seat-basiertes B2B-SaaS: Service- und Vertriebsteams nutzen Mira, um
Kundeninteraktionen schneller zu bearbeiten, Response-Zeiten zu verkürzen und bessere Kundenbindung zu erreichen. Einstiegsmarkt: deutschsprachige KMUs + Mittelstand.

Warum dieses Szenario? Es ist **skalierbar und VC-fit** (klares B2B-SaaS-Modell),
**verständlich in 10 Sekunden** (viele kennen KI-Assistenten) und spannt alle vier Werte natürlich auf
(Umsatz/Kundengrowth, Produkt/Tech, Team/Partnerships, Verantwortung/Datenschutz).

**Startbedingungen:** Du + 1 unentschlossene:r Mitgründer:in · Startkapital €20.000 ·
ein großer etablierter Wettbewerber, noch nicht auf diesem Fokus.

---

## 4. Werte (Stats)

Vier **bewertete Säulen** + eine **Überlebens-Ressource**:

| Wert | Bedeutung |
|---|---|
| **Growth** 🚀 | Kundenwachstum, Umsatz, Marktanteil |
| **Innovation** 💡 | Produkt- & Tech-Stärke (KI-Modelle, Features) |
| **Community** 🤝 | Team, Partnerships, Kundenbeziehungen |
| **Impact** 🌍 | Verantwortung, Datenschutz, Vertrauen |
| **Geld (Cash)** 💰 | Verfügbares Kapital in Euro — geht es auf 0, drückt das den Score hart |

Start: jede Säule **20**, Geld **€20.000**. Anzeige-Maximum: **€120.000**.

---

## 5. Ablauf eines Durchlaufs (8 fixe Schritte)

```
Intro (Szenario Mira)
   ↓
Phase 1 · Die Idee          → Entscheidung + Sofort-Feedback
   ↓
🎲 Vereins-Event (genau 1 pro Lauf)
   ↓
Phase 2 · Das Produkt       → Entscheidung + Sofort-Feedback
Phase 3 · Die Finanzierung  → Entscheidung + Sofort-Feedback
   ↓
💰 Verteil-Runde            → Geld nach Finanzierung auf 4 Bereiche verteilen:
                              • Bessere KI & Produkt → Innovation
                              • Werbung & Reichweite → Growth
                              • Team & Community → Community
                              • Verantwortung & Datenschutz → Impact
                              (weiter erst wenn alles verteilt; +12 Punkte;
                               „Kasse fast leer"-Screen wenn < €3.000)
   ↓
Phase 4 · Das Wachstum      → Entscheidung + Sofort-Feedback
   ↓
🎲 Markt-Event (genau 1 pro Lauf)
   ↓
Phase 5 · Die Bewährungsprobe → Entscheidung + Sofort-Feedback
   ↓
Ergebnis: Founder-Typ + Punkte + finale Werte
   ↓
Rückblick: alle Entscheidungen + Alternativen
   ↓
Abschlussfolie: Venture Club / Neuaufnahmen Oktober
```

Die **5 Entscheidungs-Phasen folgen der echten Gründungsreise** (passt zum Founders-Map-Begriff
„Gründungsreise"). Pro Phase gibt es im Pool **mehrere Szenarien** — gespielt wird
je eines zufällig. Dadurch ist kaum ein Durchlauf gleich. **Events** sind in zwei Kategorien aufgeteilt: **Vereins-Events** (an VCM-Formate angelehnt) + **Markt-Events** (externe Chancen/Risiken).

---

## 6. Beispiel-Entscheidung (so sieht jede Frage aus)

> **Phase 3 · Die Finanzierung — „Der große Scheck"**
> Ein Investor bietet viel Geld — will aber die Mehrheit und einen sofortigen
> Pivot weg von der Nachhaltigkeit.

| Option | Werte-Effekt (Trade-off) | Punkte | Lern-Konsequenz |
|---|---|---|---|
| **Annehmen** — Geld schlägt alles | +Cash, +Growth, **−Impact, −Community** | **−6** | Viel Cash, aber du verlierst Kontrolle *und* Mission. Das falsche Geld kann ein Startup seine Seele kosten. |
| **Hart verhandeln** — weniger Geld, Mission bleibt | +Cash, +Growth, +Impact | **+18** | Die richtigen Terms sind wichtiger als die größte Summe. |
| **Ablehnen** — kleiner bleiben | −Growth, +Impact, +Community, −Cash | **+8** | Treu zur Mission, aber langsamer — manchmal verpasst man so das Zeitfenster. |

→ Keine Option ist „richtig" ohne Preis. Genau das ist die Lektion.

**Der Fragenpool umfasst aktuell 15 Szenarien** (3 pro Phase), jeweils mit 3
Optionen und einer erklärenden Konsequenz. Leicht erweiterbar.

---

## 7. Punkte & Glück

- **Punkte pro Entscheidung:** ca. −10 bis +20. Schlechte Entscheidungen kosten.
- **Events:** 
  - **Vereins-Events** (1 pro Lauf): Climate Hack (nachhaltiger 4-tägiger Hackathon mit Preisgeld), Startup Contacts (Kundenkontakte), VCM-Beitritt (Gründer-Netzwerk).
  - **Markt-Events** (1 pro Lauf): z. B. „Reel geht viral" +Growth, „Konkurrent bekommt 2 Mio €" −Growth. Effekte bewusst **klein** — würzen, aber bestimmen nicht.
- **Gesamtscore** = `Punkte + round(Säulensumme / 2) + round(Geld / 2000)`. Bei `Geld ≤ 0`: stattdessen `−30` (Pleite-Strafe). → Gute Entscheidungen dominieren das
Ergebnis, Glück verschiebt es nur leicht (gut fürs Scoreboard: fair vergleichbar).
- **Fachbegriffe** wie „Bootstrappen", „Business Angel", „Pivot", „Runway", „Seed" immer mit einer Ein-Satz-Erklärung inline im Outcome-Text.

---

## 8. Founder-Typen (Ende)

Aus der **stärksten Säule** abgeleitet:

| Stärkste Säule | Typ |
|---|---|
| Growth | 🚀 **Der/die Hustler:in** — Wachstum ist deine Sprache |
| Innovation | 💡 **Der/die Visionär:in** — du baust, was es noch nicht gibt |
| Community | 🤝 **Der/die Connector:in** — Menschen folgen dir |
| Impact | 🌍 **Der/die Changemaker:in** — du gründest mit Mission |
| alles ausgeglichen | ⚖️ **Der/die Allrounder:in** — du hältst alles in Balance |

Jeder Typ kommt mit Kurzbeschreibung + Augenzwinkern → teilbar/Social-tauglich.

---

## 9. Rückblick mit Alternativen

Auf dem Ergebnis-Screen kann jede der 5 Entscheidungen aufgeklappt werden:

- **Deine Wahl** + Konsequenz + Punkte
- **Was die Alternativen gebracht hätten** (alle nicht gewählten Optionen mit ihren
  Punkten und Effekten)

→ Erfüllt die Planung („alle Entscheidungen rückwirkend + alternative Outputs")
und maximiert den Lerneffekt: „Ah, hätte ich X gewählt, wäre …".

---

## 10. Abschlussfolie

Bewirbt den Verein: echte Startup-Projekte, Netzwerk aus Foundern/VCs/Talenten,
Events wie die Startup Contacts — mit klarem CTA **„Neuaufnahmen im Oktober"** und
Verweis auf den Infostand.

---

## 11. Founders-Map-Integration (Kurz)

- Start per QR → eigene URL (`?uid=…`), **nicht** in der App gerendert (keine Last).
- Ergebnis (`score`, `founderType`) am Ende per **Redirect** oder **postMessage**
  zurück an die App → fließt ins Founders-Map-Punktekonto (Station „Playground").
- Scoreboard lebt in der App; die Sim speichert selbst nichts.

Details + Code-Hooks: siehe `startup-simulation/README.md`.

---

## 12. Was als Nächstes zu entscheiden ist

1. **Merchant-Lab-Event:** Inhalt fehlt (öffentlich nicht dokumentiert) — wartet auf Beschreibung von Thomas/Eva. Platzhalter in `gameData.ts` auskommentiert; erst nach Freigabe mit echtem Inhalt aktivieren.
2. **Punkte-Tuning am Stand testen:** Spannen & Score-Formel fühlen sich richtig an?
3. **Founders-Map-Integrationsformat:** Redirect vs. postMessage — wartet auf App-Team. Hooks in `Result`-Komponente inaktiv.
4. **Eva-Review:** B2B-Texte prüfen (Pivot von Kleinbetrieben auf Service-/Vertriebsteams) + Abschlussfolie.
