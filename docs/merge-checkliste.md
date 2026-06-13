# Founder's Run — Merge-Checkliste (more-consequence → main)

Alle Punkte müssen vor dem Merge-Commit erledigt oder explizit als „nicht zutreffend" markiert sein. Keine Punkte überspringen.

---

## (a) Vor dem Merge

### Automatisierte Prüfungen

- [x] `npx tsc --noEmit` aus `startup-simulation/` → **0 Fehler** _(2026-06-13)_
- [x] `npm run build` aus `startup-simulation/` → **fehlerfrei** (✓ Compiled successfully; bricht auch bei ungültigem TSV ab) _(2026-06-13)_
- [x] `node scripts/check-determinism.mjs` → **grün**: 18/18 Checks (RNG-Stabilität, Echo/P5, Back-Semantik, Krise, Dominanzformel, `cash:discipline`, +12 weg) _(2026-06-13)_
- [x] `node scripts/simulate.mjs` (2000 Läufe) → **alle Invarianten bestanden, Exit 0**. Statistik: Krisenquote 30,4 %, Echo-Quote 70,9 %, Marker-P5 43,3 %, Pleitequote 7,5 %, Score 24/129/214 _(2026-06-13)_
  - Spiel terminiert immer (kein Endlos-Loop)
  - `slots.length ≤ 9` in jedem Lauf
  - Nie 0 wählbare Optionen in einem Schritt
  - Echo-Slot immer auflösbar (Fallback greift)
  - Maximal 1 Krise pro Lauf

### Manuelle Browser- und Mobile-Checks

> Belege 2026-06-13 via Playwright gegen `npm run dev` (localhost:3000). **0 Console-Errors, 0 Warnings** über alle Läufe.

- [x] **Browser-Smoke** (Desktop 1280×800): Start-Button zentriert (x=640 = Viewport-Mitte), Content-Spalte 448 px mittig (mobile-first beibehalten); 1 kompletter Durchlauf bis Result, keine Konsolfehler.
- [x] **Mobile-Check** (Viewport 390×844): UI korrekt im Hochformat, Karten lesbar, Slider per Wert-Event bedienbar, 2 vollständige Durchläufe.
- [x] **3 Stoppuhr-Playthroughs** — automatisierte UI-Fluss-Dauer je 13–15 s (reine Klickzeit ohne Lesen; geschätzte menschliche Spielzeit ~2,5–3,5 Min, klar < 4 Min):
  - [x] **Pleite-Pfad** (Desktop, viel investiert): Cash-Band fiel auf **KRITISCH €3.000**, Krisen-Slot „BEINAHE-PLEITE · RUNWAY-KRISE" erschien und steht als eigenes Recap-Kapitel; Founder „Hustler:in", 141 Pkt.
  - [x] **Enterprise-/API-Pfad**: Echo-Anmoderation „Folge eurer Entscheidung" + „Weil ihr…" live während des Laufs; aufgeklapptes Phase-5-Kapitel zeigt Kausalzeile „Weil ihr auf die KI-API einge[stiegen seid]…" (`tech:api` → P5-Echo) inkl. Alternative.
  - [x] **Sparsam-Pfad mit Rücklage** (Mobile, nichts investiert): **keine Krise**, Geld **SOLIDE**, Rücklage/`cash:discipline` im Recap sichtbar, Alloc-Zeile vorhanden; Founder „Hustler:in", 128 Pkt. (Variante mit Teilinvest: „Connector:in", 104 Pkt, Geld angespannt, Krise.)

### Diff-Review

- [ ] Diff `main..more-consequence` überflogen — keine unbeabsichtigten Änderungen, keine Debug-Logs, keine auskommentierten Blöcke
- [ ] `gameContent.generated.ts` ist in `.gitignore` und **nicht** im Diff
- [ ] Keine neuen Dependencies in `package.json`

### Freigabe

- [ ] **Explizite Freigabe von Thomas** für den Merge eingeholt

---

## (b) Merge und Deploy

```bash
# 1. Aktuelles Production-Deployment in Vercel notieren (Rollback-Ziel)
#    → Vercel Dashboard → Deployments → oberste "Production"-Zeile → Deployment-URL kopieren

# 2. Merge auf main (regulärer Merge-Commit — kein Squash)
git checkout main
git pull
git merge more-consequence
git push

# 3. Deploy via Vercel (aus startup-simulation/)
cd startup-simulation
npx vercel --prod
```

**Wichtig:** Kein `--squash`, kein `--ff-only` — der Merge-Commit soll als Rollback-Ziel erkennbar bleiben.

---

## (c) Rollback (nur bei scheiterndem Live-Smoke)

**Option 1 — Vercel Instant Rollback (bevorzugt, schneller):**
1. Vercel Dashboard → Deployments → das notierte Production-Deployment vor dem Merge auswählen
2. „Promote to Production" klicken → sofort live, kein Git-Eingriff nötig

**Option 2 — Git Revert + Redeploy:**
```bash
# Auf main, <merge-sha> = SHA des soeben erstellten Merge-Commits
git revert -m 1 <merge-sha>
git push
# Vercel deployt automatisch nach dem Push
```

Danach `more-consequence` weiterentwickeln und erneut die vollständige Checkliste durchlaufen.

---

## (d) Live-Smoke nach Deploy

> **Pflichthinweis:** `*.vercel.app` ist im Uni-Netz (Eduroam) geblockt. Live-Smoke **ausschließlich über Mobilfunk** (kein WLAN) durchführen.

- [ ] https://founders-run-sepia.vercel.app über Mobilfunk öffnen — Seite lädt fehlerfrei
- [ ] 1 kompletter Durchlauf im Smartphone-Browser: Intro → alle Schritte → Ergebnis-Screen
- [ ] **Teilen-Button** (`navigator.share`) funktioniert und öffnet den nativen Share-Dialog
- [ ] **QR-Code-Start** testen: QR-Code scannen → Simulation startet korrekt
- [ ] Keine Konsolfehler (Browser-DevTools auf Smartphone oder Remote-Debug)
