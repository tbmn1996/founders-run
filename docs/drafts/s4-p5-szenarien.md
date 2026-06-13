# S4 — P5-Szenarien: Marker-Abdeckung & Entwürfe

## 1. Analyse: Bestehende P5-Fragen und Marker-Passung

### Status quo (4 vorhandene P5-Szenarien)

| Frage-ID | Titel | Marker-Empfehlung | Bezug-Satz (wenn marker-gebunden) |
|---|---|---|---|
| `p5-keycustomer` | Der Großkunde stellt ein Ultimatum | `ziel:enterprise` | „Weil ihr euch früh auf Enterprise fokussiert habt, steht dieser Großkunde jetzt am Verhandlungstisch mit Exklusivitäts-Forderung." |
| `p5-crisis` | Mira blamiert sich öffentlich | *(markerlos)* | *(kein Bezug — Fallback für unvorbereitete Marker)* |
| `p5-burnout` | Das Team ist am Limit | `tempo:hoch` | „Euer hohes Tempo zahlt sich aus — aber das Team ist jetzt am Rand des Burnout." |
| `p5-incumbent-copy` | Der große Anbieter kopiert euch | `tech:api` | „Weil ihr auf API-Integration gesetzt habt, habt ihr einen Integrations-Wettbewerb offen gelassen." |

### Marker-Abdeckung durch bestehende P5-Fragen

- ✅ `ziel:enterprise` → `p5-keycustomer`
- ✅ `tech:api` → `p5-incumbent-copy`
- ✅ `tempo:hoch` → `p5-burnout`
- ✅ `abhaengigkeit:marketplace` → möglich bei `p5-incumbent-copy` (sekundär, siehe unten)
- ❌ `tech:eigenmodell` — **nicht abgedeckt**
- ❌ `funding:investor` — **nicht abgedeckt**
- ❌ `funding:bootstrap` — **nicht abgedeckt**
- ❌ `risiko:datendeal` — **nicht abgedeckt**

### Markerloses Fallback

`p5-crisis` bleibt absichtlich **ohne `braucht_marker`**, um einen universellen Fallback zu haben, wenn die RNG-Auswahl keinen der marker-gebundenen Szenarien trifft. Damit wird garantiert, dass in jedem Spiel ein P5-Szenario ausspielbar ist.

---

## 2. Entwürfe: Neue P5-Szenarien (für unterdeckte Marker)

### Szenario A: `p5-eigenmodell` — Selbstgebaute Konkurrenz?

**Frage-ID:** `p5-eigenmodell`  
**Phase:** `5`  
**Titel:** Sollen wir selbst bauen oder integrieren?  
**Situation:** Ein großes Unternehmen möchte Mira in sein System direkt einbauen — nicht als API-Integration, sondern will eure KI-Engine kaufen und ins eigene Produkt übernehmen. Parallel erheben mehrere Mitbewerber Eigenmodelle ihrer KI-Features. Solltet ihr mithalten oder euren API-Weg verdoppeln?

**braucht_marker:** `tech:eigenmodell`  
**bezug:** „Weil ihr früh auf Eigenentwicklung statt nur Integration gesetzt habt, seid ihr jetzt attraktiv als Übernahme-Ziel für die KI-Engine."

---

#### Antwort A: „Kaufangebot ablehnen, weiter APIs bauen"
- **Text:** Ihr lehnt den Kaufangebot ab und konzentriert euch auf noch bessere API-Anbindungen — so bleibt ihr flexibel und unabhängig.
- **Punkte:** 14
- **Effekte:** growth: +6, innovation: +8, community: 0, impact: +2
- **Begründung:** API-Strategie geht auf, Growth durch mehr Integration, Innovation durch Fokus, Impact durch Flexibilität für mehr Kunden.

#### Antwort B: „Selektiv: Engine lizenzieren, aber API-Geschäft behalten"
- **Text:** Ihr lizenziert die KI-Engine dem großen Konzern exklusiv für seine Branche, bahrtet aber die API-Integrations-Strategie parallel. Zwei Revenue-Streams.
- **Punkte:** 18
- **Effekte:** growth: +10, innovation: +4, community: -2, impact: 0
- **Begründung:** Growth durch Lizenz + API, aber Community leidet (Fokus spaltet sich). Mittlerweile riskant.

