import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EditTray } from "./EditTray";

describe("EditTray font-weight", () => {
  let host: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = "";
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    root?.unmount();
    root = null;
    document.body.innerHTML = "";
  });

  it("applies native select preset 700 and notifies parent with edited target", async () => {
    const p = document.createElement("p");
    p.textContent = "hello";
    document.body.appendChild(p);

    const commits: Array<{ target: Element; prop: string; from: string; to: string }> = [];

    root = createRoot(host);
    await act(async () => {
      root!.render(
        <EditTray
          element={p}
          onClose={() => {}}
          onStyleCommit={(target, prop, _label, from, to) => {
            commits.push({ target, prop, from, to });
          }}
        />,
      );
    });

    const sel = host.querySelector(".wv-weight-native") as HTMLSelectElement | null;
    expect(sel).toBeTruthy();

    await act(() => {
      sel!.value = "700";
      sel!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(p.style.getPropertyValue("font-weight").trim()).toBe("700");
    expect(commits).toEqual([
      expect.objectContaining({
        target: p,
        prop: "font-weight",
        to: "700",
      }),
    ]);
  });
});
