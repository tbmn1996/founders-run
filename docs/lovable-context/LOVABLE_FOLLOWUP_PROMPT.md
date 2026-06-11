# Lovable Folgeprompt - identifizierte Änderungen aus Gespräch

Bitte überarbeite das bestehende `Founder's Run`-Projekt gezielt anhand dieser
Änderungen. Die App bleibt eine eigenständige mobile Web-App ohne Auth,
Datenbank, Backend, Scoreboard oder harte Kopplung an die Founders-Map-App.

## 1. Startup-Szenario ersetzen: weg von `Loop`

Das aktuelle Szenario `Loop` mit Mehrwegbechern/Pfandsystem soll ersetzt werden.
Es wirkt zu klein, zu nah an existierenden Ideen und nicht ambitioniert genug.

Neues Ziel: ein deutlich VC-tauglicheres, größeres Startup-Szenario.

Nutze als neues fiktives Startup:

```txt
Mira - KI-Assistentin für Service- und Vertriebsteams in Unternehmen.
```

Rahmen:

- B2B-SaaS statt lokales Kleinbusiness.
- Seat-basiertes Modell, skalierbar über viele Unternehmen.
- Einstiegsmarkt: deutschsprachige KMUs und Mittelstand.
- Produkt: automatisiert Kundenkommunikation, Angebote, Follow-ups und
  interne Serviceprozesse.
- Startkapital: 20.000 Euro.
- Team: Gründer:in plus eine unentschlossene Mitgründerperson.
- Wettbewerb: große Tech-Konzerne bauen ähnliche KI-Tools.
- Ton: ambitioniert, startup-nah, auch für Besucher:innen mit Vorwissen spannend.

Wichtig: Keine Friseursalons, Cafes, reinen Local-Commerce-Cases oder zu kleinen
Impact-Startups als Hauptszenario.

## 2. `Runway` als echtes Geld darstellen

Falls die App noch mit abstrakten Runway-Wochen oder `cash: 100` arbeitet:
umstellen auf Euro-Beträge.

Startwerte:

```ts
const INITIAL_STATS = {
  growth: 20,
  innovation: 20,
  community: 20,
  impact: 20,
  cash: 20000,
};
```

UI:

- Label: `Geld`, nicht nur `Runway`.
- Werte als Euro formatieren, zum Beispiel `20.000 EUR`.
- Maximalanzeige für Geld: ca. `120.000 EUR`.
- Wenn Geld auf 0 fällt, klar kommunizieren: Das Startup ist faktisch pleite
  bzw. hat keinen Spielraum mehr.

Score-Formel entsprechend anpassen:

```ts
const pillars = growth + innovation + community + impact;
const runwayBonus = cash > 0 ? Math.round(cash / 2000) : -30;
score = Math.round(decisionPoints + pillars / 2 + runwayBonus);
```

## 3. Fragenpool stärker auf Venture-Capital-Cases zuschneiden

Die Fragen dürfen nicht beliebig generisch wirken. Sie sollen sich stärker wie
echte VC-/Startup-Dilemmata anfühlen.

Bitte alle Szenarien und Optionen auf das neue Mira-B2B-SaaS-Szenario anpassen:

- Problemvalidierung im B2B-Markt.
- MVP vs. sauberes Produkt.
- Build vs. Buy bei KI-Modellen.
- Bootstrapping vs. Business Angel vs. Fördermittel.
- Pricing, Freemium, Enterprise-Vertrieb.
- Investorengeld mit schlechten Terms.
- Sales, Partnerships, Go-to-Market.
- Datenqualität, Datenschutz, Vertrauen.
- öffentlicher Produktfehler / Reputationskrise.
- Team-Burnout und organisatorische Skalierung.

Jede Option muss weiterhin echte Trade-offs haben. Es soll keine perfekte
Strategie geben. Gute Einzelentscheidungen dürfen trotzdem in Geldprobleme
führen, wenn der Gesamtmix schlecht ist, aber das Balancing soll fair wirken.

## 4. Mehr Varianz: nicht alle sollen dieselben Fragen bekommen

Wichtig für die Stand-Situation: Besucher:innen kommen oft in Gruppen. Es soll
nicht so wirken, als bekämen alle denselben Durchlauf.

Anforderung:

- Pro Phase mehrere Szenarien im Pool behalten oder ausbauen.
- Pro Lauf genau ein Szenario je Phase zufällig wählen.
- Optionen je Szenario zufällig mischen.
- Keine leicht auswendig lernbare Strategie wie "immer Option B nehmen".
- Falls möglich: mindestens 3 Szenarien pro Phase, besser 4 pro Phase.

## 5. Spiel darf minimal länger werden

Im Gespräch wirkte der Durchlauf eventuell etwas zu kurz. Die Simulation bleibt
eine kurze Messe-Station, darf aber etwas mehr Substanz bekommen.

Bitte nicht unnötig aufblasen. Besser:

- die 5 Phasen beibehalten,
- Szenarien inhaltlich etwas gehaltvoller machen,
- Feedback nach Entscheidungen lehrreicher formulieren,
- Rückblick mit Alternativen klarer machen.

Keine lange Onboarding-Strecke, keine Landingpage.

## 6. Glücks-Events stärker in zwei Kategorien trennen

Die Glücks-Events sollen externe Faktoren zeigen, aber auch den Venture Club
Münster organisch ins Spiel bringen.

Bitte Events in zwei Kategorien behandeln:

1. Vereins-Events / VCM-Events
2. Markt-Events

Pro Durchlauf sollen zwei Glücks-Events erscheinen:

- ein VCM-/Vereins-Event,
- ein Markt-Event.

VCM-Events, die verwendet werden sollen:

- `Beim Venture Club Münster dabei`: Gründer:innen helfen mit Rat und Kontakten.
- `Startup Contacts`: Gespräche auf der Messe werden zu Kundenkontakten.
- `Climate Hack gewonnen`: nachhaltiger 4-tägiger Hackathon mit Preisgeld und
  Netzwerk-Effekt.

Offen lassen bzw. nur als Platzhalter-Kommentar vorbereiten:

- `Merchant Lab`: Inhalt erst aktivieren, wenn der genaue Text/Use Case
  freigegeben ist.

Markt-Events können positive oder negative externe Effekte sein, zum Beispiel:

- KI-Hype gibt Rückenwind.
- KI-Kosten steigen.
- Großer Tech-Konzern zieht nach.

Glücks-Events sollen klein bleiben und Entscheidungen nicht dominieren.

## 7. Design etwas weniger überdreht, aber weiterhin lebendig

Das Design darf leuchten und modern wirken, soll aber nicht zu verspielt oder
zu "flippig" werden. Bitte am Aura-v2-Stil orientieren:

- Dark Mode.
- Hintergrund `#141414`.
- warme Orange/Rot-Akzente.
- keine grellen Dauer-Glow-Flächen, die vom Inhalt ablenken.
- klare mobile Lesbarkeit.
- Smartphone-Hochformat priorisieren.

## 8. Hosting/Deployment in Lovable berücksichtigen

Das Projekt soll in Lovable direkt lauffähig und hostbar sein. Bitte keine
GitHub-Pages-spezifische Annahme einbauen.

Anforderung:

- App muss im Browser funktionieren.
- Keine Node-spezifischen lokalen Annahmen für den Endnutzer.
- Deploy/Preview über Lovable soll ausreichen.

## 9. Akzeptanzkriterien

Nach der Änderung muss gelten:

1. In der UI steht nirgends mehr `Loop`, außer in internem Migrationscode, falls
   unvermeidbar.
2. Das Intro erklärt `Mira` in unter 10 Sekunden verständlich.
3. Geld wird als Euro-Betrag angezeigt und gerechnet.
4. Die Fragen fühlen sich wie skalierbare VC-/B2B-SaaS-Cases an.
5. VCM-Events sind klar als Vereins-/Netzwerk-Momente erkennbar.
6. Pro Lauf sind Fragen und Optionsreihenfolge sichtbar variabel.
7. Die App bleibt standalone: keine Auth, keine Datenbank, keine Persistenz,
   kein Scoreboard.
8. Rückgabe an die Founders Map bleibt nur als deaktivierter Hook vorbereitet.
