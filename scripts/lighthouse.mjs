/* ============================================================
   Lighthouse gate — builds nothing, expects `dist/` to exist.
   Starts `vite preview`, runs Lighthouse with the Playwright
   Chromium binary, prints the four category scores and fails
   the process when a score drops below its threshold.
   ============================================================ */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = join(process.cwd(), "tests", "artifacts");

const THRESHOLDS = {
  performance: 0.8,
  accessibility: 0.95,
  "best-practices": 0.95,
  seo: 0.9
};

const PAGES = ["/", "/conhecimento/"];

function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        /* still booting */
      }
      if (Date.now() - started > timeoutMs) return reject(new Error(`Server timeout: ${url}`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

function runLighthouse(url, outFile) {
  return new Promise((resolve, reject) => {
    const cli = join(process.cwd(), "node_modules", "lighthouse", "cli", "index.js");
    const child = spawn(
      process.execPath,
      [
        cli,
        url,
        "--quiet",
        "--output=json",
        `--output-path=${outFile}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--form-factor=mobile",
        "--screenEmulation.mobile=true"
      ],
      {
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) return reject(new Error(`Lighthouse exited ${code}\n${stderr}`));
      resolve(JSON.parse(readFileSync(outFile, "utf8")));
    });
  });
}

if (!existsSync(join(process.cwd(), "dist", "index.html"))) {
  console.error("dist/ ausente — rode `npm run build` antes do Lighthouse.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let preview = null;
let failed = false;

try {
  try {
    await waitForServer(`${BASE}/`, 1500);
    console.log(`Usando preview já ativo em ${BASE}`);
  } catch {
    preview = spawn(
      process.execPath,
      [
        join(process.cwd(), "node_modules", "vite", "bin", "vite.js"),
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(PORT)
      ],
      { stdio: "ignore" }
    );
    await waitForServer(`${BASE}/`);
  }
  for (const path of PAGES) {
    const slug = path === "/" ? "home" : path.replaceAll("/", "") || "home";
    const result = await runLighthouse(`${BASE}${path}`, join(OUT_DIR, `lighthouse-${slug}.json`));
    const scores = Object.fromEntries(
      Object.entries(result.categories).map(([key, category]) => [key, category.score])
    );
    console.log(`\n${path}`);
    for (const [key, score] of Object.entries(scores)) {
      const threshold = THRESHOLDS[key] ?? 0;
      const pass = score >= threshold;
      if (!pass) failed = true;
      console.log(
        `  ${pass ? "PASS" : "FAIL"}  ${key.padEnd(15)} ${Math.round(score * 100)} (min ${Math.round(threshold * 100)})`
      );
    }
  }
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  preview?.kill();
}

process.exit(failed ? 1 : 0);
