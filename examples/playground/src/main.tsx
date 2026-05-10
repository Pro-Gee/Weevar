import React from "react";
import ReactDOM from "react-dom/client";
import "./app.css";
import { PlaygroundShell } from "./PlaygroundShell";
import { clearPublicDemoStalePrefs } from "./theme";

clearPublicDemoStalePrefs();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PlaygroundShell />
  </React.StrictMode>,
);
