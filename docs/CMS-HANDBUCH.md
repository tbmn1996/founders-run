# Founder's Run — CMS-Handbuch

Schritt-für-Schritt-Anleitung für den gesamten Prozess: Inhalt ändern → testen → deployen.

Für Spalten-Definitionen, Regeln und Fehlermeldungen: **`content/README.md`**.

---

## Wie das System funktioniert

```
content/*.tsv           ← hier arbeitest du
       ↓
scripts/generate-content.mjs  ← läuft automatisch vor dev/build/lint
       ↓
src/lib/gameContent.generated.ts  ← autogeneriert, nie anfassen
       ↓
Spiel im Browser / auf Vercel
```

Das Build-Skript **validiert** alle TSV-Dateien beim Start. Fehlerhafte Inhalte brechen den Build mit einer deutschen Meldung ab (Datei + Zeilennummer) — sie gehen **nie live**.

---

## Weg 1 — Schnell-Edit im Browser (kein Code nötig)

Für Textänderungen, neue Szenarien oder Event-Anpassungen ohne lokale Einrichtung.

1. Öffne das Repo auf **github.com/tbmn1996/founders-run**
2. Navigiere nach `startup-simulation/content/`
3. Wähle die Datei (z. B. `fragen.tsv`)
4. Klicke das **Stift-Symbol** (Edit this file)
5. Nehme die Änderung vor
6. Scrolle nach unten → kurze Beschreibung eintragen → **Commit changes**
7. Vercel deployt automatisch — dauert ca. 1–2 Minuten

**Deploy-Status prüfen:** github.com/tbmn1996/founders-run → Reiter **Actions** → grüner Haken = live

---

## Weg 2 — Lokal entwickeln und testen

Für größere Änderungen, bei denen du das Ergebnis erst im Browser prüfen willst, bevor es live geht.

### Einmalige Einrichtung

```bash
# Node.js ≥ 20 nötig: https://nodejs.org

git clone https://github.com/tbmn1996/founders-run.git
cd founders-run/startup-simulation
npm install
```

### Workflow

```bash
# 1. Dev-Server starten (läuft generate-content.mjs automatisch vorher)
npm run dev
# → http://localhost:3000

# 2. TSV-Datei bearbeiten (content/*.tsv)
# → Dev-Server neu starten nach jeder TSV-Änderung (Ctrl+C, dann npm run dev)
#    TSV-Inhalte werden nur beim Start eingelesen, nicht live-aktualisiert.

# 3. Spiel im Browser durchspielen, Änderung prüfen

# 4. Build testen (wie Vercel es später macht)
npm run build
# → Bei Fehlern: deutsche Meldung mit Datei + Zeilennummer

# 5. Änderungen pushen → Vercel deployt automatisch
git add content/
git commit -m "kurze Beschreibung der Änderung"
git push
```

---

## Deploy und Live-Check

Jeder Push auf `main` löst automatisch einen Vercel-Deploy aus.

| Schritt | Wo prüfen |
|---|---|
| Build läuft? | github.com/tbmn1996/founders-run → Actions |
| Spiel live? | https://founders-run-sepia.vercel.app |
| Deploy-Details / Fehlerlog | vercel.com → Projekt founders-run → Deployments |

**Typische Deploy-Dauer:** 1–3 Minuten nach dem Push.

Wenn der Build rot ist, hat das Validierungs-Skript einen Fehler in den TSV-Dateien gefunden. Im Vercel-Deployment-Log (oder GitHub Actions) steht die genaue Fehlermeldung mit Datei und Zeilennummer.

---

## Mehrere Personen bearbeiten gleichzeitig

- Jede Person committed direkt auf `main` über den GitHub-Web-Editor → kein Merge-Konflikt so lange verschiedene Dateien oder Zeilen bearbeitet werden.
- Bei gleichzeitiger Bearbeitung **derselben Datei**: GitHub zeigt beim zweiten Commit einen Konflikt an. Lösung: die aktuellste Version laden, Änderung erneut eintragen, committen.
- Empfehlung für koordiniertes Arbeiten: kurz absprechen, wer gerade welche TSV-Datei bearbeitet.

---

## Notfall: Fehler live geschaltet

Falls eine fehlerhafte Änderung es trotzdem live schafft (z. B. der Build hat bestanden, aber das Spiel verhält sich falsch):

```bash
# Letzten Commit rückgängig machen und sofort deployen
git revert HEAD
git push
# → Vercel deployt die rückgängig gemachte Version
```

Alternativ im GitHub-Web-Editor: die betroffene TSV-Datei direkt auf den vorherigen Stand zurücksetzen (History → Revert).

---

## Schnell-Referenz

| Ziel | Aktion |
|---|---|
| Text ändern | GitHub Web-Editor → Stift → Commit |
| Neue Frage | `fragen.tsv` + 3 Zeilen `antworten.tsv` → Commit |
| Lokal testen | `npm run dev`, Browser, Server neu starten nach TSV-Änderung |
| Build prüfen | `npm run build` |
| Deploy auslösen | `git push` auf `main` |
| Deploy-Status | GitHub Actions oder Vercel Dashboard |
| Spalten-Spezifikation | `content/README.md` |
| Fehler verstehen | Build-Log lesen (Datei + Zeilennummer) |
