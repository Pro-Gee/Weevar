# Release Notes — weevar v2.0.0

**Release date:** 2026-05-22  
**npm:** `weevar@2.0.0`

Full changelog: [CHANGELOG.md](../CHANGELOG.md#200---2026-05-22)

---

## Summary

**Weevar v2.0.0** is the official semver-major release of **Weevar V2** — layout moves and live style editing in one dev overlay, with batched AI prompts. This release consolidates the V2 feature set (previously shipped as 1.1.x–1.2.x) under the **2.0** version line.

---

## What's in this release

### Layout + style editing

- **Edit tray** — typography, box model, borders, radius, opacity, flex/grid layout, Fill/Hug sizing
- **Layout moves** — reorder and cross-container moves with live DOM preview
- **Batched prompts** — mixed layout + style sessions in one copy-paste block
- **DOM-first refs** — `<div.carousel-scroll> (4 element children)` with subtree instructions

### Documentation

All guides updated for V2:

| Doc | Focus |
|-----|--------|
| `README.md` | Layout + style editing, workflow, shortcuts, prompts |
| `docs/INSTALL.md` | Vite, Next.js, config files, verification |
| `docs/USAGE.md` | Edit tray, session, batched prompts, Tailwind |
| `docs/TROUBLESHOOTING.md` | V2-specific issues |
| `docs/COMPATIBILITY.md` | Frameworks, CSS stacks, limitations |
| `docs/SECURITY.md` | Prompt data, local-first model |
| `docs/RELEASE.md` | Release checklist for 2.0.x |
| `docs/LAUNCH_GATES.md` | Style + prompt quality gates |
| `docs/SMOKE_MATRIX.md` | External smoke scenarios |

Documentation links in the npm README use GitHub URLs so they work on [npmjs.com](https://www.npmjs.com/package/weevar).

---

## Upgrade

```bash
npm install weevar@2.0.0
```

Restart your dev server. Tray footer should show **v2.0.0**.

### From 1.0.x

Install `weevar@2.0.0` and review [USAGE.md](./USAGE.md) — V2 adds style editing and richer prompt format. `MoveSession` type alias remains; prefer `EditSession` in new code.

### From 1.1.x – 1.2.x

Same runtime capabilities — semver major marks the official V2 line. No breaking API changes beyond the version number.

---

## Verification

```bash
npm run build -w weevar
npm run test -w weevar
npm pack -w weevar --dry-run
```

---

## License

MIT © 2026 Gideon Adeyemi
