import { expect, test } from "@playwright/test";
import { skipLoader, trackConsole } from "./helpers";
import { CHARACTER_GRIDS, DEFAULT_PALETTE } from "../character.js";

test.beforeEach(async ({ page }) => {
  await skipLoader(page);
});

test("cabelo mantém a silhueta assimétrica e a paleta vinho da referência", () => {
  const hair = CHARACTER_GRIDS.creative.hair;
  const ear = CHARACTER_GRIDS.creative.ear;
  const at = (rows: string[], x: number, y: number) => rows[y]?.[x] || ".";

  expect(DEFAULT_PALETTE.a).toBe("#4A1F2E");
  expect(DEFAULT_PALETTE.A).toBe("#2E1520");
  expect(DEFAULT_PALETTE.y).toBe("#6B2D3D");
  expect(hair.join("")).toContain("a");
  expect(hair.join("")).toContain("A");
  expect(hair.join("")).toContain("y");
  expect(CHARACTER_GRIDS.developer.hair).toEqual(hair);
  expect(CHARACTER_GRIDS.developer.ear).toEqual(ear);
  expect(at(hair, 10, 8)).not.toBe(".");
  expect(at(hair, 17, 8)).toBe(".");
  expect(at(hair, 4, 10)).not.toBe(".");
  expect(at(hair, 20, 10)).toBe(".");
  expect(at(hair, 4, 15)).toBe(".");
  expect(at(hair, 4, 16)).toBe("A");
  expect(at(ear, 5, 12)).not.toBe(".");
});

test("óculos têm a mesma matriz nos modos criativo e desenvolvedor", () => {
  expect(CHARACTER_GRIDS.creative.glasses).toEqual(CHARACTER_GRIDS.developer.glasses);
});

test("modo férias preserva o personagem e acrescenta roupa e gorro de Papai Noel", () => {
  const creative = CHARACTER_GRIDS.creative;
  const holiday = CHARACTER_GRIDS.holiday;

  const faceLayers: Array<keyof typeof creative> = [
    "base", "hair", "brows", "glasses", "ear", "expression"
  ];
  faceLayers.forEach((layer) => {
    expect(holiday[layer]).toEqual(creative[layer]);
  });
  expect(holiday.clothing).not.toEqual(creative.clothing);
  expect(holiday.hat.join("")).toContain("z");
  expect(holiday.hat.join("")).toContain("q");
  expect(holiday.clothing.join("")).toContain("z");
  expect(holiday.clothing.join("")).toContain("Q");
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      if (creative.hair[y][x] !== ".") expect(holiday.hat[y][x]).not.toBe(".");
    }
  }
});

test("identificação pessoal mantém apenas o espaço circular reservado", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const photo = page.locator("#personalPhoto");
  const placeholder = photo.locator(".player-card__photo-placeholder");
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute("aria-label", "Espaço reservado para foto pessoal");
  await expect(placeholder).toBeVisible();
  await expect(photo.locator("img")).toHaveCount(0);
  await expect(photo.locator("input")).toHaveCount(0);
  await expect(page.locator(".player-card__corner")).toHaveCount(4);
  await expect(page.locator(".player-card__crest")).toHaveText("✦");

  expect(errors).toEqual([]);
});
