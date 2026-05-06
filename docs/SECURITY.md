# Security and Privacy

## Data handling

- Weevar runs locally in your development session.
- Prompt text is generated from DOM/runtime metadata in the page.
- Weevar does not require a backend service to function.

## Production safety

- `weevar/react` resolves to a no-op runtime in production exports.
- Teams should still verify production bundles as part of release checks.

## Recommended safeguards

- Do not copy prompts containing sensitive in-page data into external tools unless approved.
- Add an internal policy for handling prompts in regulated environments.
