# Troubleshooting

## Overlay changes are not showing

1. Ensure you are on the active dev URL (`http://localhost:5173` by default).
2. Hard refresh (`Cmd/Ctrl + Shift + R`).
3. Restart a single dev server instance.
4. If monorepo-linked, ensure only one watcher is writing `packages/weevar/dist`.

## Trigger not visible

- Verify `<Weevar />` is mounted in app root.
- Confirm app is running in development mode.
- Check there is no stale host container conflict after HMR; restart dev server.

## Prompt seems stale

- Undo/redo/delete intentionally dismiss trays.
- Re-open Prompt tray after action.

## Port conflicts

- Vite may switch ports if `5173` is occupied.
- Open the exact URL printed by the active server process.

## E2E fails with missing Playwright browser executable

- Run `npm run test:e2e:setup` before `npm run test:e2e`.
- If running in CI/sandbox, ensure browser install and test run use the same environment/cache.

## Build/watch races

- Do not run multiple `tsup --watch` processes for the same package.
- If you suspect race conditions, stop all watchers and start one clean instance.
