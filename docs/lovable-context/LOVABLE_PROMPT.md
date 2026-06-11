# Lovable Erstprompt - Founder's Run

Baue eine vollständige, produktionsnahe mobile Web-App mit dem Namen
`Founder's Run` für den Venture Club Münster. Die App ist eine 3-Minuten-
Startup-Simulation für den Infostand auf der Startup-Contacts-Messe. Besucher
starten sie per QR-Code im Handy-Browser, primär Smartphone im Hochformat.

Die App soll direkt spielbar sein, nicht als Marketing-Landingpage. Sie soll
eigenständig laufen und später lose an eine separate Founders-Map-App angebunden
werden können. Wichtig: keine Authentifizierung, keine Datenbank, kein Backend,
keine Persistenz, kein Scoreboard in dieser App.

## Sprache und Ton

- UI-Sprache: Deutsch.
- Ton: locker, klar, startup-nah, aber nicht albern.
- App-Titel: `Founder's Run`.
- Verein: `Venture Club Münster`.
- Messe: `Startup Contacts`.
- Fiktives Startup im Spiel: `Loop`.

## Technische Zielarchitektur

Nutze React + TypeScript + Tailwind CSS. Wenn deine Lovable-Standardumgebung
Vite nutzt, ist das okay. Wenn Next.js verfügbar ist, ist Next.js ebenfalls okay.
Wichtig ist die saubere Trennung:

- `gameData`: alle Inhalte, Szenarien, Optionen, Glücks-Events, Founder-Typen,
  Startwerte und Phasen.
- `gameLogic`: Zufallsauswahl, Shuffle, Effekte anwenden, Score berechnen,
  Founder-Typ bestimmen.
- `Game` oder `App`: Screen-State-Machine für `intro -> sim -> result`.
- `StatBar`: wiederverwendbare Anzeige für Growth, Innovation, Community,
  Impact und Runway.

Nutze `lucide-react` für Icons, wenn verfügbar. Nutze `framer-motion` für weiche
Transitions, wenn verfügbar. Falls nicht, nutze CSS-Transitions. Bitte keine
Supabase-Integration, keine Tabellen, keine Auth und keine API-Routen anlegen.

## Produktziel

Besucher führen das fiktive Startup `Loop` durch 5 Gründungsphasen. Jede Phase
stellt ein Gründer-Dilemma mit 3 Optionen. Jede Option hat Trade-offs. Es gibt
keinen perfekten Durchlauf. Nach jeder Entscheidung sehen Nutzer sofort:

- Punkte für die Entscheidung
- kurze Konsequenz mit Lernmoment
- Veränderung der Werte

Zwischen den Phasen passieren 2 zufällige Glücks-Events mit kleinen Effekten.
Am Ende gibt es:

- Gesamtscore
- Founder-Typ
- finale Werte
- Rückblick mit allen Entscheidungen und nicht gewählten Alternativen
- Abschlussfolie für den Venture Club Münster mit Hinweis auf Neuaufnahmen im Oktober

## Nicht verhandelbare Spielmechanik

1. Ein Durchlauf besteht aus:
   - Intro
   - Phase 1 Entscheidung
   - Phase 2 Entscheidung
   - Glücks-Event
   - Phase 3 Entscheidung
   - Phase 4 Entscheidung
   - Glücks-Event
   - Phase 5 Entscheidung
   - Ergebnis
   - Rückblick
   - Closing

2. Pro Phase wird zufällig genau ein Szenario aus dem Pool gezogen.
3. Optionen eines Szenarios werden zufällig gemischt.
4. Es gibt 2 zufällige Glücks-Events ohne Wiederholung.
5. Glücks-Events haben kleine Effekte und dürfen die Entscheidungen nicht dominieren.
6. Werte dürfen nie unter 0 fallen.
7. Die Simulation speichert bewusst nichts.

## Stats

Es gibt vier bewertete Säulen plus Cash als Überlebensressource:

- `growth`: Growth, Traction, Umsatz, Marktanteil
- `innovation`: Produkt- und Tech-Stärke
- `community`: Team, Netzwerk, Fans
- `impact`: Mission, Nachhaltigkeit, gesellschaftlicher Wert
- `cash`: Runway/Cash

Startwerte:

```ts
const INITIAL_STATS = {
  growth: 20,
  innovation: 20,
  community: 20,
  impact: 20,
  cash: 100,
};
```

## Score-Formel

