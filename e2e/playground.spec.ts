import { expect, test, type Page } from "@playwright/test";

const weevHost = (page: Page) => page.locator("#__weevar_host__");

test("boot dot mounts Weevar host", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Weevar playground")).toBeVisible();
  await page.getByRole("button", { name: "Activate Weevar overlay" }).click({ force: true });
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
});

test("keyboard shortcut mounts host", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Weevar playground")).toBeVisible();
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+Shift+E`);
  await expect(weevHost(page)).toBeAttached({ timeout: 15_000 });
});
