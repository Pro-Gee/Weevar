# Release Checklist

## Pre-release

- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run test:e2e:setup`
- [ ] `npm run test:e2e`
- [ ] External smoke checks complete (Vite + Next + edge scenario)
- [ ] Docs updated (README + guides + troubleshooting)

## Package validation

- [ ] `npm pack -w weevar --dry-run`
- [ ] Validate tarball includes only expected files (`dist`, docs as intended)
- [ ] Confirm export paths resolve: `react`, `vite`, `swc`, `webpack-loader`

## Versioning and notes

- [ ] Version bump in `packages/weevar/package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Draft release notes (what changed, known issues, migration notes)

## Publish

- [ ] `npm publish -w weevar`
- [ ] Verify npm page metadata (homepage, repository, bugs links)

## Post-release

- [ ] Announce release (site/social/changelog link)
- [ ] Monitor issues for first 72 hours
- [ ] Triage hotfixes with patch-version policy
