import { expect, test } from "@playwright/test";
import { skipLoader, trackConsole } from "./helpers";

test.use({ timezoneId: "America/Sao_Paulo" });

test("PPE renders the configured schedule and highlights Friday's current slot", async ({ page }) => {
  const errors = trackConsole(page);
  await page.clock.install({ time: new Date("2026-11-20T18:19:00-03:00") });
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const table = page.locator("#ppeScheduleTable");
  await table.scrollIntoViewIfNeeded();
  await expect(page.locator("#ideasTitle")).toHaveText("Plano pessoal de estudo 'PPE'");
  await expect(table.locator("tr")).toHaveCount(4);
  await expect(table.locator("thead .ppe-day-heading__name")).toHaveText([
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA"
  ]);
  const rows = await table.locator("tbody tr").evaluateAll((tableRows) =>
    tableRows.map((row) => [
      row.querySelector("th")?.textContent?.replace(/NOW/g, "").trim().replace(/\s+/g, " "),
      ...Array.from(row.querySelectorAll("td .ppe-badge"), (badge) => badge.textContent?.trim())
    ])
  );
  expect(rows).toEqual([
    ["8H ÀS 10H", "ATIVIDADES", "ATIVIDADES", "ATIVIDADES", "ATIVIDADES", "ATIVIDADES"],
    ["13:20H ÀS 18:20", "SESI/SENAI", "SENAI/SESI", "SESI/SENAI", "SESI/SENAI", "SENAI"],
    ["19:00 ÀS 22:00", "ESTUDOS", "CONTRATURNO", "CONTRATURNO", "CONTRATURNO", "REVISÃO"]
  ]);
  await expect(table.locator('thead th[data-weekday="5"]')).toHaveAttribute("aria-current", "date");
  await expect(table.locator('tbody tr[data-start-minute="800"]')).toHaveClass(/is-current-slot/);
  await expect(table.locator('tbody td[data-weekday="5"].is-now .ppe-badge')).toHaveText("SENAI");
  await expect(table.locator('tbody td[data-weekday="5"].is-now .ppe-now-badge')).toHaveText("NOW");

  expect(errors).toEqual([]);
});

test("PPE selection, completion and notes persist across reloads", async ({ page }) => {
  const errors = trackConsole(page);
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const block = page.locator('[data-block-id="monday:morning"]');
  await block.click();
  await expect(page.locator("#ppeDetailPanel")).toBeVisible();
  await page.locator("#ppeNotes").fill("Revisar as anotações");
  await page.locator("#ppeChecklist input").first().check();
  await page.locator('[data-ppe-action="complete"]').click();

  await expect(page.locator("#ppeXP")).toHaveText("10");
  await expect(block).toHaveClass(/is-complete/);
  await expect(page.locator("#ppeBossHPLabel")).toHaveText("93%");
  await page.reload({ waitUntil: "networkidle" });

  await expect(page.locator("#ppeXP")).toHaveText("10");
  const restoredBlock = page.locator('[data-block-id="monday:morning"]');
  await expect(restoredBlock).toHaveClass(/is-complete/);
  await restoredBlock.click();
  await expect(page.locator("#ppeNotes")).toHaveValue("Revisar as anotações");
  await expect(page.locator("#ppeChecklist input").first()).toBeChecked();
  expect(errors).toEqual([]);
});

test("PPE clears a completed day with an XP and stat summary", async ({ page }) => {
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  for (const blockId of ["monday:morning", "monday:afternoon", "monday:evening"]) {
    await page.locator(`[data-block-id="${blockId}"]`).click();
    await page.locator('[data-ppe-action="complete"]').click();
  }

  await expect(page.locator("#ppeDaySummary")).toBeVisible();
  await expect(page.locator("#ppeDaySummaryText")).toContainText(
    "DAY COMPLETE: +45 XP · STREAK 1 · FOCUS +5 · KNOWLEDGE +6 · DISCIPLINE +4"
  );
  await expect(page.locator('thead [data-day-id="monday"]')).toHaveClass(/is-cleared/);
});

test("PPE focus timer and map mode are usable", async ({ page }) => {
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  await page.locator('[data-block-id="monday:morning"]').click();
  await page.locator('[data-ppe-action="timer-start"]').click();
  await expect(page.locator("#ppeTimer")).toBeVisible();
  await expect(page.locator("#ppeTimerLabel")).toHaveText("25:00");
  await page.locator('#ppeTimer [data-ppe-action="timer-abort"]').click();
  await expect(page.locator("#ppeTimerStrip")).toBeHidden();

  await page.locator('[data-ppe-mode="map"]').click();
  await expect(page.locator('[data-ppe-panel="map"]')).toBeVisible();
  await expect(page.locator(".ppe-stage-node")).toHaveCount(5);
  await page.locator(".ppe-stage-node[data-day-id='friday']").click();
  await expect(page.locator("#ppeDetailPanel")).toBeVisible();
  await page.locator('[data-ppe-mode="table"]').click();
  await page.locator('[data-block-id="friday:evening"]').click();
  await expect(page.locator("#ppeBossMenu")).toBeVisible();
});

test("PPE grid supports keyboard movement and Escape", async ({ page }) => {
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const monday = page.locator('[data-block-id="monday:morning"]');
  await monday.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-block-id="tuesday:morning"]')).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#ppeDetailPanel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#ppeDetailPanel")).toBeHidden();
});

test("PPE table scrolls internally on mobile without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await skipLoader(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const dimensions = await page.locator(".ppe-schedule__scroll").evaluate((scroller) => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    clientWidth: scroller.clientWidth,
    scrollWidth: scroller.scrollWidth,
    stickyTimeColumn: getComputedStyle(
      document.querySelector(".ppe-schedule__table tbody th")!
    ).position
  }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  expect(dimensions.stickyTimeColumn).toBe("sticky");
});
