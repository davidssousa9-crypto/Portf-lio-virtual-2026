import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

export type WorldQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
};

export type World = {
  id: string;
  name: string;
  questions: WorldQuestion[];
  flashcards: { id: string; front: string; back: string; revisar?: boolean }[];
};

export function loadWorld(id: string): World {
  return JSON.parse(
    readFileSync(join(process.cwd(), "knowledge", "content", `${id}.json`), "utf8")
  ) as World;
}

export function trackConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

export async function skipLoader(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("agrvai-loader-skip", "1");
    /* Clear once per tab so reload-persistence tests stay meaningful. */
    if (!sessionStorage.getItem("__agrvai-test-cleared")) {
      sessionStorage.setItem("__agrvai-test-cleared", "1");
      localStorage.removeItem("agrvai-knowledge-v1");
      localStorage.removeItem("agrvai-arcade-v1");
      localStorage.removeItem("agrvai-sound-enabled");
    }
  });
}

export async function openKnowledge(page: Page, hash = ""): Promise<void> {
  await page.goto(`/conhecimento/${hash}`, { waitUntil: "networkidle" });
  await page.waitForSelector("body.is-ready", { timeout: 10_000 });
}

export function questionFor(world: World, text: string | null): WorldQuestion {
  const clean = (text || "").trim();
  const found = world.questions.find((question) => question.question === clean);
  if (!found) throw new Error(`Question not found: ${clean.slice(0, 80)}`);
  return found;
}