```ts
const SCORED_KEYS = ["growth", "innovation", "community", "impact"];

function computeScore(stats, decisionPoints) {
  const pillars = stats.growth + stats.innovation + stats.community + stats.impact;
  const runwayBonus = stats.cash > 0 ? Math.round(stats.cash / 5) : -30;
  return Math.round(decisionPoints + pillars / 2 + runwayBonus);
}
```

## Founder-Typ-Logik

Bestimme den Founder-Typ aus der stärksten der vier Säulen. Wenn die vier Säulen
sehr ausgeglichen sind, also `max - min <= 8`, nutze `balanced`.

Founder-Typen:

```ts
const FOUNDER_TYPES = {
  growth: {
    key: "growth",
    name: "Der/die Hustler:in",
    tagline: "Wachstum ist deine Sprache.",
    emoji: "🚀",
    description:
      "Du denkst in Traction, Umsatz und Tempo. Du bringst Dinge ins Rollen und scheust kein Risiko - achte nur darauf, dass Produkt und Team mitkommen.",
  },
  innovation: {
    key: "innovation",
    name: "Der/die Visionär:in",
    tagline: "Du baust, was es noch nicht gibt.",
    emoji: "💡",
    description:
      "Produkt und Idee stehen für dich im Zentrum. Du willst es richtig machen - denk daran, früh genug rauszugehen und zu verkaufen.",
  },
  community: {
    key: "community",
    name: "Der/die Connector:in",
    tagline: "Menschen folgen dir.",
    emoji: "🤝",
    description:
      "Du baust Teams, Communities und Vertrauen. Dein Netzwerk ist dein Superpower - kombiniere es mit hartem Fokus auf Zahlen.",
  },
  impact: {
    key: "impact",
    name: "Der/die Changemaker:in",
    tagline: "Du gründest mit Mission.",
    emoji: "🌍",
    description:
      "Sinn schlägt für dich kurzfristigen Profit. Du veränderst etwas - denk daran: Nur ein tragfähiges Geschäft kann dauerhaft Impact haben.",
  },
  balanced: {
    key: "balanced",
    name: "Der/die Allrounder:in",
    tagline: "Du hältst alles in Balance.",
    emoji: "⚖️",
    description:
      "Du jonglierst Wachstum, Produkt, Team und Mission erstaunlich ausgewogen - die seltene Gabe echter Gründer:innen. Setz als Nächstes einen klaren Schwerpunkt.",
  },
};
```

## Intro-Szenario

```ts
const SCENARIO_INTRO = {
  startup: "Loop",
  oneLiner: "Das Mehrweg-Pfand-Netzwerk für Münster",
  pitch:
    "Ihr gründet «Loop» - ein Pfandsystem für Mehrwegbecher und -boxen. Cafés, Mensen und Foodtrucks geben Essen & Getränke in euren Behältern aus, Studierende geben sie an smarten Rückgabe-Stationen zurück. Weniger Müll, ein cooles App-Erlebnis, eine echte Community.",
  conditions: [
    "Team: du + 1 unentschlossene:r Mitgründer:in",
    "Kapital: 100 (Runway-Wochen)",
    "Markt: Münster - Fahrrad-Stadt, viele Studierende, nachhaltigkeitsaffin",
    "Wettbewerb: 1 großer nationaler Anbieter, noch nicht vor Ort",
  ],
};
```

## Phasen

```ts
const PHASES = [
  { n: 1, name: "Die Idee", intro: "Aus einer Idee wird ein Plan. Erste Weichen stellen." },
  { n: 2, name: "Das Produkt", intro: "Vom Konzept zum ersten echten Produkt (MVP)." },
  { n: 3, name: "Die Finanzierung", intro: "Geld bewegt - aber zu welchem Preis?" },
  { n: 4, name: "Das Wachstum", intro: "Aus einem Pilot wird ein Unternehmen." },
  { n: 5, name: "Die Bewährungsprobe", intro: "Jedes Startup wird einmal richtig getestet." },
];
```

## Vollständiger Szenario-Pool

Implementiere alle folgenden 15 Szenarien exakt in `gameData`. Jedes Szenario
hat 3 Optionen. Die Zahlen sind bewusst balanciert und sollen nicht geglättet
werden.

### Phase 1 - Die Idee

