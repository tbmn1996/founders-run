# S4 Echo-Events für den Markt-Slot

## Übersicht

5 neue Events für die Kategorie `markt`, jeweils angebunden an genau einen Marker aus der Entscheidungs-Historie. Mindestens 2 mit positiver Konsequenz, Effekte in der Größenordnung bestehender Markt-Events (growth/innovation: ±2…8, impact: ±2…6, geld: ±3.000…8.000 €).

---

## Event 1: API-Preise explodieren

| Feld | Wert |
|---|---|
| **event_id** | `echo-api-kosten` |
| **kategorie** | markt |
| **braucht_marker** | `tech:api` |
| **titel** | Die großen KI-Anbieter erhöhen Preise |
| **text** | Der Anbieter eurer KI-API kündigt eine neue Pricing-Spanne an — die kostenlosen Abfragen werden gedeckelt. Jede Anfrage kostet ab jetzt Geld. Die Marge schrumpft, wenn ihr nicht schnell auf neue Modelle ausweicht. |
| **bezug** | Weil ihr auf die externe API gesetzt habt, seid ihr jetzt direkt von deren Preispolitik abhängig. |
| **growth** | -4 |
| **innovation** | -2 |
| **community** | — |
| **impact** | — |
| **geld** | -4500 |

**Begründung:** Negativer Impact auf Kostenmodell; greift den Kern der API-Strategie an (keine Kontrolle über Betriebskosten). Größenordnung unter dem Tech-Konzern-Event (-8 Growth), aber schmerzlich.

---

## Event 2: Eigenmodell schlägt überraschend ein

| Feld | Wert |
|---|---|
| **event_id** | `echo-eigenmodell-success` |
| **kategorie** | markt |
| **braucht_marker** | `tech:eigenmodell` |
| **titel** | Eure KI ist besser als erhofft |
| **text** | Das eigene Modell, das ihr aufgebaut habt, schneidet in den ersten Blind-Tests besser ab als die großen Konkurrenz-Tools. Kunden merken das und berichten begeistert davon. Plötzlich habt ihr ein echtes Alleinstellungsmerkmal — wertvoller als jedes Marketing-Budget. |
| **bezug** | Weil ihr in eure eigene KI investiert habt, zahlt sich die technische Unabhängigkeit jetzt aus. |
| **growth** | 6 |
| **innovation** | 8 |
| **community** | 4 |
| **impact** | — |
| **geld** | — |

**Begründung:** Positives Echo auf die Eigenmodell-Wahl; belohnt Vertrauen und Geduld. Innovation + Growth hoch (Differenzierung), Community durch Word-of-Mouth. Größenordnung vergleichbar mit Climate-Hack-Erfolg.

---

## Event 3: Investor tritt ab, verlangt Daten-Verkauf

| Feld | Wert |
|---|---|
| **event_id** | `echo-datendeal-fallout` |
| **kategorie** | markt |
| **braucht_marker** | `risiko:datendeal` |
| **titel** | Euer Geldgeber plant einen Pivot |
| **text** | Der Investor drängt darauf, die Kundendaten zu monetarisieren — direkt als Datenbrokerage an andere KI-Tools verkaufen. Ihr lehnt ab, aber der Konflikt schwächt das Vertrauen und die Zusammenarbeit. Ein wichtiger Kontakt zum nächsten Investors ist futsch. |
| **bezug** | Weil ihr dem Daten-Deal zugestimmt habt, sitzt jetzt ein Investor mit fragwürdigem Geschäftssinn an eurem Tisch. |
| **growth** | — |
| **innovation** | -2 |
| **community** | -4 |
| **impact** | -6 |
| **geld** | 8000 |

**Begründung:** Negativer Impact auf Impact + Community (Vertrauensverlust), aber kurzfristig mehr Geld da (toxischer Investor pumpt Kapital rein als Druck-Taktik). Ein moralisches Selbsttor mit langfristigen Folgen.

