# External Smoke Matrix

Run this matrix before major releases or when changing overlay, edit tray, or prompt logic. Log results in the template at the bottom.

**Target version:** weevar **1.1.0+** (V2)

---

## Scenario A: Fresh Vite React app

**Setup**

```bash
npm create vite@latest weevar-smoke -- --template react-ts
cd weevar-smoke
npm install weevar
```

- Mount `<Weevar />` in `main.tsx` / root
- Add `weevar()` to `vite.config.ts` **before** React plugin
- `npm run dev`

**Verify**

| # | Check | Pass |
|---|-------|------|
| A1 | Trigger / dock visible on first load | |
| A2 | **O** opens Overview — **Total edits** shows 0 | |
| A3 | **W** + click selects element; edit tray opens | |
| A4 | Change border-radius or font size — live preview | |
| A5 | Drag element — reorder or move; DOM updates | |
| A6 | Move a **container** (wrapper with multiple children) | |
| A7 | **P** — prompt includes tag+class refs and/or `{src:…}` | |
| A8 | Container move prompt mentions **element children** / subtree | |
| A9 | Copy prompt — clipboard contains full batched text | |
| A10 | **U** / **R** undo/redo layout and style | |
| A11 | **D** clears session; prompt empty state | |
| A12 | Refresh — page returns to source layout/styles | |

---

## Scenario B: Fresh Next.js app

**Setup**

- Install `weevar`; mount client `<Weevar />` in root layout (dev only)
- Optional: Vite not applicable — note reduced source accuracy if no transform

**Verify**

| # | Check | Pass |
|---|-------|------|
| B1 | Trigger appears in dev | |
| B2 | Client navigation does not break overlay permanently | |
| B3 | Selection + style commit + prompt still work after route change | |
| B4 | Production build excludes overlay behavior | |

---

## Scenario C: Tailwind CSS project

**Setup**

- Vite + React + Tailwind + `weevar/vite`
- Ensure `tailwind.config.*` present

**Verify**

| # | Check | Pass |
|---|-------|------|
| C1 | Plugin auto-enables or config sets `tailwindVerbatimClasses` | |
| C2 | Detailed style prompt includes Tailwind suggestion column (when enabled) | |
| C3 | Short prompt still usable without Tailwind column | |

---

## Scenario D: Non-ideal host CSS

**Setup**

- App with strict global resets, heavy `!important`, or complex stacking contexts

**Verify**

| # | Check | Pass |
|---|-------|------|
| D1 | Weevar chrome readable (shadow isolation) | |
| D2 | Selection outlines visible on host elements | |
| D3 | Drop targets still find valid parents | |
| D4 | Edit tray dropdowns visible (not clipped by transform bugs) | |

---

## Scenario E: Monorepo playground (Weevar repo)

**Setup**

```bash
npm run build -w weevar
npm run dev
# Desktop viewport >= 1024px for full overlay
```

**Verify**

| # | Check | Pass |
|---|-------|------|
| E1 | Gallery pill radius style → prompt | |
| E2 | Carousel container move → subtree prompt | |
| E3 | Settings — switch Short/Detailed and target tool | |
| E4 | Tray footer version matches `package.json` | |

---

## Result log template

Copy one block per run:

```text
Date:
Tester:
weevar version:
Commit/tag:
Scenario: A | B | C | D | E
Pass/Fail:
Notes:
Regressions filed: (issue URLs)
```

---

## Minimum bar for release

- **Scenario A** — all checks pass
- **Scenario E** — all checks pass (maintainer dogfood)
- **Scenario B or C** — at least one pass per release train when relevant stacks changed
