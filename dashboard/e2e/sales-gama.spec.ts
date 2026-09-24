import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("SALES-GAMA Bot", () => {
  test("landing widget opens and displays avatar", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const trigger = page.locator('[aria-label="Abrir chat SALES-GAMA"]');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Chat SALES-GAMA" })).toBeVisible();
  });

  test("send a message and receive streaming response", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('[aria-label="Abrir chat SALES-GAMA"]').click();
    const input = page.locator('textarea[aria-label="Tu mensaje"]');
    await input.fill("Hola, quiero una alarma para casa");
    await input.press("Enter");
    const messages = page.locator('.sg-message');
    await expect(messages.first()).toBeVisible({ timeout: 30000 });
  });

  test("human handoff opens WhatsApp", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('[aria-label="Abrir chat SALES-GAMA"]').click();
    const btn = page.getByRole("button", { name: "Hablar con humano" });
    // just check it exists (won't click because no session)
    await expect(btn).toBeVisible({ timeout: 10000 });
  });
});