```ts
[
  {
    id: "p1-cofounder",
    phase: 1,
    title: "Wer baut mit?",
    situation:
      "Deine Idee steht - aber gründet man allein? Eine starke technische Mitgründerin will einsteigen, verlangt aber 40 % der Anteile.",
    options: [
      {
        id: "a",
        label: "Technische Mitgründerin an Bord holen (40 %)",
        effects: { innovation: 14, community: 8, growth: 5 },
        points: 20,
        outcome:
          "Ein:e starke:r Mitgründer:in ist mehr wert als Anteile. Tech-Power von Tag 1 - aber die Torte wird kleiner.",
      },
      {
        id: "b",
        label: "Solo starten, Tech später einkaufen",
        effects: { growth: 8, innovation: -6, cash: -10 },
        points: 5,
        outcome:
          "Du behältst die Kontrolle, zahlst aber Freelancer teuer - und ohne Tech-Co-Founder fehlt langfristig Substanz.",
      },
      {
        id: "c",
        label: "Erstmal allein durchstarten, niemanden reinholen",
        effects: { growth: 4, innovation: -10, community: -6 },
        points: -8,
        outcome:
          "Schnell gestartet, aber Solo-Gründungen scheitern öfter: zu viel auf einer Schulter, kein Sparringspartner.",
      },
    ],
  },
  {
    id: "p1-target",
    phase: 1,
    title: "Wer ist zuerst dran?",
    situation:
      "Du kannst nicht alle gleichzeitig bedienen. Auf welche Zielgruppe fokussierst du zum Start?",
    options: [
      {
        id: "a",
        label: "Cafés (B2B) - wenige Kunden, planbarer Umsatz",
        effects: { growth: 12, cash: 8, community: -4 },
        points: 18,
        outcome:
          "B2B bringt früh Umsatz und Stabilität. Fokus auf wenige zahlende Kunden ist oft der schnellere Weg zur Tragfähigkeit.",
      },
      {
        id: "b",
        label: "Studierende (B2C) - riesiger Markt, aber laut",
        effects: { growth: 8, community: 12, cash: -8 },
        points: 12,
        outcome:
          "Eine begeisterte Community ist Gold wert - aber B2C ohne Umsatz verbrennt schnell Geld. Reichweite ist nicht gleich Erlöse.",
      },
      {
        id: "c",
        label: "Die Uni-Mensa als einen Großkunden gewinnen",
        effects: { growth: 16, impact: 8, cash: -6, innovation: -4 },
        points: 10,
        outcome:
          "Ein Wal-Kunde sieht groß aus - macht dich aber abhängig. Klumpenrisiko: springt er ab, wackelt alles.",
      },
    ],
  },
  {
    id: "p1-brand",
    phase: 1,
    title: "Wie tretet ihr auf?",
    situation:
      "Der erste Eindruck zählt. Wie löst du Name, Logo und Auftritt von «Loop»?",
    options: [
      {
        id: "a",
        label: "Profi-Branding-Agentur beauftragen",
        effects: { growth: 6, innovation: 4, cash: -18 },
        points: 6,
        outcome:
          "Sieht top aus - aber teures Branding vor Product-Market-Fit ist verfrüht. Erst beweisen, dann polieren.",
      },
      {
        id: "b",
        label: "Selbst basteln, Geld fürs Produkt sparen",
        effects: { innovation: 6, cash: 4, community: -2 },
        points: 12,
        outcome:
          "Lean gestartet: In der Frühphase schlägt ein funktionierendes Produkt jedes schicke Logo.",
      },
      {
        id: "c",
        label: "Naming-Contest in der Studi-Community",
        effects: { community: 14, growth: 4, cash: -2 },
        points: 16,
        outcome:
          "Clever: Die Community gestaltet mit, fühlt sich verbunden und verbreitet euch - Marketing und Bindung in einem.",
      },
    ],
  },
]
```

### Phase 2 - Das Produkt