#### Antwort C: „Den Konzern akquirieren und in die Engine investieren"
- **Text:** Ihr verkauft die API-Integrations-Sparte und konzentriert euch komplett auf die eigenentwickelte KI-Engine — größere Margen, weniger Abhängigkeit von Plattformen.
- **Punkte:** 10
- **Effekte:** growth: +2, innovation: +12, community: -6, impact: +4
- **Begründung:** Innovation hoch (Eigenmodell), aber Community leidet (weniger Flexibilität für Partner). Growth ungenau (Fokus riskant).

---

### Szenario B: `p5-investor` — Der VC will euch schlucken

**Frage-ID:** `p5-investor`  
**Phase:** `5`  
**Titel:** Übernahmeangebot vom großen VC?  
**Situation:** Ein etablierter VC-Investor, der früh bei euch eingestiegen ist, macht ein formales Übernahmeangebot. Die Summe ist attraktiv (Gründer bekämen mehrstellige Millionen), aber ihr müsst eure Unabhängigkeit aufgeben. Parallel habt ihr gerade Profitabilität erreicht — ihr könnt auch bootstrappen.

**braucht_marker:** `funding:investor`  
**bezug:** „Weil ihr auf VC-Finanzierung gesetzt habt, habt ihr einen gut ausgestatteten Investor, der euch jetzt kaufen will."

---

#### Antwort A: „Übernahme akzeptieren und die Auszahlung sichern"
- **Text:** Ihr nehmt das Angebot an und gründet unter der Dachorganisation weiter — mit mehr Budget und Ressourcen, aber weniger Entscheidungsfreiheit.
- **Punkte:** 12
- **Effekte:** growth: +10, innovation: -6, community: -4, impact: +2
- **Begründung:** Growth durch Budget, aber Innovation sinkt (Unternehmensprozesse). Community-Vertrauen leidet.

#### Antwort B: „Ablehnen, aber Investor an Bord halten für nächste Runde"
- **Text:** Ihr lehnt ab, signalisiert dem Investor aber, dass ihr in 2 Jahren nochmal reden könnt — und arbeitet parallel an Profitabilität, um weniger abhängig zu sein.
- **Punkte:** 16
- **Effekte:** growth: +8, innovation: +6, community: +6, impact: +4
- **Begründung:** Balanciert — Growth durch Unabhängigkeit, Innovation durch Eigenständigkeit, Community vertraut der Strategie.

#### Antwort C: „Investor auszahlen und vollständig independent bootstrappen"
- **Text:** Ihr zahlt dem Investor seine Anteile zurück (mit Gewinn) und werdet 100 % unabhängig. Profitabilität ist eure neue Spielregel.
- **Punkte:** 8
- **Effekte:** growth: -4, innovation: +8, community: +10, impact: +6
- **Begründung:** Community+Impact hoch (Unabhängigkeit), Innovation hoch, aber Growth mittelfristig schwerer ohne VC-Netzwerk.

---

### Szenario C: `p5-datendeal` — Datenschutz vs. Umsatz-Chance

**Frage-ID:** `p5-datendeal`  
**Phase:** `5`  
**Titel:** Ein Großkunde will eure Trainings-Daten kaufen  
**Situation:** Der größte Kunde bietet eine 7-stellige Summe für exklusiven Zugriff auf Miras Trainings-Daten — um ein eigenes KI-Modell zu trainieren. Das ist lukrativ, aber ihr würdet sensible Geschäfts-Daten weitergeben und euer Wettbewerbsvorteil (die KI-Engine) wird fragil. Datenschutz-Anwälte warnen.

**braucht_marker:** `risiko:datendeal`  
**bezug:** „Weil ihr früh auf datengetriebene KI gesetzt habt, sitzt ihr jetzt auf wertvollen Trainings-Daten — und jeder will sie kaufen."

---

#### Antwort A: „Daten-Deal blockiert — nur API-Zugang anbieten"
- **Text:** Ihr lehnt ab und bietet stattdessen erweiterte API-Zugriffe und Custom-Training-Services an — Geld ohne den eigenen Wettbewerb zu gefährden.
- **Punkte:** 16
- **Effekte:** growth: +6, innovation: +8, community: +8, impact: +6
- **Begründung:** Saubere Lösung, Innovation bewahrt, Community vertraut, Impact positiv.

