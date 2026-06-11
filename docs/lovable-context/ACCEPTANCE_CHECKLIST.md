# Acceptance Checklist - Founder's Run in Lovable

## Kernflow

1. Die App startet direkt mit dem Intro zu `Loop`.
2. Ein Durchlauf hat genau 5 Entscheidungen und 2 Glücks-Events.
3. Glücks-Events erscheinen nach Phase 2 und nach Phase 4.
4. Nach jeder Entscheidung sieht man sofort Punkte, Konsequenz und Stat-Effekte.
5. Am Ende erscheinen Score, Founder-Typ, finale Werte, Rückblick und Closing.

## Spielmechanik

1. Pro Phase wird zufällig genau ein Szenario aus dem Pool gezogen.
2. Optionen werden pro Szenario zufällig gemischt.
3. Jede Option verändert mehrere Werte und enthält echte Trade-offs.
4. Negative Punkte sind möglich.
5. Cash/Runway und Säulenwerte fallen nie unter 0.
6. Gesamtscore entspricht:
   `decisionPoints + (growth + innovation + community + impact) / 2 + runwayBonus`
7. `runwayBonus` ist `cash / 5`, gerundet, oder `-30`, wenn Cash 0 ist.
8. Founder-Typ wird aus der stärksten Säule bestimmt.
9. Bei sehr ausgeglichenen Werten, maximale Säule minus minimale Säule <= 8,
   erscheint `Der/die Allrounder:in`.

## Rückblick

1. Der Rückblick enthält alle 5 Entscheidungen.
2. Jede Entscheidung ist aufklappbar.
3. Zu jeder Entscheidung stehen die gewählte Option, deren Punkte und Konsequenz.
4. Die zwei nicht gewählten Alternativen werden mit Punkten und Konsequenz gezeigt.

## Standalone und Integration

1. Kein Login.
2. Keine Datenbank.
3. Keine lokale Persistenz für Scoreboard oder User-Daten.
4. Query-Parameter wie `?uid=...` dürfen gelesen, aber nicht benötigt werden.
5. Ergebnis-Rückgabe per Redirect oder `postMessage` ist nur als vorbereiteter,
   deaktivierter Hook vorhanden.

## Mobile UX

1. Primäres Layout ist Smartphone-Hochformat.
2. Buttons haben mindestens 44 px Touch-Fläche.
3. Keine horizontalen Scrollbars.
4. Der erste Screen zeigt sofort Spielstart und Szenario, keine Landingpage.
5. Auf kleinen Displays bleiben CTA, Optionen und Feedback lesbar.

## Design

1. Dark Mode ist Standard.
2. Hintergrund `#141414`, warme Orange/Rot-Akzente.
3. Karten wirken wie Aura-v2: dunkle Flächen, weiche Schatten, 16/20/24 px Radien.
4. Typografie: Plus Jakarta Sans oder sehr ähnlicher Sans-Serif-Fallback.
5. Motion ist weich und kurz, keine übertriebenen Animationen.

## Build-Qualität

1. TypeScript ohne offensichtliche Typfehler.
2. Keine toten Platzhalter-Screens.
3. Keine Beispieltexte außerhalb des VCM/Loop-Kontexts.
4. Keine Backend- oder Supabase-Abhängigkeit, solange nicht ausdrücklich verlangt.
