# SC-PWA — Design System "Aura" v2

> **Charakter:** Clean · Spacious · Soft depth · Warm accents
> Dunkles, modernes PWA-Interface mit warmen Orange/Rot-Akzenten (Startup-Contacts-CI), weichen Schatten, abgerundeten Karten und flüssigen Bewegungen. Dark-Mode ist Standard, Light-Mode per Klasse.

Diese Datei beschreibt das Design vollständig, sodass weiteres Material (Slides, Grafiken, neue Screens, Print) im gleichen Look erstellt werden kann. Alle Werte sind 1:1 aus [src/app/globals.css](src/app/globals.css) und [src/app/layout.tsx](src/app/layout.tsx).

---

## 1. Farben

### Marke / CI (in beiden Modi gleich)
| Token | Hex | Verwendung |
|---|---|---|
| `--ci-orange` | `#f76c07` | Primäre Markenfarbe, Gradient-Start, Akzent-Text |
| `--ci-red` | `#fe281f` | Gradient-Ende, sekundärer Markenakzent |
| `--bg-orange` | `#B5441A` | gedämpfter Orange-Hintergrund (Flächen) |
| `--bg-red` | `#8A3018` | gedämpfter Rot-Hintergrund (Flächen) |

### Akzent (UI-Interaktion, in beiden Modi gleich außer Hover)
| Token | Hex | Verwendung |
|---|---|---|
| `--accent` | `#FF5E00` | Haupt-Interaktionsfarbe (Focus, Links, aktive Glows) |
| `--accent-mid` | `#FF7A1A` | Gradient-Mittelton |
| `--accent-end` | `#FF9233` | Gradient-Hell |
| `--accent-hover` | dark `#FF7520` / light `#E55500` | Hover-Zustand |
| `--glow` | `#FF6A10` | Glow-/Schein-Effekte |

### Dark Mode (Standard — `:root`, `.dark`)
| Token | Hex / Wert |
|---|---|
| `--background` | `#141414` |
| `--background-raised` | `#1C1C1C` |
| `--foreground` | `#EDEBE8` (warmes Off-White) |
| `--foreground-pure` | `#F5F5F5` |
| `--surface-1` | `#1C1C1C` (Karte) |
| `--surface-2` | `#242424` (erhöhte Karte) |
| `--surface-3` | `#2C2C2C` (höchste Ebene) |
| `--highlight` | `#EDEBE8` (aktiver/selektierter Zustand → beige) |
| `--highlight-text` | `#1A1A1A` |
| `--muted` | `#888888` |
| `--border` | `rgba(255,255,255,0.07)` |
| `--border-subtle` | `rgba(255,255,255,0.04)` |
| `--input-bg` | `rgba(255,255,255,0.05)` |
| `--input-border` | `rgba(255,255,255,0.09)` |
| `--overlay` | `rgba(0,0,0,0.6)` |
| `--navbar-bg` | `rgba(20,20,20,0.88)` |

### Light Mode (`.light`)
| Token | Hex / Wert |
|---|---|
| `--background` | `#F5F5F5` |
| `--background-raised` | `#FFFFFF` |
| `--foreground` | `#1A1A1A` |
| `--foreground-pure` | `#111111` |
| `--surface-1` | `#FFFFFF` |
| `--surface-2` | `#F5F4F2` |
| `--surface-3` | `#ECEAE7` |
| `--highlight` | `#3A3A3A` (aktiv → dunkel) |
| `--highlight-text` | `#EDEBE8` |
| `--muted` | `#71717A` |
| `--border` | `rgba(0,0,0,0.06)` |
| `--overlay` | `rgba(0,0,0,0.3)` |
| `--navbar-bg` | `rgba(245,245,245,0.90)` |

### Semantische Status-Farben
| Status | Dark Text / BG | Light Text / BG |
|---|---|---|
| Success | `#4ade80` / `rgba(74,222,128,0.15)` | `#16a34a` / `rgba(22,163,74,0.12)` |
| Error | `#f87171` / `rgba(248,113,113,0.1)` | `#dc2626` / `rgba(220,38,38,0.1)` |
| Warning | `#fbbf24` / `rgba(251,191,36,0.15)` | `#d97706` / `rgba(217,119,6,0.12)` |
| Info | `#60a5fa` / `rgba(96,165,250,0.15)` | `#2563eb` / `rgba(37,99,235,0.12)` |

