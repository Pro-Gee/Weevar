# Security and Privacy

How Weevar handles data in local development sessions (v2.0.0+).

---

## Local-first architecture

- Weevar runs **entirely in your browser** during development.
- There is **no Weevar cloud backend** required for core functionality.
- Prompt text is generated **on device** from DOM structure, computed styles, and optional source metadata.
- Copy/paste to an AI tool is **user-initiated** — Weevar does not send prompts automatically.

---

## What data appears in prompts

Prompts may include:

| Data type | Example | Source |
|-----------|---------|--------|
| File paths | `src/App.tsx:182` | Vite plugin / `data-wv-source` |
| DOM selectors | `dom:main[1]>section[0]>figure[1]` | DOM path walk |
| CSS classes | `<figure.gallery-cell>` | Element `classList` |
| Text snippets | `"Meridian"` on headings/paragraphs | Direct text on text-like elements only |
| CSS values | `` `border-radius` 14px → 32px `` | Computed / committed style |
| Content hashes | `h:-946342386` | Disambiguation anchor |

Container elements use **child counts**, not full descendant text, in labels (since 1.1.0).

---

## Sensitive content

Your app’s visible text, class names, and structure may appear in prompts if you edit those elements.

**Recommendations:**

- Do not copy prompts into external AI tools if they contain **PII, secrets, or regulated data** unless your policy allows it.
- Use **sanitized dev datasets** when demoing Weevar on confidential projects.
- Review prompt output before pasting into third-party services.

Weevar does not redact page content automatically.

---

## Production safety

| Concern | Mitigation |
|---------|------------|
| Overlay in production | `weevar/react` **production export is a no-op** |
| Bundle size | Prod entry is minimal stub |
| Accidental mount | Gate `<Weevar />` with `process.env.NODE_ENV === "development"` in SSR frameworks |

Teams should still verify production bundles (`npm run build`) and confirm no dev-only imports leak into prod chunks.

---

## Network access

- **npm install** — standard package registry
- **Documentation link** — Overview tray opens [weevar.com](https://weevar.com) in a new tab when clicked
- **No telemetry** — core package does not phone home for session or prompt data

Third-party AI tools you paste prompts into have their own privacy policies.

---

## Shadow DOM isolation

Weevar UI renders in a **closed shadow root** attached to a fixed host node. This isolates Weevar styles from your app and vice versa for the chrome layer. Your **application DOM** is still read for selection, drag targets, and style computation.

---

## Dependencies

Runtime dependencies include Babel packages (Vite transform), `react-colorful` (colour picker), and peer `react` / `react-dom`. Review `package.json` for the full list when auditing supply chain.

---

## Reporting security issues

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/Pro-Gee/Weevar/security/advisories) or the contact path listed on [weevar.com](https://weevar.com).

Do not open public issues for undisclosed security problems.

---

## Related

- [Compatibility](./COMPATIBILITY.md)
- [Usage](./USAGE.md) — what prompts contain
