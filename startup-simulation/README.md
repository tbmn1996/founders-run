# Founder's Run — VCM Startup-Simulation

Eine kleine Startup-Simulation für den Infostand des **Venture Club Münster** auf
der **Startup Contacts**. Standalone-Web-App im Aura-Design, gedacht zum Öffnen
aus der Founders-Map-App heraus (Stationstyp **Playground → Gamification**).

Ein Durchlauf dauert ~3 Minuten: Szenario → 5 Runden mit Trade-off-Entscheidungen
(plus 2 Glücks-Events) → Founder-Typ + Punkte → Rückblick mit Alternativen →
Abschlussfolie für den Verein.

**Live:** https://founders-run-sepia.vercel.app

---

## Mitmachen

Es gibt **zwei Wege**, zum Projekt beizutragen — je nachdem, ob du Code schreiben
kannst oder nicht:

### Weg 1 — Nur Spielinhalte ändern (kein Code nötig)

Alle Texte, Fragen, Antworten und Events stehen als einfache Tabellen-Dateien in
`content/`. Du kannst sie direkt im **GitHub-Webeditor** bearbeiten:

1. Öffne die Datei auf github.com (z. B. `content/fragen.tsv`).
2. Klicke auf das **Stift-Symbol** (Edit this file).
3. Ändere den Inhalt.
4. Scrolle nach unten, schreibe eine kurze Beschreibung, klicke **Commit changes**.
5. Fertig — Vercel deployt automatisch nach wenigen Minuten.

Die genaue Anleitung zu Spalten, Regeln und Fehlern: **`content/README.md`**.

### Weg 2 — Code weiterentwickeln (lokale Einrichtung)

> Voraussetzung: **Node.js ≥ 20** — Installationsanleitung: https://nodejs.org

```bash
# 1. Repo klonen (einmalig)
git clone https://github.com/tbmn1996/founders-run.git
cd founders-run/startup-simulation

# 2. Abhängigkeiten installieren (einmalig, ~30 Sekunden)
npm install

# 3. Dev-Server starten
npm run dev      # → http://localhost:3000
                 # Im selben WLAN auch vom Handy erreichbar (Netzwerk-IP)

# 4. Vor dem Pushen: Build und TypeScript prüfen
npm run build
npm run lint
```

Keine `.env`-Datei nötig — die App hat kein Backend und keine Secrets.

## Projektstruktur

```
content/              ← Spielinhalte als TSV-Tabellen (kein Code-Wissen nötig)
│  ├─ fragen.tsv         Entscheidungs-Szenarien (20 Fragen, 5 Phasen)
│  ├─ antworten.tsv      3 Antworten pro Frage + Effekte auf Säulen
│  ├─ events.tsv         Glücks-/Markt-Events
│  ├─ gruendertypen.tsv  5 Gründer-Profile für das Ergebnis
│  ├─ texte.tsv          Intro-, Phasen- und UI-Texte
│  └─ README.md          Anleitung für Inhaltspflege

scripts/
│  └─ generate-content.mjs   Generiert gameContent.generated.ts aus den TSVs

src/
├─ app/
│  ├─ globals.css   Aura-v2-Design-Tokens (Referenz: docs/DESIGN_SYSTEM.md)
│  ├─ layout.tsx    Dark-Mode, Meta
│  └─ page.tsx      Spiel-Ablauf: Intro · Runden · Ergebnis · Rückblick · Closing
├─ components/
│  └─ StatBar.tsx   Werte-Anzeige (Growth/Innovation/Community/Impact/Geld)
└─ lib/
   ├─ gameData.ts              Typen, Mechanik-Konstanten; re-exportiert generierte Inhalte
   ├─ gameLogic.ts             Zufallsauswahl, Scoring, Founder-Typ-Berechnung
   └─ gameContent.generated.ts Auto-generiert aus TSVs — nie manuell bearbeiten
```

**Inhalte pflegen:** ausschließlich über `content/*.tsv`. Das Build-Skript läuft
automatisch vor `dev`, `build` und `lint`. Kaputte Inhalte brechen den Build mit
einer Fehlermeldung ab und gehen nie live.

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
