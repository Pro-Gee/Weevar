# Launch Gates (v1.0)

These are mandatory before public release.

## Gate 1: Runtime stability

- Overlay host mounts on fresh load.
- Trigger remains available after repeated reloads.
- HMR does not strand stale overlay host ownership.

## Gate 2: Prompt correctness and session integrity

- Undo/redo/delete keep runtime state and prompt state consistent.
- Prompt output remains deterministic for batched changes.

## Gate 3: Packaging

- `weevar` package builds from clean checkout.
- `npm pack --dry-run` output is valid and minimal.
- Export paths resolve in a fresh consumer app.

## Gate 4: Documentation completeness

- Install/usage/troubleshooting docs published.
- Compatibility and known limitations documented.
- Security/privacy expectations documented.

## Gate 5: Validation matrix

- Unit + e2e tests pass.
- External smoke matrix completed and logged.

## Gate 6: Release readiness

- Changelog updated.
- Release notes drafted.
- Rollback/hotfix process defined.
