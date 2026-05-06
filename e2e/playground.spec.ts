import { expect, test, type Page } from "@playwright/test";

const weevHost = (page: Page) => page.locator("#__weevar_host__");
const legacyDot = (page: Page) => page.locator(".__weevar_boot_dot__");

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

test("designed trigger is present on fresh load", async ({ page }) => {
  await installShadowCapture(page);
  await page.goto("/");
  await expect(page.getByText("Weevar playground")).toBeVisible();
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
  await expect(page.getByText("Weevar playground")).toBeVisible();
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
  await expect(page.getByText("Weevar playground")).toBeVisible();
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+Shift+E`);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
});
