// ============================================================================
// VCM Startup-Simulation — Spieldaten
// ----------------------------------------------------------------------------
// Alle Inhalte des Spiels (Szenario, Runden/Phasen, Entscheidungen, Glücks-
// Events, Founder-Typen) leben hier. Reines Daten-Modul ohne UI — so kann der
// Venture Club die Fragen pflegen, ohne Logik oder Layout anzufassen.
//
// Design-Prinzipien (aus der Planung):
//  - KEIN perfekter Durchlauf: jede Option hat Trade-offs.
//  - Schlechte Entscheidungen dürfen NEGATIVE Punkte geben.
//  - Pro Phase wird EINE Frage zufällig aus einem Pool gezogen → bleibt frisch.
//  - Glück ist Bestandteil, aber klein gegenüber Entscheidungen.
//
// B2B-Pivot (Stand: 06/2026):
//  - Mira ist KI-Assistentin für Service- und Vertriebsteams in Unternehmen.
//  - Skalierbares B2B-SaaS, seat-basiert — kein Friseursalon, kein Café.
//  - Münster bleibt Heimatmarkt (VCM-Lokalkolorit).
// ============================================================================

export type StatKey = "growth" | "innovation" | "community" | "impact";

/** Kategorie eines Glücks-Events. */
export type EventCategory = "verein" | "markt";

/** Die vier bewerteten Säulen + Cash als Überlebens-Ressource. */
export interface Stats {
  growth: number;
  innovation: number;
  community: number;
  impact: number;
  cash: number;
}

export interface Option {
  id: string;
  label: string;
  /** Veränderungen der Werte (Trade-offs). Nicht genannte Werte = 0. */
  effects: Partial<Stats>;
  /** Punkte für diese Entscheidung (darf negativ sein). */
  points: number;
  /** Kurze Lern-/Konsequenz-Erklärung — der "Aha"-Moment. */
  outcome: string;
}

export interface Scenario {
  id: string;
  /** 1-basierte Phasen-Nummer (Bezug zu PHASES). */
  phase: number;
  title: string;
  situation: string;
  options: Option[];
}

export interface LuckEvent {
  id: string;
  title: string;
  text: string;
  effects: Partial<Stats>;
  /** Herkunft des Events: Vereins-Event oder Markt-Event. */
  category: EventCategory;
}

