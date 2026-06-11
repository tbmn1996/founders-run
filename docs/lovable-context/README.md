# Lovable-Kontextpaket - Founder's Run

Dieses Paket ist für die Umsetzung der VCM Startup-Simulation in Lovable gedacht.
Es ist bewusst als Handoff-Paket formuliert, nicht als Änderung an der lokalen
Next.js-App.

## Dateien

1. `LOVABLE_PROMPT.md`  
   Der vollständige Erstprompt für Lovable. Er ist so geschrieben, dass Lovable
   daraus eine komplette mobile Web-App bauen kann.

2. `ASSET_MANIFEST.md`  
   Hinweise zu Logos und Bildmaterial, falls Assets in Lovable hochgeladen
   werden sollen.

3. `ACCEPTANCE_CHECKLIST.md`  
   Prüfliste für die finale Abnahme in Lovable.

## Empfohlener Ablauf in Lovable

1. Neues Lovable-Projekt erstellen.
2. Den kompletten Inhalt aus `LOVABLE_PROMPT.md` als ersten Prompt einfügen.
3. Falls Lovable Uploads unterstützt: die Logos aus `assets/Logo SC/` hochladen.
4. Nach dem ersten Build anhand von `ACCEPTANCE_CHECKLIST.md` testen.
5. Nur gezielt nachsteuern, zum Beispiel: "Der Rückblick zeigt die Alternativen
   noch nicht vollständig" oder "Bitte die Stat-Trade-offs stärker sichtbar
   machen".

## Wichtige Produktentscheidung

Die Simulation soll in Lovable weiterhin als eigenständige App umgesetzt werden:
keine Authentifizierung, keine Datenbank, kein Scoreboard, keine harte Kopplung
an die Founders-Map-App. Die spätere Rückgabe an die Founders Map bleibt nur als
vorbereiteter, inaktiver Hook im Ergebnis-Screen vorgesehen.
