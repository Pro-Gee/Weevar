import type { CSSProperties } from "react";

export function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0d10", color: "#e8eaed" }}>
      <header
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #2a2e38",
        }}
      >
        <strong style={{ marginRight: "auto" }}>Weevar playground</strong>
        <a href="#" style={{ color: "#7ab8ff" }}>
          Docs
        </a>
        <button type="button" style={btn}>
          Notifications
        </button>
        <button type="button" style={{ ...btn, background: "#0099ff", color: "#0b0d10" }}>
          Sign in
        </button>
      </header>
      <main style={{ padding: 24, maxWidth: 720 }}>
        <h1 style={{ fontSize: 22, marginTop: 0 }}>Try the overlay</h1>
        <p style={{ lineHeight: 1.6, color: "#c9cdd4" }}>
          Press <kbd>⌘⇧E</kbd> (Mac) or <kbd>Ctrl+Shift+E</kbd> (Windows/Linux), or click the
          blue dot. Select an element, drag the handle to reorder within the same parent (flex row
          gets live <code style={{ color: "#7ab8ff" }}>order</code> preview). On drop, use the
          prompt drawer to copy. <kbd>Esc</kbd> cancels drag, discards the prompt panel, or closes
          the session.
        </p>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            padding: 16,
            borderRadius: 8,
            border: "1px solid #2a2e38",
            background: "#12151c",
          }}
        >
          {["Alpha", "Bravo", "Charlie", "Delta"].map((label) => (
            <button key={label} type="button" style={pill}>
              {label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

const btn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #2a2e38",
  background: "#1a1d24",
  color: "#e8eaed",
  cursor: "pointer",
};

const pill: React.CSSProperties = {
  ...btn,
  borderRadius: 999,
};