### Ticket-Karte (heller Container, beide Modi)
`--ticket-card` `#EDEBE8` (dark) / `#FFFFFF` (light) · `--ticket-text` `#4A4A4A` · `--ticket-muted` `#9A9A96`

---

## 2. Typografie

- **Font:** System-Sans-Stack (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`)
  - Bewusst ohne Google-Font-Build-Abhängigkeit, damit Builds auch in eingeschränkten Netzen stabil laufen.
- **Gewichte:** 300, 400, 500, 600, 700, 800
- **Global:** `letter-spacing: -0.01em`, `-webkit-font-smoothing: antialiased`

### Text-Stile (Klassen)
| Klasse | Größe | Gewicht | Tracking | Sonstiges |
|---|---|---|---|---|
| `.text-title` | — | 700 | `-0.03em` | Überschriften, `--foreground` |
| `.text-subtitle` | 12px | 500 | `0.06em` | UPPERCASE, `--muted` |
| `.section-label` | 12px | 600 | `0.08em` | UPPERCASE, `--muted` |
| `.text-primary` | — | — | — | `color: --foreground` |
| `.text-muted` | — | — | — | `color: --muted` |

### Gängige Größen (Tailwind, mobile-first)
`11px`, `12px`, `13px` für UI/Meta · `text-sm` (14) Body · `text-xs` (12) · Headers `24px` / `28px`. Titel mit negativem Tracking (`-0.03em`).

---

## 3. Form & Layout

| Token | Wert | Verwendung |
|---|---|---|
| `--radius-card` / `--card-radius` | `24px` | Haupt-Karten |
| `--radius-inner` | `16px` | innere Elemente, Buttons, Inputs |
| `--radius-pill` | `20px` | Pill-Formen, Bottom-Nav |
| `rounded-full` | 9999px | Avatare, Chips, Icon-Buttons |

- **Mobile-first PWA:** Inhalt auf `max-w-lg` begrenzt, mittig.
- **Breakpoints** (Tailwind default): `sm 640` · `md 768` · `lg 1024` · `xl 1280`.
- **Touch:** min. 44px Touch-Targets.
- **Safe areas:** `env(safe-area-inset-bottom)`; Standalone-PWA extra `padding-bottom: 25px`.
- **Spacing-Rhythmus:** gängig `gap-2/3/4`, `px-3/4`, `py-2/3`, `p-4`.

---

## 4. Schatten / Elevation

Weiche, niedrig-opake Schatten. Dark-Mode dunkler/stärker als Light.

| Token | Dark | Light |
|---|---|---|
| `--shadow-xs` | `0 1px 3px rgba(0,0,0,0.2)` | `0 1px 2px rgba(0,0,0,0.04)` |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.18)` | `0 2px 8px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 20px rgba(0,0,0,0.22)` | `0 4px 20px rgba(0,0,0,0.07)` |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.28)` | `0 8px 40px rgba(0,0,0,0.09)` |
| `--shadow-xl` | `0 20px 60px rgba(0,0,0,0.35)` | `0 20px 60px rgba(0,0,0,0.12)` |

Sticky-Header & Bottom-Nav: `backdrop-filter: blur(20px)` über halbtransparentem `--navbar-bg`.

---

## 5. Hintergrund-Effekte (Signatur-Look)

- **Grain-Overlay:** SVG-fractalNoise über gesamtem Viewport, `opacity: 0.03` — gibt Flächen subtile Textur.
- **Mesh-Gradient (`.bg-mesh`):** zwei fixierte radiale Orange-Glows (oben-links / unten-rechts), sehr schwach: dark `rgba(255,94,0,0.025/0.018)`, light `0.015/0.01`. Erzeugt warmes Ambient-Leuchten.
- **Bloom (`.bg-bloom`):** einzelner Orange-Glow oben-links.

> Für neues Material: dunkle Fläche `#141414`, ein dezenter warmer Orange-Radial-Glow + minimales Grain = der Marken-Hintergrund.

