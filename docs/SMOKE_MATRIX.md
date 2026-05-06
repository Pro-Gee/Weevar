# External Smoke Matrix

Use this matrix before public release.

## Scenario A: Fresh Vite React app

- Install `weevar`
- Mount `<Weevar />`
- Add `weevar/vite` plugin
- Verify:
  - trigger appears on first load
  - selection + drag + prompt copy works
  - undo/redo/delete behaviors are correct

## Scenario B: Fresh Next.js app

- Install `weevar`
- Mount `<Weevar />` in root layout
- Verify:
  - trigger appears
  - route transition does not break overlay
  - prompt generation still works after navigation

## Scenario C: Non-ideal environment

- App with strict CSP/custom resets/heavy CSS
- Verify:
  - Shadow DOM isolation keeps overlay usable
  - no host style bleed breaks toolbar/trays
  - fallback behavior remains functional

## Result log template

- Date:
- Commit/tag:
- Scenario:
- Pass/Fail:
- Notes:
