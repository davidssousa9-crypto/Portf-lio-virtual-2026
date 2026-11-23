import { chromium } from "@playwright/test";

const url = process.argv[2] || "http://127.0.0.1:4173/";
const wait = Number(process.argv[3] || 7000);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await client.send("Profiler.enable");
await client.send("Profiler.setSamplingInterval", { interval: 1000 });
await client.send("Profiler.start");
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(wait);
const { profile } = await client.send("Profiler.stop");

const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const self = new Map();
for (let i = 0; i < profile.samples.length; i += 1) {
  const id = profile.samples[i];
  const dt = profile.timeDeltas[i] || 0;
  self.set(id, (self.get(id) || 0) + dt);
}
const rows = [...self.entries()]
  .map(([id, us]) => {
    const node = byId.get(id);
    const f = node?.callFrame || {};
    return {
      us,
      fn: f.functionName || "(anonymous)",
      url: (f.url || "").replace("http://127.0.0.1:4173/", ""),
      line: f.lineNumber
    };
  })
  .sort((a, b) => b.us - a.us)
  .slice(0, 35);
for (const row of rows) {
  console.log(`${(row.us / 1000).toFixed(0).padStart(6)}ms  ${row.fn}  ${row.url}:${row.line}`);
}
await browser.close();
