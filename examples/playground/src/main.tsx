import React from "react";
import ReactDOM from "react-dom/client";
import type { WeevarRuntimeConfig } from "weevar/react";
import { Weevar } from "weevar/react";
import weevarFileConfig from "virtual:weevar-config";
import { App } from "./App";
import { clearPublicDemoStalePrefs } from "./theme";

clearPublicDemoStalePrefs();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <>
      <App />
      <Weevar config={weevarFileConfig as WeevarRuntimeConfig} />
    </>
  </React.StrictMode>,
);