```ts
[
  {
    id: "p2-mvp",
    phase: 2,
    title: "Wie viel Produkt zum Start?",
    situation: "Der Launch naht. Wie gut muss das erste Produkt wirklich sein?",
    options: [
      {
        id: "a",
        label: "Schlankes MVP, schnell live (manuell im Hintergrund)",
        effects: { growth: 12, innovation: 4, community: 4 },
        points: 20,
        outcome:
          "Genau richtig: früh echtes Feedback statt monatelang im Stillen bauen. Done is better than perfect.",
      },
      {
        id: "b",
        label: "Erst das polierte Voll-Produkt fertigstellen",
        effects: { innovation: 12, cash: -16, growth: -6 },
        points: -4,
        outcome:
          "Monate ohne Nutzer = teurer Blindflug. Viele Startups bauen am Markt vorbei, weil sie zu spät launchen.",
      },
      {
        id: "c",
        label: "No-Code-Prototyp, um das Konzept zu testen",
        effects: { innovation: 8, cash: 6, growth: 4 },
        points: 14,
        outcome:
          "Smart & günstig validiert. No-Code testet die Idee, ohne teuer zu entwickeln - ideal vor dem echten Bau.",
      },
    ],
  },
  {
    id: "p2-feedback",
    phase: 2,
    title: "Wie findest du heraus, was Nutzer wollen?",
    situation:
      "Die ersten Stationen stehen. Wie holst du Feedback ein, bevor du weiterbaust?",
    options: [
      {
        id: "a",
        label: "30 Nutzer:innen persönlich interviewen",
        effects: { innovation: 12, community: 10, growth: -4 },
        points: 18,
        outcome:
          "Get out of the building. Echte Gespräche zeigen, was Menschen wirklich brauchen - der wertvollste Input überhaupt.",
      },
      {
        id: "b",
        label: "Einfach launchen und Zahlen beobachten",
        effects: { growth: 10, innovation: -4 },
        points: 8,
        outcome:
          "Daten lügen nicht - sagen aber nicht das Warum. Ohne O-Töne bleibst du beim Optimieren oft im Dunkeln.",
      },
      {
        id: "c",
        label: "Große Online-Umfrage verschicken",
        effects: { community: 4, innovation: -2 },
        points: 2,
        outcome:
          "Was Leute in Umfragen sagen und was sie tun, klafft auseinander. Bequem, aber selten ehrlich.",
      },
    ],
  },
  {
    id: "p2-tech",
    phase: 2,
    title: "Sauber bauen oder schnell hacken?",
    situation: "Die Rückgabe-Stationen brauchen Software. Tempo oder Qualität?",
    options: [
      {
        id: "a",
        label: "Schnell zusammenhacken, Hauptsache es läuft",
        effects: { growth: 10, innovation: -8, cash: 4 },
        points: 4,
        outcome:
          "Tech-Schulden: Heute schnell, morgen langsam. Irgendwann bremst der Code-Wildwuchs jedes neue Feature aus.",
      },
      {
        id: "b",
        label: "Solide Basis bauen, etwas langsamer",
        effects: { innovation: 12, growth: -2, cash: -8 },
        points: 14,
        outcome:
          "Ein tragfähiges Fundament zahlt sich beim Skalieren aus - solange du es nicht übertreibst.",
      },
      {
        id: "c",
        label: "Fertige Standard-Lösung einkaufen",
        effects: { cash: -10, innovation: 4, growth: 6 },
        points: 10,
        outcome:
          "Pragmatisch: Don't reinvent the wheel. Du sparst Zeit, gibst aber ein Stück Kontrolle und Differenzierung ab.",
      },
    ],
  },
]
```

### Phase 3 - Die Finanzierung

```ts
[
  {
    id: "p3-source",
    phase: 3,
    title: "Woher kommt das Geld?",
    situation: "Der Runway wird knapp. Wie finanzierst du das Wachstum?",
    options: [
      {
        id: "a",
        label: "Bootstrappen - aus eigenem Umsatz wachsen",
        effects: { growth: -4, cash: -6, community: 6, impact: 4 },
        points: 12,
        outcome:
          "Volle Kontrolle, keine Verwässerung - aber langsam. Bootstrapping ist diszipliniert, hat aber eine niedrige Drehzahl.",
      },
      {
        id: "b",
        label: "Business Angel holen (Anteile gegen Kapital)",
        effects: { cash: 40, growth: 12, community: -4 },
        points: 16,
        outcome:
          "Kapital plus Netzwerk plus Erfahrung. Du gibst Anteile ab, gewinnst aber Tempo und eine:n erfahrene:n Sparringspartner:in.",
      },
      {
        id: "c",
        label: "Öffentliches Förderprogramm beantragen (EXIST)",
        effects: { cash: 28, impact: 6, innovation: 4, growth: -6 },
        points: 14,
        outcome:
          "Geld ohne Anteilsverlust - aber Bürokratie und Wartezeit kosten dich Tempo. Nicht-verwässerndes Kapital ist trotzdem stark.",
      },
    ],
  },
  {
    id: "p3-pricing",
    phase: 3,
    title: "Was kostet Loop?",
    situation:
      "Die Preisfrage entscheidet über Wachstum und Marge. Wie positionierst du dich?",
    options: [
      {
        id: "a",
        label: "Billig anbieten, schnell Marktanteil holen",
        effects: { growth: 14, cash: -14, impact: 2 },
        points: 6,
        outcome:
          "Wächst schnell, verbrennt aber Marge. Zu billig zu starten macht spätere Preiserhöhungen schmerzhaft.",
      },
      {
        id: "b",
        label: "Premium - Wert über Preis verkaufen",
        effects: { cash: 16, growth: -6, innovation: 4 },
        points: 12,
        outcome:
          "Gesunde Marge finanziert dein Wachstum selbst. Weniger, aber hochwertigere Kunden - verlangt klares Wertversprechen.",
      },
      {
        id: "c",
        label: "Freemium - Basis gratis, Extras kosten",
        effects: { growth: 10, community: 8, cash: -8 },
        points: 14,
        outcome:
          "Große Reichweite, aber teuer: Nur wenige zahlen. Freemium funktioniert nur mit klarem Pfad zur Conversion.",
      },
    ],
  },
  {
    id: "p3-investor",
    phase: 3,
    title: "Der große Scheck",
    situation:
      "Ein Investor bietet viel Geld - will aber die Mehrheit und einen sofortigen Pivot weg von der Nachhaltigkeit.",
    options: [
      {
        id: "a",
        label: "Annehmen - Geld schlägt alles",
        effects: { cash: 50, growth: 16, impact: -20, community: -10 },
        points: -6,
        outcome:
          "Viel Cash, aber du verlierst Kontrolle UND deine Mission. Das falsche Geld kann ein Startup seine Seele kosten.",
      },
      {
        id: "b",
        label: "Hart verhandeln: weniger Geld, Mission bleibt",
        effects: { cash: 24, growth: 8, impact: 4 },
        points: 18,
        outcome:
          "Stark: Du nimmst Kapital, schützt aber Vision und Mehrheit. Die richtigen Terms sind wichtiger als die größte Summe.",
      },
      {
        id: "c",
        label: "Ablehnen und lieber kleiner bleiben",
        effects: { growth: -8, impact: 10, community: 6, cash: -4 },
        points: 8,
        outcome:
          "Treu zur Mission, aber langsamer. Manchmal richtig - manchmal verpasst man so das entscheidende Zeitfenster.",
      },
    ],
  },
]
```

### Phase 4 - Das Wachstum

```ts
[
  {
    id: "p4-hire",
    phase: 4,
    title: "Der erste richtige Hire",
    situation:
      "Du kannst dir genau eine Vollzeit-Stelle leisten. Wer hilft jetzt am meisten?",
    options: [
      {
        id: "a",
        label: "Sales - mehr Cafés schneller gewinnen",
        effects: { growth: 14, cash: -12, innovation: -2 },
        points: 14,
        outcome:
          "Vertrieb bringt Umsatz, der alles andere finanziert. Verkaufen wird in der Frühphase oft unterschätzt.",
      },
      {
        id: "b",
        label: "Entwickler:in - Produkt schneller verbessern",
        effects: { innovation: 14, cash: -12, growth: 2 },
        points: 12,
        outcome:
          "Mehr Tempo am Produkt - aber ohne Vertrieb bleiben die besten Features ungenutzt. Balance ist alles.",
      },
      {
        id: "c",
        label: "Community Manager:in - Bindung & Reichweite",
        effects: { community: 16, growth: 4, cash: -10 },
        points: 12,
        outcome:
          "Eine starke Community senkt Marketingkosten und hält Nutzer. Wirkt indirekt, aber nachhaltig.",
      },
    ],
  },
  {
    id: "p4-expand",
    phase: 4,
    title: "Wie schnell wachsen?",
    situation:
      "Münster läuft. Sollst du jetzt expandieren - oder erst den Heimmarkt dominieren?",
    options: [
      {
        id: "a",
        label: "Sofort in die zweite Stadt expandieren",
        effects: { growth: 16, cash: -20, community: -6, impact: 2 },
        points: 6,
        outcome:
          "Zu früh skaliert = Geld verbrannt, bevor das Modell wirklich sitzt. Premature Scaling killt viele Startups.",
      },
      {
        id: "b",
        label: "Münster erst zur klaren Nummer 1 machen",
        effects: { growth: 8, community: 10, impact: 6, cash: -4 },
        points: 18,
        outcome:
          "Erst einen Markt dominieren, dann kopieren: ein bewiesenes, profitables Modell skaliert viel sicherer.",
      },
      {
        id: "c",
        label: "Franchise-Modell für andere Städte anbieten",
        effects: { growth: 12, cash: 10, innovation: -4, impact: -4 },
        points: 10,
        outcome:
          "Schnell und kapitalschonend - aber du gibst Qualitätskontrolle ab. Die Marke ist nur so gut wie der schwächste Partner.",
      },
    ],
  },
  {
    id: "p4-marketing",
    phase: 4,
    title: "Wie machst du Loop bekannt?",
    situation:
      "Das Budget ist begrenzt. Wie holst du die meiste Aufmerksamkeit raus?",
    options: [
      {
        id: "a",
        label: "Bezahlte Social-Ads schalten",
        effects: { growth: 12, cash: -16 },
        points: 6,
        outcome:
          "Ads wirken sofort - aber sobald du zahlst, hört es auf zu wachsen. Gemietete Reichweite gehört dir nie.",
      },
      {
        id: "b",
        label: "Campus-Botschafter:innen aufbauen",
        effects: { community: 16, growth: 8, cash: -4 },
        points: 18,
        outcome:
          "Mundpropaganda durch echte Fans ist günstig, glaubwürdig und selbstverstärkend - perfekt für eine Studi-Zielgruppe.",
      },
      {
        id: "c",
        label: "Aufsehenerregender PR-Stunt in der Innenstadt",
        effects: { growth: 10, community: 4, impact: -2, cash: -8 },
        points: 8,
        outcome:
          "Kann viral gehen - oder verpuffen. PR-Stunts sind ein Glücksspiel: hohe Varianz, schwer wiederholbar.",
      },
    ],
  },
]
```