---

## 6. Komponenten-Bausteine

### Karten
| Klasse | Aufbau |
|---|---|
| `.glass-card` | `--surface-1`, Radius 24px, 1px `--border`, `--shadow-sm`, `overflow:hidden` |
| `.glass-card-inner` | `--surface-2`, Radius 16px (für innere Blöcke) |
| `.card-clean` | wie glass-card |
| `.card-accent` / `.card-glow` | surface-1, Radius 24px, Border, ohne Schatten |

### Buttons (alle Radius 16px)
| Klasse | Aufbau |
|---|---|
| `.btn-primary` | **Gradient-Border-Trick:** Füllung `--surface-2`, Border = `linear-gradient(135deg, --ci-orange, --ci-red)` über `border-box`, 1.5px. Light: Füllung `--background-raised`. |
| `.btn-dark` | `--highlight` BG, `--highlight-text` Schrift |
| `.btn-glass` | `--surface-2` BG, 1px `--border` |

### Inputs (`.input-field`)
`--input-bg`, 1px `--input-border`, Radius 16px. **Focus:** Border `--accent` + `box-shadow 0 0 0 2px rgba(255,94,0,0.08)`. Placeholder `--muted`.

### Gradient-Akzente
- `.gradient-accent`: `linear-gradient(135deg, #FF3D00, #FF8C00)`
- `.gradient-accent-text`: `color: --ci-orange`

### Bottom-Nav (`.bottom-nav-floating`)
Schwebende Pill: `--surface-1`, Radius 20px (pill), `box-shadow: 0 4px 24px rgba(0,0,0,0.2)` + 1px Ring, `blur(20px)`. Aktiver Tab `--highlight-text`, inaktiv `--muted`.

### Skeleton-Loader (`.skeleton`)
Shimmer-Gradient `surface-1 → surface-2 → surface-1`, `animation: shimmer 1.5s infinite`, Radius 12px.

---

## 7. Motion

- **Signatur-Easing:** `--ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1)`
- **Keyframes:** `fade-in-up` (14px↑), `scale-in` (0.97→1), `bottombar-enter` (20px↑, 0.9s), `shimmer`.
- **Tap-Feedback:** `.tap-card` / `.tap-btn` → `scale(0.98)` on `:active`, 0.15s.
- **Framer Motion** (`src/components/motion/`): Stagger 0.03s (erster Besuch) / 0.01s (Wiederbesuch); Spring `damping 40, stiffness 300`; Hover-Karten `y: -2`, Buttons `scale: 1.02`; Tap `scale: 0.97`.

Prinzip: schnell, weich, nie ruckartig; Listen erscheinen gestaffelt, Modals sliden mit ease-out-expo.

---

## 8. Tech-Stack (Kontext)

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme inline`) — **keine** separate `tailwind.config`; alle Tokens leben in [globals.css](src/app/globals.css).
- **Framer Motion 12** (Animation) · **Lucide React** (Icons) · **Recharts** (Charts)
- Theming: Dark default, `.light`-Klasse auf `<html>`, persistiert in `localStorage` als `sc-theme`.

---

## Schnell-Rezept für "im gleichen Design"

1. **Hintergrund:** `#141414`, dezenter warmer Orange-Radial-Glow, 3% Grain.
2. **Flächen:** Karten `#1C1C1C`, Radius 24px, 1px `rgba(255,255,255,0.07)` Border, weicher Schatten.
3. **Text:** System-Sans, Off-White `#EDEBE8`, Titel 700/`-0.03em`, Labels UPPERCASE/`0.08em`/`#888`.
4. **Akzent:** Orange→Rot Gradient `#f76c07 → #fe281f` (135°), sparsam — meist nur als Border, Text-Highlight oder Glow.
5. **Form:** großzügige Rundungen (16/20/24px), viel Luft, Pill-Shapes.
6. **Motion:** ease-out-expo, sanftes Stagger-Fade-up.
