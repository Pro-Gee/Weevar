# Release Notes — weevar v1.2.0

**Release date:** 2026-05-22  
**npm:** `weevar@1.2.0`

Full changelog: [CHANGELOG.md](../CHANGELOG.md#120---2026-05-22)

---

## Summary

Weevar v1.2.0 is a **documentation and polish** release. No new product features — the runtime matches **1.1.0 (V2)** with updated docs and clearer prompt empty-state copy.

---

## What's in this release

### Documentation (repo + npm README)

All guides updated for V2 capabilities:

| Doc | Focus |
|-----|--------|
| `README.md` | Layout + style editing, workflow, shortcuts, prompts |
| `docs/INSTALL.md` | Vite, Next.js, config files, verification |
| `docs/USAGE.md` | Edit tray, session, batched prompts, Tailwind |
| `docs/TROUBLESHOOTING.md` | V2-specific issues |
| `docs/COMPATIBILITY.md` | Frameworks, CSS stacks, limitations |
| `docs/SECURITY.md` | Prompt data, local-first model |
| `docs/RELEASE.md` | Release checklist for 1.1.x+ |
| `docs/LAUNCH_GATES.md` | Style + prompt quality gates |
| `docs/SMOKE_MATRIX.md` | External smoke scenarios |
| `docs/ANNOUNCEMENT_TEMPLATE.md` | v1.1.0 template (reference) |

Documentation links in the npm README use GitHub URLs so they work on [npmjs.com](https://www.npmjs.com/package/weevar).

### UI copy

- Prompt drawer empty state: **“No edits made yet”** (was “No element moved yet”)

---

## Upgrade

```bash
npm install weevar@1.2.0
```

Restart your dev server. Tray footer should show **v1.2.0**.

If you are already on **1.1.0**, there are **no breaking API changes** — upgrade for docs alignment and the empty-state copy fix.

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
