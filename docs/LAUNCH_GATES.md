# Launch Gates

Mandatory quality gates before tagging a public **`weevar`** release. Updated for **V2 (v1.1+)** — layout moves, style editing, and prompt reliability.

---

## Gate 1: Runtime stability

- [ ] Overlay host mounts on fresh load
- [ ] Dock trigger remains available after repeated reloads
- [ ] HMR does not strand stale overlay host ownership (reclaim or warn)
- [ ] Toggle shortcut **⌘⇧E** / **Ctrl+Shift+E** works outside text inputs
- [ ] Shadow DOM overlay does not break host page interaction when session off

**Automated:** Playwright specs in `e2e/playground.spec.ts`

---

## Gate 2: Layout editing

- [ ] Select + drag reorders within flex/grid parent
- [ ] Cross-container move updates live DOM
- [ ] Container move (parent with N children) generates prompt with:
  - [ ] DOM-first ref (`<tag.class>`)
  - [ ] `(N element children)` label
  - [ ] Subtree preservation instruction
- [ ] Undo/redo restores layout DOM state
- [ ] Clear session (**D**) resets to source-equivalent structure after refresh baseline

---

## Gate 3: Style editing

- [ ] Edit tray opens for text, image, svg, stack, generic categories
- [ ] Live preview on typography, box, border, radius, opacity
- [ ] W/H **Fill** / **Hug** / fixed px commits to session
- [ ] Tray dropdowns select values and dismiss correctly
- [ ] Style undo reverts computed styles on element
- [ ] No-op commits (unchanged values) do not bloat session

**Automated:** `styleEngine.test.ts`, `EditTray.weight.test.tsx`, related unit tests

---

## Gate 4: Prompt correctness and session integrity

- [ ] Short and detailed prompts generate for layout and style
- [ ] Batched mixed sessions: correct header counts and step order
- [ ] Relative indices documented in multi-step prompts
- [ ] Style tweaks on same element merge in session
- [ ] `generatePrompt` returns null for no-op layout moves
- [ ] Empty prompt state: **"No edits made yet"**

**Automated:** `generate.test.ts`, `generateBatched.test.ts`

---

## Gate 5: Packaging

- [ ] `npm run build -w weevar` from clean checkout
- [ ] `npm pack -w weevar --dry-run` — minimal tarball
- [ ] Fresh consumer install resolves all export subpaths
- [ ] Production `weevar/react` entry is no-op

---

## Gate 6: Documentation completeness

- [ ] `README.md` and `packages/weevar/README.md` describe V2 capabilities
- [ ] `docs/INSTALL.md`, `USAGE.md`, `TROUBLESHOOTING.md`, `COMPATIBILITY.md`, `SECURITY.md` current
- [ ] `CHANGELOG.md` dated release section
- [ ] Known limitations documented (runtime-only, no auto code write, Chromium-first)

---

## Gate 7: Validation matrix

- [ ] Unit tests pass (`npm run test -w weevar`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] External smoke matrix logged ([SMOKE_MATRIX.md](./SMOKE_MATRIX.md))

---

## Gate 8: Release readiness

- [ ] Version bump committed
- [ ] Tag + GitHub Release prepared
- [ ] Rollback / hotfix policy understood ([RELEASE.md](./RELEASE.md))

---

## Sign-off template

| Gate | Owner | Date | Pass |
|------|-------|------|------|
| 1 Runtime | | | |
| 2 Layout | | | |
| 3 Style | | | |
| 4 Prompts | | | |
| 5 Packaging | | | |
| 6 Docs | | | |
| 7 Matrix | | | |
| 8 Release | | | |