export interface FounderType {
  key: StatKey | "balanced";
  name: string;
  tagline: string;
  description: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Stat-Metadaten: Label, Emoji, Maximalwert je Säule/Cash.
// Quelle: STAT-Objekt im HTML-Prototyp.
// ---------------------------------------------------------------------------
export const STAT_META: Record<
  StatKey | "cash",
  { label: string; emoji: string; max: number; color: string }
> = {
  growth:     { label: "Growth",     emoji: "📈", max: 80,     color: "#ff5e00" },
  innovation: { label: "Innovation", emoji: "💡", max: 80,     color: "#ffc857" },
  community:  { label: "Community",  emoji: "🤝", max: 80,     color: "#5ec8ff" },
  impact:     { label: "Impact",     emoji: "🌍", max: 80,     color: "#4ade80" },
  cash:       { label: "Geld",       emoji: "💶", max: 120000, color: "#f87171" },
};

// ---------------------------------------------------------------------------
// Allokations-Runde: Parameter und Bereiche (Verteil-Runde nach Phase 5).
// Quelle: pot=Math.min(18000,...) und buckets-Array im HTML-Prototyp.
// ---------------------------------------------------------------------------
export interface AllocationBucket {
  label: string;
  stat: StatKey;
  emoji: string;
}

export const ALLOCATION = {
  /** Maximaler Topf, der verteilt werden kann. */
  maxPot: 18000,
  /** Slider-Granularität in Euro (500er-Schritte). */
  step: 500,
  /** Stat-Punkte je €3.000, die in einen Bucket fließen. */
  gainPer3000: 4,
  /** Feste Bonus-Punkte fürs Abschließen der Verteil-Runde. */
  bonusPoints: 12,
  buckets: [
    { label: "Bessere KI & Produkt",         stat: "innovation" as StatKey, emoji: "💡" },
    { label: "Werbung & Reichweite",          stat: "growth"     as StatKey, emoji: "📣" },
    { label: "Team & Community",              stat: "community"  as StatKey, emoji: "🤝" },
    { label: "Verantwortung & Datenschutz",   stat: "impact"     as StatKey, emoji: "🛡️" },
  ] as AllocationBucket[],
};

// ---------------------------------------------------------------------------
// Szenario-Rahmen — wird zu Beginn vorgestellt.
// B2B-Pivot: Mira ist KI-Assistentin für Service- und Vertriebsteams.
// ---------------------------------------------------------------------------
export const SCENARIO_INTRO = {
  startup: "Mira",
  oneLiner: "Die KI-Assistentin für Service- und Vertriebsteams",
  pitch:
    "Ihr gründet «Mira» — eine KI-Assistentin, die Service- und Vertriebsteams " +
    "in Unternehmen entlastet: Mails beantworten, Angebote erstellen, Kundenkommunikation " +
    "automatisieren. B2B-SaaS heißt: Software-Abo für Unternehmen; abgerechnet wird " +
    "pro Nutzerplatz und skaliert mit jedem neuen Team. Du gründest das Startup dahinter.",
  conditions: [
    "Team: du + 1 unentschlossene:r Mitgründer:in",
    "Startkapital: €20.000 (Erspartes & Family-and-Friends)",
    "Markt: tausende Unternehmen im Mittelstand, KI ist gerade DAS Thema",
    "Wettbewerb: große Tech-Konzerne bauen Ähnliches",
  ],
};

/** Startwerte. Cash in Euro. Quelle: INIT im HTML-Prototyp. */
export const INITIAL_STATS: Stats = {
  growth:     20,
  innovation: 20,
  community:  20,
  impact:     20,
  cash:       20000,
};

// ---------------------------------------------------------------------------
// Phasen der Gründungsreise.
// ---------------------------------------------------------------------------
export const PHASES = [
  { n: 1, name: "Die Idee",              intro: "Aus einer Idee wird ein Plan. Erste Weichen stellen." },
  { n: 2, name: "Das Produkt",           intro: "Vom Konzept zum ersten testbaren Produkt (MVP, Minimalversion zum Lernen)." },
  { n: 3, name: "Die Finanzierung",      intro: "Geld bewegt — aber zu welchem Preis?" },
  { n: 4, name: "Das Wachstum",          intro: "Aus einem Pilot wird ein Unternehmen." },
  { n: 5, name: "Die Bewährungsprobe",   intro: "Jedes Startup wird einmal richtig getestet." },
] as const;

// ---------------------------------------------------------------------------
// Szenario-Pool. Pro Phase genau 4 Szenarien → eines wird zufällig gezogen.
// ---------------------------------------------------------------------------
export const SCENARIOS: Scenario[] = [
  // ===== Phase 1 — Die Idee =====

  {
    id: "p1-cofounder",
    phase: 1,
    title: "Wer baut mit?",
    situation:
      "Deine Idee steht — aber gründet man allein? Eine starke KI-Entwicklerin will einsteigen, verlangt aber 40 % der Firmenanteile.",
    options: [
      {
        id: "a",
        label: "KI-Entwicklerin an Bord holen (40 % Anteile)",
        effects: { innovation: 14, community: 8, growth: 5 },
        points: 20,
        outcome:
          "Ein:e starke:r Mitgründer:in ist mehr wert als Anteile. Technik-Power von Tag 1 — dafür wird dein Anteil an der Firma kleiner.",
      },
      {
        id: "b",
        label: "Allein starten, Technik später dazukaufen",
        effects: { growth: 8, innovation: -6, cash: -8000 },
        points: 5,
        outcome:
          "Du behältst die Kontrolle, zahlst aber Freelancer teuer — und ohne feste Technik-Person fehlt langfristig die Substanz.",
      },
      {
        id: "c",
        label: "Komplett allein machen, niemanden reinholen",
        effects: { growth: 4, innovation: -10, community: -6 },
        points: -8,
        outcome:
          "Schnell gestartet, aber allein gründen ist riskant: alles auf einer Schulter und niemand, mit dem du Ideen prüfst.",
      },
    ],
  },

  {
    id: "p1-target",
    phase: 1,
    title: "Wer ist zuerst dran?",
    // B2B-Pivot: Zielgruppen im Unternehmenskontext statt Privatkunden/kleine Läden
    situation:
      "Du kannst nicht alle gleichzeitig bedienen. Auf welche Unternehmensgruppe konzentrierst du dich zuerst?",
    options: [
      {
        id: "a",
        label: "KMU im Mittelstand — kleine und mittlere Unternehmen mit zahlbaren Problemen",
        effects: { growth: 12, cash: 6000, community: -4 },
        points: 18,
        outcome:
          "KMU sind kleine und mittlere Unternehmen: groß genug für echte Budgets, klein genug für schnelle Entscheidungen. Das bringt früh Umsatz und Stabilität.",
      },
      {
        id: "b",
        label: "Einzelne Freelancer & Kleinstbüros — riesige Gruppe, kleines Budget",
        effects: { growth: 8, community: 12, cash: -6000 },
        points: 12,
        outcome:
          "Eine begeisterte Nutzergruppe ist viel wert — aber wenn kaum jemand zahlt, verbrennst du schnell Geld. Viele Nutzer heißt nicht viel Umsatz.",
      },
      {
        id: "c",
        label: "Ein Konzern als einzigen Enterprise-Kunden gewinnen",
        effects: { growth: 16, impact: 6, cash: -4000, innovation: -4 },
        points: 10,
        outcome:
          "Ein riesiger Kunde sieht super aus, macht dich aber abhängig: Springt er ab, wackelt sofort alles (Klumpenrisiko — zu viel hängt an einem Kunden).",
      },
    ],
  },

  {
    id: "p1-brand",
    phase: 1,
    title: "Wie tretet ihr auf?",
    situation:
      "Der erste Eindruck zählt. Wie löst du Name, Logo und Auftritt von «Mira»?",
    options: [
      {
        id: "a",
        label: "Profi-Agentur fürs Branding bezahlen",
        effects: { growth: 6, innovation: 4, cash: -9000 },
        points: 6,
        outcome:
          "Sieht top aus — aber so viel Geld für die Optik auszugeben, bevor das Produkt überzeugt, ist verfrüht. Erst beweisen, dann hübsch machen.",
      },
      {
        id: "b",
        label: "Selbst gestalten, Geld fürs Produkt sparen",
        effects: { innovation: 6, cash: 2000, community: -2 },
        points: 12,
        outcome:
          "Sparsam gestartet: Am Anfang schlägt ein funktionierendes Produkt jedes schicke Logo.",
      },
      {
        id: "c",
        label: "Namens-Wettbewerb in der Studi-Community",
        effects: { community: 14, growth: 4, cash: -1000 },
        points: 16,
        outcome:
          "Clever: Die Community denkt mit, fühlt sich verbunden und erzählt weiter — Werbung und Bindung in einem.",
      },
    ],
  },

  {
    id: "p1-problem",
    phase: 1,
    title: "Welches Problem ist groß genug?",
    situation:
      "Mira kann vieles automatisieren. Welches Anfangsproblem ist groß genug für ein Venture-Capital-taugliches Startup und trotzdem eng genug für den Start?",
    options: [
      {
        id: "a",
        label: "Angebote und Follow-ups für B2B-Vertriebsteams automatisieren",
        effects: { growth: 12, innovation: 6, cash: 2000, impact: -2 },
        points: 18,
        outcome:
          "Starker Fokus: Vertriebsteams spüren sofort, ob mehr Angebote schneller rausgehen. Ein klar messbarer Nutzen verkauft sich besser als ein diffuses Alles-können-Tool.",
      },
      {
        id: "b",
        label: "Eine KI für jede Abteilung bauen",
        effects: { innovation: 10, growth: -8, cash: -6000 },
        points: 2,
        outcome:
          "Ambitioniert, aber zu breit. Wenn du zu viele Probleme gleichzeitig löst, wird das Produkt teuer und die Botschaft unscharf.",
      },
      {
        id: "c",
        label: "Nur interne Uni-Teams als Testkunden nehmen",
        effects: { community: 12, impact: 4, cash: -3000, growth: -6 },
        points: 6,
        outcome:
          "Guter Lernraum, aber zu weit weg vom zahlenden Markt. Für ein skalierbares B2B-Startup brauchst du schnell echte Unternehmensprobleme.",
      },
    ],
  },

  // ===== Phase 2 — Das Produkt =====

  {
    id: "p2-mvp",
    phase: 2,
    title: "Wie viel Produkt zum Start?",
    situation:
      "Der Start naht. Wie fertig muss die erste Version von Mira wirklich sein?",
    options: [
      {
        id: "a",
        label: "MVP bauen: Minimalversion, die nur das Wichtigste kann",
        effects: { growth: 12, innovation: 4, community: 4 },
        points: 20,
        outcome:
          "Ein MVP ist ein Minimum Viable Product: eine einfache Version, mit der du lernst, ob der Kernnutzen stimmt. Frühes Feedback schlägt monatelanges Bauen im Stillen.",
      },
      {
        id: "b",
        label: "Erst das komplette, perfekte Produkt fertig bauen",
        effects: { innovation: 12, cash: -12000, growth: -6 },
        points: -4,
        outcome:
          "Monatelang ohne Nutzer zu bauen ist teuer und riskant — viele entwickeln am Bedarf vorbei, weil sie zu spät starten.",
      },
      {
        id: "c",
        label: "Erst ein Test-Modell aus fertigen Bausteinen (ohne Programmieren)",
        effects: { innovation: 8, cash: 4000, growth: 4 },
        points: 14,
        outcome:
          "Schlau & günstig getestet: Mit fertigen Baukasten-Tools prüfst du die Idee, ohne teuer zu entwickeln — ideal vor dem echten Bau.",
      },
    ],
  },

  {
    id: "p2-feedback",
    phase: 2,
    title: "Was wollen die Nutzer?",
    situation:
      "Die ersten Unternehmen testen Mira. Wie findest du heraus, was sie wirklich brauchen?",
    options: [
      {
        id: "a",
        label: "30 Nutzer:innen persönlich befragen",
        effects: { innovation: 12, community: 10, growth: -4 },
        points: 18,
        outcome:
          "Raus zu den Leuten: Echte Gespräche zeigen, was Menschen wirklich brauchen — der wertvollste Input überhaupt.",
      },
      {
        id: "b",
        label: "Einfach starten und die Nutzungs-Zahlen beobachten",
        effects: { growth: 10, innovation: -4 },
        points: 8,
        outcome:
          "Zahlen lügen nicht — verraten aber nicht das Warum. Ohne echte Rückmeldungen tappst du beim Verbessern oft im Dunkeln.",
      },
      {
        id: "c",
        label: "Große Online-Umfrage verschicken",
        effects: { community: 4, innovation: -2 },
        points: 2,
        outcome:
          "Was Leute in Umfragen ankreuzen und was sie wirklich tun, ist oft zweierlei. Bequem, aber selten ehrlich.",
      },
    ],
  },

  {
    id: "p2-tech",
    phase: 2,
    title: "Woher kommt die KI?",
    situation:
      "Mira braucht ein KI-Modell als Motor. Worauf baust du?",
    options: [
      {
        id: "a",
        label: "Große KI per API anbinden",
        effects: { growth: 10, innovation: 2, cash: -6000 },
        points: 12,
        outcome:
          "Eine API ist eine Schnittstelle zu einem fremden Dienst. Du bist schnell startklar, zahlst aber pro Nutzung und bleibst abhängig vom Anbieter.",
      },
      {
        id: "b",
        label: "Ein eigenes KI-Modell trainieren",
        effects: { innovation: 16, cash: -12000, growth: -4 },
        points: 10,
        outcome:
          "Unabhängig und einzigartig — aber teuer und langsam. Lohnt sich nur, wenn die eigene KI wirklich besser ist.",
      },
      {
        id: "c",
        label: "Ein frei verfügbares Modell selbst betreiben (Mittelweg)",
        effects: { innovation: 10, cash: -4000, growth: 4 },
        points: 16,
        outcome:
          "Pragmatischer Mittelweg: ein offenes, kostenloses Modell nehmen und anpassen — günstiger als selbst bauen, freier als mieten.",
      },
    ],
  },

  {
    id: "p2-api-integration",
    phase: 2,
    title: "Wie tief integriert sich Mira?",
    situation:
      "Pilotkunden wollen Mira direkt in CRM, Helpdesk und Mail-Tools nutzen. Jede Integration macht das Produkt wertvoller, aber auch komplexer.",
    options: [
      {
        id: "a",
        label: "Erst zwei Kern-APIs sauber anbinden",
        effects: { innovation: 10, growth: 8, cash: -5000, impact: 3 },
        points: 18,
        outcome:
          "APIs sind Schnittstellen zwischen Software-Systemen. Zwei verlässliche Integrationen sind besser als zehn wackelige, weil echte Teams damit sofort arbeiten können.",
      },
      {
        id: "b",
        label: "Alles manuell importieren lassen und schneller verkaufen",
        effects: { growth: 10, innovation: -6, cash: 1000, impact: -4 },
        points: 6,
        outcome:
          "Schnell im Vertrieb, schwach im Produkt: Manuelle Datenimporte brechen im Alltag leicht und erzeugen Datenschutzrisiken.",
      },
      {
        id: "c",
        label: "Erst eine offene Plattform für alle Integrationen bauen",
        effects: { innovation: 14, growth: -8, cash: -10000 },
        points: 4,
        outcome:
          "Technisch stark, aber zu früh. Eine Plattform lohnt sich erst, wenn du genau weißt, welche Integrationen Kunden wirklich täglich brauchen.",
      },
    ],
  },

  // ===== Phase 3 — Die Finanzierung =====

  {
    id: "p3-source",
    phase: 3,
    title: "Woher kommt das Geld?",
    situation:
      "Für den nächsten Schritt brauchst du frisches Geld. Wie finanzierst du das Wachstum?",
    options: [
      {
        id: "a",
        label: "Bootstrappen — aus dem eigenen Umsatz wachsen",
        effects: { growth: -4, cash: -3000, community: 6, impact: 4 },
        points: 12,
        outcome:
          "«Bootstrappen» heißt: ohne fremdes Geld wachsen, nur aus eigenem Umsatz. Volle Kontrolle, keine Anteile abgeben — aber langsam.",
      },
      {
        id: "b",
        label: "Einen Business Angel holen (Geld gegen Anteile)",
        effects: { cash: 40000, growth: 12, community: -4 },
        points: 16,
        outcome:
          "Ein «Business Angel» ist ein erfahrener Privat-Investor: Er gibt Geld und Kontakte und bekommt dafür Firmenanteile. Tempo und Erfahrung — aber du teilst deine Firma.",
      },
      {
        id: "c",
        label: "Eine staatliche Förderung beantragen",
        effects: { cash: 30000, impact: 6, innovation: 4, growth: -6 },
        points: 14,
        outcome:
          "Geld vom Staat, ohne Anteile abzugeben — dafür viel Papierkram und Wartezeit. Kostet Tempo, aber du bleibst Herr im eigenen Haus.",
      },
    ],
  },

  {
    id: "p3-pricing",
    phase: 3,
    // B2B-Pivot: Preismodell mit Seats/Tiers statt Freipreis für kleine Läden
    title: "Was kostet Mira?",
    situation:
      "Das Preismodell entscheidet über Wachstum und Marge. Wie positionierst du dich im B2B-Markt?",
    options: [
      {
        id: "a",
        label: "Günstiger Einstiegspreis — schnell viele Seats verkaufen",
        effects: { growth: 14, cash: -10000, impact: 2 },
        points: 6,
        outcome:
          "Wächst schnell, aber die Gewinnspanne ist winzig. Zu billig zu starten macht es später schwer, die Preise wieder anzuheben.",
      },
      {
        id: "b",
        label: "Höherer Tier-Preis — über Qualität statt Masse verkaufen",
        effects: { cash: 12000, growth: -6, innovation: 4 },
        points: 12,
        outcome:
          "Eine gesunde Gewinnspanne finanziert dein Wachstum selbst. Weniger, aber wertvollere Kunden — dafür musst du klar zeigen, was Mira wert ist.",
      },
      {
        id: "c",
        label: "Basis-Tier kostenlos, Pro-Seats kosten Geld (Freemium)",
        effects: { growth: 10, community: 8, cash: -6000 },
        points: 14,
        outcome:
          "Freemium heißt: eine kostenlose Basisversion lockt Nutzer an, bezahlt wird später für Pro-Funktionen. Das kann wachsen, kostet aber viel, wenn zu wenige wechseln.",
      },
    ],
  },

  {
    id: "p3-investor",
    phase: 3,
    title: "Der große Scheck",
    situation:
      "Ein Investor bietet sehr viel Geld — will aber die Mehrheit der Firma und dass ihr heimlich die Daten eurer Nutzer verkauft.",
    options: [
      {
        id: "a",
        label: "Annehmen — so viel Geld bekommst du nie wieder",
        effects: { cash: 50000, growth: 16, impact: -20, community: -12 },
        points: -6,
        outcome:
          "Viel Geld, aber du verlierst die Kontrolle UND das Vertrauen deiner Nutzer. Das falsche Geld kann ein Startup seine Seele kosten.",
      },
      {
        id: "b",
        label: "Hart verhandeln: Geld ja, Datenverkauf nein",
        effects: { cash: 24000, growth: 8, impact: 4 },
        points: 18,
        outcome:
          "Stark: Du nimmst Kapital, schützt aber deine Werte und die Mehrheit. Gute Bedingungen sind wichtiger als die größte Summe.",
      },
      {
        id: "c",
        label: "Ablehnen — Vertrauen ist wichtiger als Geld",
        effects: { growth: -8, impact: 10, community: 8, cash: -3000 },
        points: 8,
        outcome:
          "Treu zu deinen Werten, aber langsamer. Manchmal genau richtig — manchmal verpasst man so den entscheidenden Moment.",
      },
    ],
  },

  {
    id: "p3-termsheet",
    phase: 3,
    title: "Das harte Term Sheet",
    situation:
      "Ein Fonds bietet 3 Mio. Euro. Im Term Sheet, also dem Vertragsangebot für eine Finanzierung, stehen harte Bedingungen: zweifache Liquidation Preference, Board-Mehrheit und ein sofortiger Pivot (strategische Richtungsänderung) zu Enterprise-only, also nur noch große Firmenkunden.",
    options: [
      {
        id: "a",
        label: "Annehmen — Tempo ist wichtiger als Kontrolle",
        effects: { cash: 60000, growth: 18, community: -16, impact: -10 },
        points: -4,
        outcome:
          "Eine Liquidation Preference regelt, wer bei einem Verkauf zuerst Geld bekommt; zweifach ist hart. Viel Kapital hilft wenig, wenn du Kontrolle und Teamvertrauen verlierst.",
      },
      {
        id: "b",
        label: "Verhandeln: einfache Preference, kein Board-Mehrheitsrecht",
        effects: { cash: 36000, growth: 10, community: 4, impact: 2 },
        points: 20,
        outcome:
          "Gute Finanzierung ist nicht nur Betrag, sondern Bedingungen. Du nimmst Kapital, schützt aber Entscheidungsfreiheit und vermeidest toxische Kontrollrechte.",
      },
      {
        id: "c",
        label: "Brückendarlehen nehmen und später verhandeln",
        effects: { cash: 18000, growth: 4, innovation: -2, community: 2 },
        points: 10,
        outcome:
          "Ein Brückendarlehen ist ein kurzfristiger Kredit bis zur nächsten Finanzierung. Es kauft Zeit, löst aber die Frage nach starken Investoren noch nicht.",
      },
    ],
  },

  // ===== Phase 4 — Das Wachstum =====

  {
    id: "p4-hire",
    phase: 4,
    title: "Der erste richtige Mitarbeiter",
    situation:
      "Du kannst dir genau eine feste Stelle leisten. Wer hilft jetzt am meisten?",
    options: [
      {
        id: "a",
        label: "Sales-Manager:in — mehr Unternehmenskunden gewinnen",
        effects: { growth: 14, cash: -12000, innovation: -2 },
        points: 14,
        outcome:
          "Vertrieb bringt Umsatz, der alles andere finanziert. Selling wird in der Frühphase oft unterschätzt.",
      },
      {
        id: "b",
        label: "KI-Entwickler:in — Produkt schneller verbessern",
        effects: { innovation: 14, cash: -12000, growth: 2 },
        points: 12,
        outcome:
          "Mehr Tempo am Produkt — aber ohne Vertrieb bleiben die besten Features ungenutzt. Balance ist alles.",
      },
      {
        id: "c",
        label: "Customer-Success-Manager:in — Bindung & Weiterempfehlungen",
        effects: { community: 16, growth: 4, cash: -10000 },
        points: 12,
        outcome:
          "Im B2B-SaaS, also Software für Unternehmen, zählt Bindung: Zufriedene Kunden kündigen seltener und kaufen leichter zusätzliche Plätze.",
      },
    ],
  },

  {
    id: "p4-expand",
    phase: 4,
    title: "Wie schnell wachsen?",
    situation:
      "Münster läuft. Sollst du jetzt expandieren — oder erst den Heimmarkt dominieren?",
    options: [
      {
        id: "a",
        label: "Sofort in die zweite Stadt expandieren",
        effects: { growth: 16, cash: -20000, community: -6, impact: 2 },
        points: 6,
        outcome:
          "Zu früh skaliert heißt: Du gibst Geld aus, bevor Vertrieb und Produkt wirklich sitzen. Das sieht nach Wachstum aus, kann aber die Kasse leeren.",
      },
      {
        id: "b",
        label: "Münster erst zur klaren Nummer 1 machen",
        effects: { growth: 8, community: 10, impact: 6, cash: -4000 },
        points: 18,
        outcome:
          "Erst einen Markt dominieren, dann kopieren: ein bewiesenes, profitables Modell skaliert viel sicherer.",
      },
      {
        id: "c",
        label: "Partner-Netzwerk für andere Regionen aufbauen",
        effects: { growth: 12, cash: 10000, innovation: -4, impact: -4 },
        points: 10,
        outcome:
          "Schnell und kapitalschonend — aber du gibst Qualitätskontrolle ab. Die Marke ist nur so gut wie der schwächste Partner.",
      },
    ],
  },

  {
    id: "p4-marketing",
    phase: 4,
    title: "Wie macht ihr Mira bekannt?",
    situation:
      "Das Budget ist begrenzt. Wie holst du die meiste Aufmerksamkeit raus?",
    options: [
      {
        id: "a",
        label: "Bezahlte LinkedIn- und Google-Ads schalten",
        effects: { growth: 12, cash: -16000 },
        points: 6,
        outcome:
          "Ads wirken sofort — aber sobald du zahlst, hört es auf zu wachsen. Gemietete Reichweite gehört dir nie.",
      },
      {
        id: "b",
        label: "Expert:innen-Content und Community-Events",
        effects: { community: 16, growth: 8, cash: -4000 },
        points: 18,
        outcome:
          "Vertrauen durch Expertise: Wenn Mira sichtbar erklärt, wie gute KI-Prozesse funktionieren, wirkt das bei B2B-Kunden glaubwürdiger als reine Werbung.",
      },
      {
        id: "c",
        label: "Eine aufsehenerregende Aktion in der Stadt",
        effects: { growth: 10, community: 4, impact: -2, cash: -6000 },
        points: 8,
        outcome:
          "Kann durch die Decke gehen — oder verpuffen. PR-Stunts sind ein Glücksspiel: hohe Varianz, schwer wiederholbar.",
      },
    ],
  },

  {
    id: "p4-partner-marketplace",
    phase: 4,
    title: "Wachstum über Partner?",
    situation:
      "Ein großer CRM-Marktplatz, also eine Plattform für Kundendaten-Software, bietet euch Sichtbarkeit, wenn Mira als Zusatzmodul gelistet wird. Dafür müsst ihr Produktplan und Umsatz teilen.",
    options: [
      {
        id: "a",
        label: "Marketplace-Deal annehmen und Reichweite kaufen",
        effects: { growth: 16, cash: 6000, innovation: -6, community: -4 },
        points: 12,
        outcome:
          "Reichweite über Partner kann Sales beschleunigen. Der Preis ist Abhängigkeit: Wenn der Marktplatz Regeln ändert, hängt dein Wachstum an fremder Infrastruktur.",
      },
      {
        id: "b",
        label: "Eigene Direktvertriebsmaschine bauen",
        effects: { growth: 8, community: 6, cash: -14000, innovation: 2 },
        points: 14,
        outcome:
          "Langsamer und teurer, aber kontrollierter. Ein eigener Vertrieb lernt direkt vom Kunden und macht dich unabhängiger von Plattformen.",
      },
      {
        id: "c",
        label: "Exklusive Agenturpartner zertifizieren",
        effects: { community: 12, growth: 10, cash: -6000, impact: -3 },
        points: 10,
        outcome:
          "Partner bringen Nähe zum Kunden, aber Qualität wird schwerer zu steuern. Schlechte Implementierungen fallen am Ende auf Mira zurück.",
      },
    ],
  },

  // ===== Phase 5 — Die Bewährungsprobe =====

  {
    id: "p5-keycustomer",
    phase: 5,
    title: "Der Großkunde stellt ein Ultimatum",
    situation:
      "Euer größter Enterprise-Kunde will Exklusivität — ihr dürftet keine anderen Kunden in seiner Branche mehr beliefern.",
    options: [
      {
        id: "a",
        label: "Zustimmen — der Umsatz ist zu wichtig",
        effects: { cash: 18000, growth: -10, community: -8, impact: -4 },
        points: -4,
        outcome:
          "Kurzfristig sicher, langfristig gefährlich: Ein Kunde mit so viel Macht kann dich jederzeit unter Druck setzen.",
      },
      {
        id: "b",
        label: "Kompromiss: Exklusivität nur befristet und gegen Aufpreis",
        effects: { cash: 12000, growth: 4, community: 2 },
        points: 18,
        outcome:
          "Verhandelt statt verschenkt: Du sicherst Umsatz, behältst aber deine Freiheit und machst dich weniger abhängig.",
      },
      {
        id: "c",
        label: "Ablehnen — Unabhängigkeit zählt mehr",
        effects: { growth: 8, community: 8, impact: 4, cash: -12000 },
        points: 12,
        outcome:
          "Mutig: Du schützt dein Geschäft vor zu großer Abhängigkeit — musst die Lücke aber erstmal selbst stopfen.",
      },
    ],
  },

  {
    id: "p5-crisis",
    phase: 5,
    // B2B-Pivot: Café-Besitzer → ein B2B-Kunde verschickt durch Mira-Fehler
    // eine peinliche Massen-Mail an seine Accounts
    title: "Mira blamiert sich öffentlich",
    situation:
      "Mira gibt einem Kunden einen völlig falschen Rat — er verschickt dadurch eine peinliche Massen-Mail an alle seine Accounts. Der Fall geht in den sozialen Medien viral.",
    options: [
      {
        id: "a",
        label: "Sofort öffentlich entschuldigen und sichtbar nachbessern",
        effects: { community: 14, innovation: 6, cash: -9000, impact: 4 },
        points: 20,
        outcome:
          "Vorbildlich: Ehrlich und schnell zu reagieren schafft in einer Krise oft mehr Vertrauen, als hätte es den Fehler nie gegeben.",
      },
      {
        id: "b",
        label: "Kleinreden und auf «Einzelfall» schieben",
        effects: { community: -14, growth: -8, impact: -4 },
        points: -10,
        outcome:
          "Macht alles schlimmer. Ausreden in der Krise zerstören Vertrauen schneller als der Fehler selbst.",
      },
      {
        id: "c",
        label: "Bekannte Leute dafür bezahlen, das Thema zu überdecken",
        effects: { growth: 4, community: -6, cash: -9000 },
        points: -2,
        outcome:
          "Ablenken statt lösen. Wer das eigentliche Problem zudeckt, riskiert beim nächsten Mal den doppelten Knall.",
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
        label: "Bewusst das Tempo rausnehmen + gemeinsames Team-Wochenende",
        effects: { community: 14, impact: 4, growth: -4, cash: -6000 },
        points: 18,
        outcome:
          "Klug: Gründen ist ein Marathon, kein Sprint. Ein gesundes Team ist dein wertvollstes und knappstes Gut.",
      },
      {
        id: "b",
        label: "Weiter pushen — jetzt bloß nicht bremsen",
        effects: { growth: 8, community: -16, innovation: -4 },
        points: -8,
        outcome:
          "Kurzfristig mehr Leistung, dann Kündigungen. Ausgebrannte Teams kosten am Ende mehr als jede verpasste Frist.",
      },
      {
        id: "c",
        label: "Hilfe und bessere Abläufe von außen einkaufen",
        effects: { community: 6, cash: -9000, innovation: 2 },
        points: 8,
        outcome:
          "Entlastet — kostet aber Geld und löst das eigentliche Problem nicht. Werkzeuge helfen, ersetzen aber keine echte Erholung.",
      },
    ],
  },

  {
    id: "p5-incumbent-copy",
    phase: 5,
    title: "Der große Anbieter kopiert euch",
    situation:
      "Ein Konzern wie Microsoft oder HubSpot kündigt ähnliche KI-Funktionen an. Viele fragen sich, ob Mira jetzt noch eine Chance hat.",
    options: [
      {
        id: "a",
        label: "Direkt gegen den Konzern positionieren",
        effects: { growth: -6, community: 4, cash: -12000, innovation: 4 },
        points: 4,
        outcome:
          "Mutig, aber teuer: Ein Marketingkampf gegen Konzerne verbrennt schnell Geld. Kleine Startups gewinnen selten über Lautstärke.",
      },
      {
        id: "b",
        label: "Tiefer in eine Branche gehen und Spezialfeatures bauen",
        effects: { innovation: 12, growth: 8, impact: 4, cash: -7000 },
        points: 20,
        outcome:
          "Guter Gegenangriff: Konzerne bauen breite Standardfunktionen, Startups können tiefer in die Arbeitsabläufe einer Branche gehen.",
      },
      {
        id: "c",
        label: "Partner im Konzern-Ökosystem werden",
        effects: { growth: 10, cash: 3000, community: 4, innovation: -4 },
        points: 12,
        outcome:
          "Pragmatisch: Du nutzt die Reichweite des großen Anbieters, gibst aber ein Stück Differenzierung auf und wirst vergleichbarer.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Glücks-Events.
// 3 Vereins-Events (category "verein") + 3 Markt-Events (category "markt").
// Texte 1:1 aus dem HTML-Prototyp übernommen.
// ---------------------------------------------------------------------------
export const LUCK_EVENTS: LuckEvent[] = [
  // --- Vereins-Events (VCM_EVENTS) ---
  {
    id: "verein-climate-hack",
    category: "verein",
    title: "Climate Hack gewonnen!",
    text:
      "Du hast beim Climate Hack mitgemacht — einem nachhaltigen 4-tägigen Hackathon, bei dem der Venture Club Münster junge Menschen unterstützt, ihre ersten Gründungsideen in die Tat umzusetzen. Deine Idee überzeugt die Jury: Preisgeld!",
    effects: { cash: 10000, community: 6, impact: 6 },
  },
  {
    id: "verein-startup-contacts",
    category: "verein",
    title: "Neue Kunden auf der Startup Contacts",
    text:
      "Auf der Startup Contacts, der Gründermesse des Venture Club Münster, kommst du mit Besuchern ins Gespräch — daraus werden echte erste Kunden.",
    effects: { growth: 8, community: 8 },
  },
  {
    id: "verein-beitritt",
    category: "verein",
    title: "Beim Venture Club Münster dabei",
    text:
      "Du bist dem Venture Club Münster beigetreten und triffst dort erfahrene Gründer:innen, die dir mit Rat und Kontakten den Rücken stärken.",
    effects: { community: 10, innovation: 4 },
  },

  // --- Markt-Events (MARKET_EVENTS) ---
  {
    id: "markt-konzern",
    category: "markt",
    title: "Großer Tech-Konzern zieht nach",
    text:
      "Ein bekannter Tech-Konzern stellt eine ähnliche KI vor. Plötzlich ist die Konkurrenz riesig.",
    effects: { growth: -8, cash: -3000 },
  },
  {
    id: "markt-kosten",
    category: "markt",
    title: "Die KI-Kosten steigen",
    text:
      "Die Preise für die Rechenleistung deiner KI klettern nach oben. Der Betrieb wird teurer.",
    effects: { cash: -8000, innovation: -2 },
  },
  {
    id: "markt-hype",
    category: "markt",
    title: "KI ist in aller Munde",
    text:
      "KI ist gerade DAS Thema in den Medien. Alle wollen wissen, was Mira kann — Rückenwind!",
    effects: { growth: 8, community: 6 },
  },
];

// ---------------------------------------------------------------------------
// Founder-Typen — bestimmt durch die stärkste der vier Säulen am Ende.
// "balanced" greift, wenn keine Säule klar dominiert.
// Quelle: TYPES-Objekt im HTML-Prototyp.
// ---------------------------------------------------------------------------
export const FOUNDER_TYPES: Record<StatKey | "balanced", FounderType> = {
  growth: {
    key: "growth",
    name: "Der/die Hustler:in",
    tagline: "Wachstum ist deine Sprache.",
    emoji: "🚀",
    description:
      "Du denkst in Umsatz, Kunden und Tempo. Du bringst Dinge ins Rollen — achte nur darauf, dass Produkt und Team mitkommen.",
  },
  innovation: {
    key: "innovation",
    name: "Der/die Visionär:in",
    tagline: "Du baust, was es noch nicht gibt.",
    emoji: "💡",
    description:
      "Produkt und Idee stehen im Zentrum. Du willst es richtig machen — denk daran, früh genug rauszugehen und zu verkaufen.",
  },
  community: {
    key: "community",
    name: "Der/die Connector:in",
    tagline: "Menschen folgen dir.",
    emoji: "🤝",
    description:
      "Du baust Teams, Communities und Vertrauen. Dein Netzwerk ist deine Superkraft — kombiniere es mit Fokus auf die Zahlen.",
  },
  impact: {
    key: "impact",
    name: "Der/die Changemaker:in",
    tagline: "Du gründest mit Haltung.",
    emoji: "🌍",
    description:
      "Werte und Sinn schlagen für dich den schnellen Profit. Du veränderst etwas — denk daran: Nur ein gesundes Geschäft wirkt dauerhaft.",
  },
  balanced: {
    key: "balanced",
    name: "Der/die Allrounder:in",
    tagline: "Du hältst alles in Balance.",
    emoji: "⚖️",
    description:
      "Du jonglierst Wachstum, Produkt, Team und Haltung ausgewogen — die seltene Gabe echter Gründer:innen.",
  },
};
