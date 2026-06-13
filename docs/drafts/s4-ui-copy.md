# Echo-Feature UI-Copy | Founders Run

## Überblick
Dieses Dokument sammelt UI-Copy-Varianten für das Echo-Feature: Das Spiel zeigt den Spielern sichtbar, wie frühere Entscheidungen zu neuen Ereignissen führen.

---

## 1. Echo-Badge-Text (Event-Karte)
Kurzes Label auf der Eventkarte, das signalisiert: "Das ist eine Reaktion auf eure frühere Entscheidung."

**Kontext:** Neben/über dem Event-Title; 2–4 Worte; "ihr"-Ansprache.

### Variante 1
```
Folge eurer Entscheidung
```
*Wirkung:* Direkt, kausal, klar. Sehr knapp.

### Variante 2
```
Das habt ihr ausgelöst
```
*Wirkung:* Persönlich, Verantwortung und Macht. Unmittelbar.

### Variante 3
```
Euer Plan trägt Früchte
```
*Wirkung:* Positiv wertend, strategisch, Langzeit-Perspektive. Weniger neutral.

---

## 2. Anmoderations-Template „Weil ihr ..."
Satzanfang, der vor dem Eventtext steht. Die konkrete Aktion kommt pro Event aus dem Content dazu.

**Kontext:** Oben auf der Event-Karte, über `{event.text}`. Template-Variable wird konkret gefüllt, z.B.: "Weil ihr den Vertrieb priorisiert habt, merkt ein Großkunde eure Qualität..."

### Variante 1
```
Weil ihr [entscheidung], passiert jetzt folgendes:
```
*Wirkung:* Direkt, kausal, erklärt den Nexus. Punkt-auf, dann Event-Details.

### Variante 2
```
Euer Fokus auf [entscheidung] zahlt sich jetzt aus:
```
*Wirkung:* Positiv, erfolgsorientiert. Impliziert, dass die Entscheidung sinnvoll war (nicht neutral).

---

## 3. Recap-Kausalzeile
Im Abschlussbildschirm (Recap-Sektion "Deine Entscheidungen im Rückblick"). Eine Zeile pro Entscheidungsrunde, die Folge zeigt: "Ihr habt X gewählt > Y ist passiert."

**Kontext:** Im `RecapItem`-Komponenten-Block; maximal 1 Zeile; sehr kurz und prägnant.

### Variante 1
```
[Eure Wahl] > dann [Auswirkung]
```
*Format:* "CRM priorisiert" > "KI-Reifegrad steigt".  
*Wirkung:* Grafisch klar, Pfeil zeigt Fluss.

### Variante 2
```
[Eure Wahl] führte zu [Auswirkung]
```
*Format:* "CRM priorisiert" führte zu "KI-Reifegrad +3".  
*Wirkung:* Sprachlich, kausal-grammatikalisch, weniger Piktogramm nötig.

### Variante 3
```
Das hat geklappt: [Eure Wahl] > [Auswirkung]
```
*Format:* "Das hat geklappt: Selbstbedienung statt Team-Blocker > Velocity x2".  
*Wirkung:* Bestätigend, Erfolgsfokus, etwas länger, aber emotional.

---

## 4. Phase-5-Anmoderation
Speziell für das Finale (Phase 5): Eine Zeile, die markiert, dass das P5-Ereignis oder -Szenario auf eine frühere Entscheidung Bezug nimmt.

**Kontext:** Im `DecisionCard` oder Event-Kontext bei Phase 5; sehr kurz; "ihr"-Ansprache.

### Variante 1
```
Jetzt wird es ernst: Euer Plan wird getestet.
```
*Wirkung:* Direkt, Hochspannung, Moment-Markierung. Kann generisch oder spezifisch pro Event sein.

### Variante 2
```
Euer Startup steht unter Druck — so zeigt sich eure Strategie.
```
*Wirkung:* Konkreter, Strategie-Nexus zu früheren Choices, erzeugt Spannung.

---

## 5. Konvention für texte.tsv

### Struktur
```
bereich	schluessel	wert
echo	badge_1	Folge eurer Entscheidung
echo	badge_2	Das habt ihr ausgelöst
echo	badge_3	Euer Plan trägt Früchte
echo	preamble_1	Weil ihr [entscheidung], passiert jetzt folgendes:
echo	preamble_2	Euer Fokus auf [entscheidung] zahlt sich jetzt aus:
echo	recap_1	[Eure Wahl] > dann [Auswirkung]
echo	recap_2	[Eure Wahl] führte zu [Auswirkung]
echo	recap_3	Das hat geklappt: [Eure Wahl] > [Auswirkung]
phase5	preamble_1	Jetzt wird es ernst: Euer Plan wird getestet.
phase5	preamble_2	Euer Startup steht unter Druck — so zeigt sich eure Strategie.
```

### Begründung
- **bereich="echo"**: Alle generischen Echo-Texte (Badge, Preamble, Recap) sind Feature-übergreifend und nicht an einzelne Events gebunden.
- **bereich="phase5"**: P5-spezifische Anmoderation gehört zur Phase (nicht zu generischem Echo-Feature), damit sie nicht versehentlich in anderen Phasen auftaucht.
- **schluessel**: Numerierte Varianten (`badge_1`, `badge_2`, etc.) erlauben dem Code, flexibel zwischen Varianten zu wechseln (z.B. via Zufallsauswahl pro Spiel oder pro Spieler-Typ).

---

## Design-Notizen

1. **Keine Em-Dashes** (—) in den Texten → UTF-8 clean, keine KI-Artefakte.
2. **"Ihr"-Ansprache** durchgehend (nicht "Sie", nicht "wir").
3. **Keine Füllwörter**: "Folge eurer Entscheidung" nicht "Interessanterweise ist dies eine direkte Folge...".
4. **Kurz halten**: Badges 2–4 Worte, Preambles 1 Satz mit Template-Platzhalter, Recap maximal 1 Zeile.
5. **Ton**: Spielerisch-direkt, Erfolgsfokus, Verantwortung betonen (Spieler sieht, dass ihre Choices zählen).

---

## Nächste Schritte
1. `texte.tsv` um obige Zeilen erweitern.
2. Code-Integration: Event-Komponente liest `echo/badge_*` und zeigt random oder sequenziell.
3. Preamble-Template auflösen: Code trägt `[entscheidung]` ein (z.B. aus `DecisionRecord.scenario.title`).
4. Recap-Items: Zeile per `RecapItem` rendern, Template mit Wahl + Effekt-Summary füllen.
5. P5-Anmoderation in Szenario-Logik für Phase 5 conditional einflechten.