### Phase 5 - Die Bewährungsprobe

```ts
[
  {
    id: "p5-keycustomer",
    phase: 5,
    title: "Der Großkunde stellt ein Ultimatum",
    situation:
      "Eure größte Mensa-Kette will Exklusivität - ihr dürftet keine anderen Kunden in der Stadt mehr bedienen.",
    options: [
      {
        id: "a",
        label: "Zustimmen - der Umsatz ist zu wichtig",
        effects: { cash: 20, growth: -10, community: -8, impact: -4 },
        points: -4,
        outcome:
          "Kurzfristig sicher, langfristig gefährlich: Ein einziger Kunde mit dieser Macht kann dich jederzeit erpressen.",
      },
      {
        id: "b",
        label: "Kompromiss: Exklusivität nur befristet & bezahlt",
        effects: { cash: 14, growth: 4, community: 2 },
        points: 18,
        outcome:
          "Verhandelt statt verschenkt: Du sicherst Umsatz, behältst aber deine Optionen und reduzierst die Abhängigkeit.",
      },
      {
        id: "c",
        label: "Ablehnen - Unabhängigkeit zählt mehr",
        effects: { growth: 8, community: 8, impact: 4, cash: -16 },
        points: 12,
        outcome:
          "Mutig: Du schützt dein Geschäftsmodell vor Klumpenrisiko - musst die Lücke aber kurzfristig selbst stopfen.",
      },
    ],
  },
  {
    id: "p5-crisis",
    phase: 5,
    title: "Shitstorm zum Launch",
    situation:
      "Am großen Launch-Tag fallen reihenweise Rückgabe-Stationen aus. Frust-Posts häufen sich, ein Reel geht negativ viral.",
    options: [
      {
        id: "a",
        label: "Sofort öffentlich entschuldigen & sichtbar nachbessern",
        effects: { community: 14, innovation: 6, cash: -12, impact: 4 },
        points: 20,
        outcome:
          "Vorbildlich: Ehrliche, schnelle Kommunikation in der Krise schafft oft mehr Vertrauen als gar kein Fehler.",
      },
      {
        id: "b",
        label: "Kleinreden und auf technische Details verweisen",
        effects: { community: -14, growth: -8, impact: -4 },
        points: -10,
        outcome:
          "Verschlimmert alles. Defensive Ausreden in einer Krise zerstören Vertrauen schneller als der Fehler selbst.",
      },
      {
        id: "c",
        label: "Influencer beauftragen, das Thema zu überdecken",
        effects: { growth: 4, community: -6, cash: -10 },
        points: -2,
        outcome:
          "Ablenkung statt Lösung. Wer das eigentliche Problem überdeckt, riskiert beim nächsten Mal den doppelten Knall.",
      },
    ],
  },
  {
    id: "p5-burnout",
    phase: 5,
    title: "Das Team ist am Limit",
    situation:
      "Nach Monaten im Vollgas-Modus ist das Team ausgelaugt. Erste denken ans Aufhören.",
    options: [
      {
        id: "a",
        label: "Bewusst Tempo rausnehmen + Team-Offsite",
        effects: { community: 14, impact: 4, growth: -4, cash: -8 },
        points: 18,
        outcome:
          "Klug: Ein Startup ist ein Marathon, kein Sprint. Ein gesundes Team ist dein wichtigstes, knappstes Asset.",
      },
      {
        id: "b",
        label: "Weiter pushen - jetzt bloß nicht bremsen",
        effects: { growth: 8, community: -16, innovation: -4 },
        points: -8,
        outcome:
          "Kurzfristig mehr Output, dann Kündigungen. Ausgebrannte Teams sind teurer als jede verpasste Deadline.",
      },
      {
        id: "c",
        label: "Externe Hilfe & Prozesse einkaufen",
        effects: { community: 6, cash: -14, innovation: 2 },
        points: 8,
        outcome:
          "Entlastet - kostet aber Geld und löst nicht die Kultur. Werkzeuge helfen, ersetzen aber keine echte Erholung.",
      },
    ],
  },
]
```

