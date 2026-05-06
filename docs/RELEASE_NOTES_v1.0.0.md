# Weevar v1.0.0 Release Notes (Draft)

Weevar is now publicly launch-ready as a dev-only React overlay for live UI manipulation and structured AI prompt generation.

## Highlights

- **Live UI manipulation workflow**
  - Select, drag, reorder/move, and generate prompts directly from running UI.
- **Prompt quality improvements**
  - Deterministic prompt generation for batched changes.
  - Effective-state prompt behavior (final element state vs live baseline).
- **Session controls**
  - Undo/redo/delete behavior tightened and aligned with prompt visibility logic.
- **Overview UX upgrades**
  - Improved metrics and trigger badge consistency (`Total moved` parity).
  - Documentation arrow opens `weevar.com` in a new tab.
- **Runtime stability hardening**
  - Overlay host ownership/HMR handling improved to reduce stale overlay instances.

## Packaging and Release Readiness

- Added public package metadata and publish safeguards in package configuration.
- Added release verification scripts and prepublish checks.
- Added changelog scaffold and release checklist.

## Documentation Added

- README quickstart
- Install guide
- Usage guide
- Troubleshooting guide
- Compatibility notes
- Security/privacy notes
- Launch gates and smoke matrix
- Announcement template

## QA and Validation

- Unit test suite passing.
- E2E suite present and expanded, currently blocked in this environment by missing Playwright browser binaries.

## Known Limitations

- Chromium-first validation target.
- Dev-only runtime by design (no-op in production path).
- Layout-focused manipulation in v1.