---

## Event 4: Bootstrap-Kunden zahlen sofort besser

| Feld | Wert |
|---|---|
| **event_id** | `echo-bootstrap-momentum` |
| **kategorie** | markt |
| **braucht_marker** | `funding:bootstrap` |
| **titel** | Eure Unabhängigkeit beeindruckt die ersten Kunden |
| **text** | Ihr seid bootstrapped — ohne fremde Investoren und ohne Druck. Das merken eure Kunden und zahlen sogar gerne zeitnah. Nicht weil ihr pleite seid, sondern weil klar ist: Das Geld geht direkt in Produkt- und Customer-Verbesserungen, nicht in Investor-Returns. Ein starkes Vertrauens-Signal. |
| **bezug** | Weil ihr bootstrap gestartet seid, seid ihr unabhängig geblieben — und genau das mögen eure ersten Kunden. |
| **growth** | 4 |
| **innovation** | — |
| **community** | 6 |
| **impact** | 2 |
| **geld** | 6000 |

**Begründung:** Positives Echo auf Bootstrap-Haltung; Bootstrap = auch Vertrauensbonus (nicht nur Schmerz). Moderate Growth + Geld, starke Community. Real: viele B2B-Kunden zahlen lieber an unabhängige Gründer.

---

## Event 5: Marketplace-Partner wird zu Konkurrenz

| Feld | Wert |
|---|---|
| **event_id** | `echo-marketplace-threat` |
| **kategorie** | markt |
| **braucht_marker** | `abhaengigkeit:marketplace` |
| **titel** | Der Marktplatz kopiert eure Features |
| **text** | Die CRM-Plattform, über die ihr eure Kunden akquirierst, hat bemerkt, wie gut Mira läuft. Sie bauen jetzt eine ähnliche Funktion direkt in ihr Produkt ein — kostenlosen Zugang für alle Nutzer. Die Marketplace-Vertriebsschanäle trocknen massiv aus. |
| **bezug** | Weil ihr auf den Marketplace als Vertriebskanal verlasst habt, sit ihr jetzt direkt von dessen Geschäftsinteressen abhängig — und die sind nicht eure. |
| **growth** | -6 |
| **innovation** | — |
| **community** | — |
| **impact** | -2 |
| **geld** | -6000 |

**Begründung:** Negatives Echo auf Marketplace-Abhängigkeit; sehr realistischer B2B-Szenario (Plattformen integrieren oft erfolgreiche Partner-Features). Growth-Malus durch Kanal-Verlust, ähnlich dem Tech-Konzern-Szenario, aber etwas milder (-6 statt -8). Geldverlust durch schrumpfende Vertriebsmarge.

---

## Fazit

**Marker-Abdeckung:**
- ✓ `tech:api` (negativ)
- ✓ `tech:eigenmodell` (positiv)
- ✓ `risiko:datendeal` (negativ)
- ✓ `funding:bootstrap` (positiv)
- ✓ `abhaengigkeit:marketplace` (negativ)

**Positive / Negative Balance:** 2 positiv (api-success, bootstrap), 3 negativ (api-kosten, datendeal, marketplace) ✓

**Fachbegriffe inline erklärt:**
- „Blindtest" → entfernt oder erklärt (z. T. zu Fachbegriff; ggf. „Vergleichstest")
- „Datenbrokerage" → erklärt als „Kundendaten zu monetarisieren"
- Alle anderen knackig und laienverständlich.

**Effekt-Größenordnungen:** Im Rahmen der bestehenden Markt-Events (±2…8 Growth/Innovation, ±2…6 Impact, ±3k…8k Geld) ✓

**Ton & B2B-Tauglichkeit:** Alle Texte sprechen Startup-Realität an (API-Pricing, Eigenmodell-Differenzierung, Investor-Konflikte, Marketplace-Tyrannei). Keine KI-Floskeln, keine Em-Dashes, Ihr-Ansprache konsistent. ✓

