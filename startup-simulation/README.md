# Founder's Run — VCM Startup-Simulation

Eine kleine Startup-Simulation für den Infostand des **Venture Club Münster** auf
der **Startup Contacts**. Standalone-Web-App im Aura-Design, gedacht zum Öffnen
aus der Founders-Map-App heraus (Stationstyp **Playground → Gamification**).

Ein Durchlauf dauert ~3 Minuten: Szenario → 5 Runden mit Trade-off-Entscheidungen
(plus 2 Glücks-Events) → Founder-Typ + Punkte → Rückblick mit Alternativen →
Abschlussfolie für den Verein.

## Starten

> Voraussetzung: **Node.js ≥ 20**.

```bash
cd startup-simulation
npm install
npm run dev      # → http://localhost:3000
npm run lint     # TypeScript-Check
```

Produktion:

```bash
npm run build && npm run start
```

## Projektstruktur

```
src/
├─ app/
│  ├─ globals.css   # Aura-v2-Design-Tokens (1:1 aus DESIGN_SYSTEM.md)
│  ├─ layout.tsx    # Dark-Mode, Meta
│  └─ page.tsx      # Spiel-Ablauf: Intro · Runden · Ergebnis · Rückblick · Closing
├─ components/
│  └─ StatBar.tsx   # Werte-Anzeige (Growth/Innovation/Community/Impact/Geld)
└─ lib/
   ├─ gameData.ts   # ALLE Inhalte: Szenario, Fragen, Events, Founder-Typen
   └─ gameLogic.ts  # Zufallsauswahl, Scoring, Founder-Typ-Berechnung
```

**Fragen pflegen:** ausschließlich in `src/lib/gameData.ts`. Pro Phase ≥ 2
Szenarien im Pool → das Spiel zieht je Durchlauf eines zufällig. Mehr Szenarien
hinzufügen = mehr Abwechslung, kein Code-Eingriff nötig.

## Integration in die Founders Map

Die Simulation läuft **außerhalb** der Haupt-App (eigene URL hinter dem QR-Code),
damit die App nicht belastet wird. Vorgesehene Anbindung:

1. **Start:** Die App öffnet `https://<sim-url>/?uid=<userId>&sig=<token>`
   (User-Token als Query-Param, damit das Ergebnis zugeordnet werden kann).
2. **Ergebnis zurückgeben** — eine der beiden Varianten:
   - **Redirect:** am Ende zurück zur App mit
     `?score=<n>&type=<founderType>` (einfachste Variante).
   - **postMessage:** wenn die Sim in einem WebView/iframe der App läuft:
     `window.parent.postMessage({ type: "vcm-sim-result", score, founderType }, "*")`.
3. **Scoreboard:** Die App schreibt `score` in das Founders-Map-Punktekonto
   (Station „Playground"). Die Sim selbst speichert nichts.

> Die Hooks dafür sind in `page.tsx` an einer Stelle gebündelt (Funktion
> `Result`) und noch nicht aktiv — sie werden gesetzt, sobald das App-Team das
> konkrete Rückgabe-Format festlegt.

## Design

Voll im Aura-v2-System: Dark-Mode, klare System-Sans-Typografie, warme Orange→Rot-Akzente
(`#f76c07 → #fe281f`), `#141414`-Hintergrund mit dezentem Glow, weiche Schatten,
runde Karten (16/20/24 px), ease-out-expo-Bewegungen. Tokens in `globals.css`.
