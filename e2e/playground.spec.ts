import { expect, test, type Page } from "@playwright/test";

const weevHost = (page: Page) => page.locator("#__weevar_host__");
const legacyDot = (page: Page) => page.locator(".__weevar_boot_dot__");
const playgroundTitle = (page: Page) => page.getByRole("heading", { level: 1, name: "Meridian" });

async function expectPlaygroundPage(page: Page) {
  await expect(playgroundTitle(page)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
}

async function installShadowCapture(page: Page) {
  await page.addInitScript(() => {
    const w = window as Window & {
      __weevarShadowRoot?: ShadowRoot;
      __weevarAttachPatchInstalled?: boolean;
    };
    if (w.__weevarAttachPatchInstalled) return;
    w.__weevarAttachPatchInstalled = true;
    const orig = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init: ShadowRootInit) {
      const root = orig.call(this, init);
      if ((this as HTMLElement).id === "__weevar_host__") {
        w.__weevarShadowRoot = root;
      }
      return root;
    };
  });
}

async function clickInWeevarShadow(page: Page, selector: string) {
  await page.locator(selector).first().click();
}

test("designed trigger is present on fresh load", async ({ page }) => {
  await installShadowCapture(page);
  await page.goto("/");
  await expectPlaygroundPage(page);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
  await expect(legacyDot(page)).toHaveCount(0);
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
          return !!w.__weevarShadowRoot?.querySelector(".wv-tool-button");
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
});

test("trigger remains available after repeated reloads", async ({ page }) => {
  await installShadowCapture(page);
  await page.goto("/");
  await expectPlaygroundPage(page);
  for (let i = 0; i < 3; i += 1) {
    await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
    await expect(legacyDot(page)).toHaveCount(0);
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
            return !!w.__weevarShadowRoot?.querySelector(".wv-tool-button");
          }),
        { timeout: 15_000 },
      )
      .toBe(true);
    await page.reload({ waitUntil: "networkidle" });
  }
});

test("keyboard shortcut mounts host", async ({ page }) => {
  await installShadowCapture(page);
  await page.goto("/");
  await expectPlaygroundPage(page);
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+Shift+E`);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
});

test("overview documentation arrow opens weevar.com in new tab", async ({ page }) => {
  await installShadowCapture(page);
  await page.goto("/");
  await expectPlaygroundPage(page);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
  await page.evaluate(() => {
    const w = window as Window & { __wvOpenedUrls?: string[] };
    const originalOpen = window.open.bind(window);
    w.__wvOpenedUrls = [];
    window.open = (...args) => {
      w.__wvOpenedUrls?.push(String(args[0] ?? ""));
      return originalOpen(...args);
    };
  });
  await page.evaluate(() => {
    const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
    const toolBtn = w.__weevarShadowRoot?.querySelector(".wv-tool-button") as HTMLElement | null;
    if (!toolBtn) throw new Error("Missing shadow element: .wv-tool-button");
    toolBtn.click();
  });
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
          return !!w.__weevarShadowRoot?.querySelector(".wv-doc-go");
        }),
      { timeout: 10_000 },
    )
    .toBe(true);
  await page.evaluate(() => {
    const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
    const docBtn = w.__weevarShadowRoot?.querySelector(".wv-doc-go") as HTMLElement | null;
    if (!docBtn) throw new Error("Missing shadow element: .wv-doc-go");
    docBtn.click();
  });
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const w = window as Window & { __wvOpenedUrls?: string[] };
          return w.__wvOpenedUrls ?? [];
        }),
      { timeout: 10_000 },
    )
    .toContain("https://weevar.com");
});

test("reclaims stale weevar-owned host on startup", async ({ page }) => {
  await page.addInitScript(() => {
    const stale = document.createElement("div");
    stale.id = "__weevar_host__";
    stale.setAttribute("data-wv-owner", "weevar-stale-owner");
    stale.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(stale);
  });
  await installShadowCapture(page);
  await page.goto("/");
  await expectPlaygroundPage(page);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
  await expect(legacyDot(page)).toHaveCount(0);
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const w = window as Window & { __weevarShadowRoot?: ShadowRoot };
          return !!w.__weevarShadowRoot?.querySelector(".wv-tool-button");
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
});