#### Antwort B: „Anonymisierte Daten verkaufen, echte Trainings-Daten behalten"
- **Text:** Ihr verkauft anonymisierte, aggregierte Daten-Insights statt der rohén Trainings-Daten — verdient Geld, gebt aber kein Know-How preis.
- **Punkte:** 14
- **Effekte:** growth: +8, innovation: +4, community: +2, impact: 0
- **Begründung:** Realistischer Kompromiss, Growth gut, aber etwas ethisch grenzwertig.

#### Antwort C: „Ja zum Daten-Deal — schnelle Kohle, Risk Management später"
- **Text:** Ihr verkauft den exklusiven Zugang zu Trainings-Daten und kasst die 7-stellige Summe — und hoffen, dass die Konkurrenz nicht zu schnell folgt.
- **Punkte:** -6
- **Effekte:** growth: +8, innovation: -12, community: -10, impact: -4
- **Begründung:** Kurzfristige Gewinne, aber langfristig fatale Wettbewerbs-Erosion und Vertrauensverlust.

---

## 3. Marker-Mapping für TSV-Eingabe (S4)

### Bestehende P5-Fragen mit braucht_marker

```
frage_id	braucht_marker	bezug
p5-keycustomer	ziel:enterprise	Weil ihr euch früh auf Enterprise fokussiert habt, steht dieser Großkunde jetzt mit Exklusivitäts-Forderung am Tisch.
p5-crisis	(leer)	(leer)
p5-burnout	tempo:hoch	Euer hohes Tempo zahlt sich aus — aber das Team steht jetzt am Rand des Burnout.
p5-incumbent-copy	tech:api	Weil ihr auf API-Integration gesetzt habt, gibt es jetzt einen Integrations-Wettbewerb.
```

### Neue P5-Fragen (zur TSV hinzufügen)

```
p5-eigenmodell	tech:eigenmodell	Weil ihr früh auf Eigenentwicklung statt nur Integration gesetzt habt, seid ihr jetzt attraktiv als Übernahme-Ziel für die KI-Engine.
p5-investor	funding:investor	Weil ihr auf VC-Finanzierung gesetzt habt, habt ihr einen gut ausgestatteten Investor, der euch jetzt kaufen will.
p5-datendeal	risiko:datendeal	Weil ihr früh auf datengetriebene KI gesetzt habt, sitzt ihr jetzt auf wertvollen Trainings-Daten — und jeder will sie kaufen.
```

### Nicht neu hinzufügen (noch markerlos oder bereits sekundär):

- `funding:bootstrap` — könnte Antwort-Variante bei `p5-investor` abdecken (Antwort C), aber kein separates Szenario nötig
- `abhaengigkeit:marketplace` — könnte sekundär zu `p5-incumbent-copy` (als `braucht_marker` für spätere Echo-Events) genutzt werden, nicht als P5-Bindung

---

## 4. Zusammenfassung für S4-Umsetzung

| Schritt | Aktion | Details |
|---|---|---|
| 1. Bestehende P5 mit Markern versehen | `fragen.tsv` + `antworten.tsv` editieren | Spalten `braucht_marker` + `bezug` hinzufügen; bestehende 4 Fragen mappent |
| 2. Neue P5-Szenarien hinzufügen | `fragen.tsv` → 3 neue Zeilen + `antworten.tsv` → 9 neue Zeilen | `p5-eigenmodell`, `p5-investor`, `p5-datendeal` (jeweils 3 Antworten) |
| 3. Marker-Registry updaten | `content/marker.tsv` + `setzt_marker` in Antworten | `tech:eigenmodell`, `funding:investor`, `risiko:datendeal` neu; andere schon vorhanden |
| 4. Validator-Check | `scripts/generate-content.mjs` | Pro Phase ≥1 markerlose Fallback-Frage (P5 erfüllt mit `p5-crisis`) |
| 5. DoD | Lauf mit Marker x → P5 mit `braucht_marker:x` + Bezug-Satz anmoderation | Test mind. 2 Läufe: (a) `ziel:enterprise` → `p5-keycustomer`, (b) `tech:eigenmodell` → `p5-eigenmodell` |