## Glücks-Events

Wähle pro Durchlauf 2 zufällige Events ohne Wiederholung.

```ts
const LUCK_EVENTS = [
  {
    id: "press",
    title: "Lokalpresse berichtet",
    text: "Die Westfälischen Nachrichten bringen eine Story über euch. Plötzlich kennen euch alle.",
    effects: { growth: 8, community: 6 },
  },
  {
    id: "competitor",
    title: "Konkurrent bekommt 2 Mio €",
    text: "Der nationale Anbieter sammelt frisches Kapital und drängt nach Münster.",
    effects: { growth: -8, cash: -4 },
  },
  {
    id: "viral",
    title: "Reel geht viral",
    text: "Ein Studi-Reel über eure Becher knackt 500k Views. Free Marketing!",
    effects: { growth: 6, community: 8 },
  },
  {
    id: "supply",
    title: "Lieferengpass bei Bechern",
    text: "Euer Hersteller kann nicht liefern. Ihr müsst teuer nachkaufen.",
    effects: { cash: -10, growth: -4 },
  },
  {
    id: "award",
    title: "Nachhaltigkeitspreis der Stadt",
    text: "Münster zeichnet euch aus. Imagegewinn und Türöffner.",
    effects: { impact: 10, community: 6 },
  },
  {
    id: "outage",
    title: "Server-Ausfall",
    text: "Die App ist einen Tag offline. Nutzer sind genervt.",
    effects: { innovation: -6, growth: -4 },
  },
];
```

## UI-Flow im Detail

### 1. Intro

Der erste Screen muss direkt Spiel und Szenario zeigen:

- Label: `Venture Club Münster · Founder's Run`
- Headline: `Gründe dein Startup. Jede Entscheidung zählt.`
- Kurztext: `5 Runden, echte Gründer-Dilemmata, keine perfekte Lösung. In ~3 Minuten erlebst du, wie sich deine Entscheidungen auswirken - und welcher Founder-Typ du bist.`
- Szenario-Karte mit Loop-Pitch und Bedingungen
- CTA: `Simulation starten`

### 2. Simulation

Oben eine Fortschrittsleiste für den gesamten Ablauf mit 7 Steps. Darunter eine
kompakte Stat-Bar mit Growth, Innovation, Community, Impact und Runway.

Bei Entscheidungssteps:

- Phase und Name anzeigen, zum Beispiel `Phase 2/5 · Das Produkt`
- Szenario-Titel
- Situationstext
- 3 große Touch-Optionen
- Nach Auswahl Optionen deaktivieren, gewählte Option hervorheben
- Feedback-Karte anzeigen mit:
  - `Konsequenz`
  - Punkte-Chip, grün bei >= 0, rot bei < 0
  - Outcome-Text
  - Effekt-Chips, zum Beispiel `+12 Growth`, `-8 Runway`
  - Button `Weiter`

Bei Glücks-Events:

- Karte mit Icon, Label `Marktereignis · Glück`
- Event-Titel und Text
- Effekt-Chips
- Button `Weiter`

### 3. Ergebnis

Zeige:

- Founder-Typ mit Emoji
- Name, Tagline, Beschreibung
- Score prominent
- finale Stat-Bar
- Rückblick-Liste mit 5 Einträgen
- Button `Weiter`
- Button `Nochmal spielen`

### 4. Rückblick

Jeder Eintrag ist aufklappbar:

- Phase und Szenario-Titel
- gewählte Option
- im geöffneten Zustand:
  - `Deine Wahl`
  - Punkte und Outcome
  - Abschnitt `Was die Alternativen gebracht hätten`
  - beide nicht gewählten Optionen mit Punktewert und Outcome

### 5. Closing

Abschlussfolie für den Venture Club Münster:

- Label: `Venture Club Münster`
- Headline: `Vom Spieler zum echten Gründer.`
- Text: `Hat dir die Reise gefallen? Beim Venture Club Münster baust du genau das - mit echten Startups, einem starken Netzwerk und Leuten, die gründen wollen wie du.`
- Benefits:
  - `Echte Startup-Projekte & Workshops`
  - `Netzwerk aus Foundern, VCs & Talenten`
  - `Events wie die Startup Contacts`
