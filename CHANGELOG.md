# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.0.2] - 2026-05-07

### Changed

- Expanded npm/readme product narrative, requirements, and workflow description.
- Point GitHub documentation links and `repository` / `bugs` URLs at the real repo (`Pro-Gee/Weevar`).

## [1.0.1] - 2026-05-06

### Added

- Tray footer version label derived from `packages/weevar/package.json` at build time (`tsup` / Vitest); playground dev injects the same via Vite `define`.
- MIT `LICENSE` at repo root and under `packages/weevar` so the registry tarball includes license text.

### Fixed

- Ship `packages/weevar/README.md` in the npm tarball so the npm package page shows install and usage documentation.
- Playground E2E expectations aligned with current playground UI and documentation button behavior.

## [1.0.0] - 2026-05-06

### Added
- Public launch documentation set:
  - `README.md`
  - `docs/INSTALL.md`
  - `docs/USAGE.md`
  - `docs/TROUBLESHOOTING.md`
  - `docs/COMPATIBILITY.md`
  - `docs/SECURITY.md`
  - `docs/RELEASE.md`
  - `docs/LAUNCH_GATES.md`
  - `docs/SMOKE_MATRIX.md`
  - `docs/ANNOUNCEMENT_TEMPLATE.md`
- Release checklist and release-note draft:
  - `CHANGELOG.md`
  - `docs/RELEASE_NOTES_v1.0.0.md`
- Package/release scripts for verification and dry-run checks.
- E2E coverage for:
  - documentation-link popup behavior
  - stale Weevar-owned host reclaim behavior

### Changed
- Overlay host ownership/HMR lifecycle handling to reduce stale overlay instances.
- Prompt/session and overview UX refinements from pre-launch stabilization.
- Trigger badge count aligned with Overview `Total moved` unique-element count.

### Fixed
- Dev lifecycle issues causing stale overlay instances during hot reload.
