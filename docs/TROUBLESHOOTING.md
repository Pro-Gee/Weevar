# Troubleshooting

Common issues when installing, running, or generating prompts with Weevar V2.

---

## Overlay does not appear

1. Confirm `<Weevar />` is mounted in your React root (or a client wrapper in Next.js).
2. Confirm you are in **development mode** (`npm run dev`, not `npm run build && npm run preview` unless intentionally testing).
3. Press **⌘⇧E** / **Ctrl+Shift+E** or click the dock trigger.
4. Hard refresh: **Cmd/Ctrl + Shift + R**.
5. Check the browser console for `[weevar]` warnings (stale host, foreign owner).

---

## Trigger not visible after reload / HMR

- Restart the dev server if a stale `#weevar-host` remains after hot reload.
- Weevar reclaims hosts it owns (`data-wv-owner` starting with `weevar-`); foreign hosts are left alone.
- Ensure only **one** dev server instance serves the tab you are testing.

---

## Live layout/style changes disappear on refresh

**Expected behavior.** Weevar previews edits on the live DOM only. Refresh restores source-defined markup and CSS. Use **Prompt → Copy** and apply changes in your codebase.

---

## Edit tray does not open

1. Press **W** to enter pointer mode (not Overview **O**).
2. Click an element **on the page**, not on Weevar chrome.
3. Ensure the element is not covered by another overlay; try clicking a visible child.

---

## Style change did not enter the session

- **Blur the field** or click the page to commit (pointer down on the page blurs tray inputs intentionally).
- Identical before/after values are skipped (no-op filter).
- Undo (**U**) removes the last commit; check Overview **Total edits** count.

---

## Dropdown in edit tray does not update / stay open

Fixed in 2.0.0 (since 1.1.0) — upgrade to `weevar@2.0.1` or later. If issues persist:

- Click the trigger again to close without selecting.
- Click outside the dropdown to dismiss.
- Avoid interacting with the page while a menu is open unless committing a selection.

---

## Single-key shortcuts fire while typing in the edit tray

Fixed in **2.0.1** — shortcuts are disabled while the edit tray is open. Upgrade:

```bash
npm install weevar@2.0.1
```

Restart your dev server after upgrading.

---

## Colour hex field won't accept typing / shows `[object Object]`

Fixed in **2.0.1** — the colour picker hex input now reads typed values correctly. Upgrade to `weevar@2.0.1` and restart the dev server.

---

## Prompt shows `src:source:unknown`

The Vite plugin (or equivalent source injection) is missing or not processing your files.

1. Add `weevar()` to Vite `plugins` **before** React plugin.
2. Ensure files are `.jsx` / `.tsx` under your project (not only in `node_modules`).
3. Restart dev server after adding the plugin.

Prompts still include DOM path and content hash anchors without source lines.

---

## Prompt seems stale or incomplete

- Undo/redo/clear (**D**) dismiss trays — press **P** again to regenerate.
- Session must contain edits before prompt body appears (empty state: **"No edits made yet"**).
- For batched prompts, copy the **full** output including numbered steps and global constraints.

---

## Agent misapplied a container move (moved one child instead of wrapper)

Ensure you dragged the **container element** (e.g. `.carousel-scroll`), not a child slide. Prompts from 2.0.0+ label containers with `(N element children)` and subtree instructions. Paste the full batched prompt and ask the agent to apply steps in order.

---

## Wrong dev URL / port

Vite may switch ports if `5173` is in use. Open the exact URL from the terminal. Playwright and manual tests must target the active port.

---

## Spacing measure (Alt) not showing

1. Select an element first (**W** + click).
2. Hold **Alt** and hover a **different** element on the page.
3. Feature is disabled while dragging or while prompt/settings trays block interaction.

---

## Production bundle includes Weevar

The npm **`weevar/react`** production export should tree-shake to a **no-op**. Verify:

```bash
npm run build
# inspect output — no overlay host, no large weevar chunk in prod
```

Do not import `weevar/react` development entry in production code paths. In monorepos, ensure production resolves to `react.prod` export conditions.

---

## Build / test issues (contributors)

### Unit tests

```bash
npm run test -w weevar
```

`HTMLCanvasElement.getContext` warnings from jsdom during color-picker tests are expected noise; tests should still pass.

### E2E fails — missing Playwright browser

```bash
npm run test:e2e:setup
npm run test:e2e
```

### Multiple `tsup --watch` processes

Stop duplicate watchers; one clean `npm run dev -w weevar` instance per machine.

### `npm publish` / verify

```bash
npm run build -w weevar
npm run test -w weevar
npm pack -w weevar --dry-run
```

---

## Still stuck?

Open an issue at [github.com/Pro-Gee/Weevar/issues](https://github.com/Pro-Gee/Weevar/issues) with:

- Weevar version (tray footer)
- React / Vite (or bundler) versions
- Browser and OS
- Steps to reproduce
- Prompt text (redact sensitive content)
