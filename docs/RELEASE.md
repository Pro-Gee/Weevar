# Release Checklist

Use this checklist before publishing **`weevar`** to npm. Current line: **v1.1.x** (V2 — layout + style editing).

---

## Pre-release

- [ ] All intended changes committed on the release branch
- [ ] `npm run build -w weevar`
- [ ] `npm run test -w weevar` (115+ unit tests)
- [ ] `npm run test:e2e:setup` (first time / CI image refresh)
- [ ] `npm run test:e2e` (5 Playwright specs)
- [ ] Manual smoke on playground or fresh Vite app:
  - [ ] Layout reorder + cross-container move (especially **container** with children)
  - [ ] Style edit tray — border, radius, W/H Fill/Hug
  - [ ] Batched prompt copy (mixed layout + style)
  - [ ] Undo / redo / clear session
- [ ] **Docs updated** — README, `docs/*`, CHANGELOG

---

## Package validation

- [ ] Version bumped in `packages/weevar/package.json` (semver: features → minor, fixes → patch)
- [ ] `npm pack -w weevar --dry-run`
- [ ] Tarball contains only: `dist/**`, `README.md`, `LICENSE`, `package.json`
- [ ] Export paths resolve: `react`, `vite`, `swc`, `webpack-loader`
- [ ] Tray footer shows new version after build (`__WEEVAR_VERSION__` injection)

---

## Versioning and notes

- [ ] `CHANGELOG.md` — new dated section with Added / Changed / Fixed / Migration
- [ ] `docs/RELEASE_NOTES_vX.Y.Z.md` (optional detailed release doc)
- [ ] Migration notes if prompt format or types changed

---

## Publish

```bash
npm whoami
npm publish -w weevar
```

`prepublishOnly` runs `npm run verify` (build + unit tests) automatically.

- [ ] Confirm on npm: `npm view weevar version`
- [ ] Verify npm page metadata (homepage, repository, bugs, README render)

---

## Post-release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

- [ ] GitHub Release from tag — paste CHANGELOG section
- [ ] Announce (site / social) using [ANNOUNCEMENT_TEMPLATE.md](./ANNOUNCEMENT_TEMPLATE.md)
- [ ] Monitor issues for 72 hours; patch if needed (`X.Y.Z+1`)

---

## Rollback

- npm deprecate bad version: `npm deprecate weevar@X.Y.Z "reason"`
- Publish patch with fix; do not unpublish unless policy requires and window allows

---

## Quick commands (monorepo root)

```bash
npm run release:check    # verify + dry-run pack
npm run build -w weevar
npm run test -w weevar
npm run test:e2e
```