- Highlight:
  - `Neuaufnahmen im Oktober`
  - `Komm am Infostand vorbei & sichere dir die Infos.`
- Button: `Nochmal spielen`

## Designsystem: Aura v2

Die App soll wie ein modernes dunkles PWA-Interface wirken: clean, großzügig,
weiche Tiefe, warme Orange/Rot-Akzente.

### Farben

Nutze diese Design-Tokens oder sehr nahe Äquivalente:

```css
:root {
  --ci-orange: #f76c07;
  --ci-red: #fe281f;
  --accent: #ff5e00;
  --accent-mid: #ff7a1a;
  --accent-end: #ff9233;
  --glow: #ff6a10;
  --background: #141414;
  --background-raised: #1c1c1c;
  --foreground: #edebe8;
  --foreground-pure: #f5f5f5;
  --surface-1: #1c1c1c;
  --surface-2: #242424;
  --surface-3: #2c2c2c;
  --muted: #888888;
  --border: rgba(255, 255, 255, 0.07);
  --success: #4ade80;
  --error: #f87171;
  --radius-card: 24px;
  --radius-inner: 16px;
  --radius-pill: 20px;
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### Visueller Stil

- Dark Mode als Standard.
- Background `#141414` mit sehr subtilem warmem Orange-Radial-Glow.
- Karten: `#1C1C1C`, 1px Border `rgba(255,255,255,0.07)`, Radius 24 px,
  weicher Shadow.
- Innere Karten/Optionen: `#242424`, Radius 16 px.
- Buttons: Gradient-Border von `#f76c07` zu `#fe281f`, dunkle Füllung.
- Schrift: Plus Jakarta Sans oder ähnlich; Fallback system sans.
- Touch-Ziele mindestens 44 px.
- Mobile-first, Content max width ca. 430 bis 480 px, zentriert.
- Keine verschachtelten Kartenorgien, keine Landingpage-Hero-Sektion.
- Keine großen Stockbilder, keine generischen Illustrationen. Das Spiel selbst
  ist die erste Ansicht.

### StatBar

Zeige die Werte als kompakte Balken:

- Growth: Icon `TrendingUp`, Farbe `#ff7a1a`
- Innovation: Icon `Lightbulb`, Farbe `#ffc857`
- Community: Icon `Users`, Farbe `#5ec8ff`
- Impact: Icon `Globe`, Farbe `#4ade80`
- Runway: Icon `Wallet`, Farbe `#f87171`

Normalisierung:

- Growth, Innovation, Community, Impact: Max 80
- Cash/Runway: Max 140

## Integration-Hooks für Founders Map

Die Simulation bleibt standalone. Trotzdem bitte im Ergebnis-Screen einen klar
markierten, deaktivierten Hook vorbereiten:

```ts
// Future Founders-Map integration, disabled until the app team defines the contract.
// Possible input: /?uid=<userId>&sig=<token>
// Possible redirect output: <returnUrl>?score=<score>&founderType=<type.key>
// Possible postMessage output:
// window.parent.postMessage({ type: "vcm-sim-result", score, founderType: type.key }, "*")
```

Dieser Hook darf nicht automatisch feuern. Kein Ergebnis an fremde Fenster
senden, kein Redirect, solange kein konkretes Rückgabeformat konfiguriert ist.

## Qualitätsanforderungen

Bitte liefere eine wirklich spielbare App, keine statische Demo:

1. Zufallsauswahl funktioniert bei jedem Neustart.
2. `Nochmal spielen` erzeugt einen frischen Run.
3. Fortschritt, Werte und Score aktualisieren korrekt.
4. Rückblick enthält echte Entscheidungen und echte Alternativen.
5. App funktioniert auf iPhone-ähnlichen Breiten ab 360 px.
6. Keine horizontalen Scrollbars.
7. Keine toten Links und keine Placeholder-Texte.
8. Keine Datenbank/Auth/Supabase einrichten.
9. TypeScript sauber halten.
10. Finaler Screen soll zum Messekontext passen und den Venture Club Münster
    klar positionieren.

## Optional, nur wenn schnell sauber machbar

- Logos anzeigen, wenn Assets hochgeladen wurden. Fallback muss ohne Logos gut
  aussehen.
- Kleine Share-Text-Fläche im Ergebnis: `Ich bin {founderType.name} mit {score} Punkten`.
  Nicht zwingend, keine Web Share API nötig.
- `prefers-reduced-motion` respektieren.

Bitte baue das Projekt jetzt vollständig end-to-end.
