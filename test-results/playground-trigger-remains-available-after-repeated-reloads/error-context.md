# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playground.spec.ts >> trigger remains available after repeated reloads
- Location: e2e/playground.spec.ts:52:16

# Error details

```
Error: browserType.launch: Executable doesn't exist at /var/folders/0q/fh9pt6ws4h594bpwj0zwk62h0000gn/T/cursor-sandbox-cache/b2f5e2c94373e6a21ab445e850d90b6a/playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-x64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```