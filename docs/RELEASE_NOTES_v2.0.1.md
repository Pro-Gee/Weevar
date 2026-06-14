# Release Notes — weevar v2.0.1

**Release date:** 2026-06-14  
**npm:** `weevar@2.0.1`

Full changelog: [CHANGELOG.md](../CHANGELOG.md#201---2026-06-14)

---

## Summary

Patch release fixing **edit tray** input issues in V2.

---

## Fixes

### Edit tray shortcuts

Single-key shortcuts (`P`, `W`, `O`, `D`, `U`, `R`) are **disabled while the edit tray is open**, so typing in number, text, and colour fields no longer switches modes or clears the session.

### Colour hex field

- Manual hex entry (e.g. `#ff5500`) works in the colour picker text field.
- Clearing the field no longer displays `[object Object]`.

### Shadow DOM focus

Weevar registers its closed shadow root so focus inside tray controls is detected reliably for shortcut suppression.

---

## Upgrade

```bash
npm install weevar@2.0.1
```

Restart your dev server. Tray footer should show **v2.0.1**.

No breaking API changes from **2.0.0**.

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
