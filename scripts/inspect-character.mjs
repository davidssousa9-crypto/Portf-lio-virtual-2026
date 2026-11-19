import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const data = await page.evaluate(() => {
  const canvas = document.getElementById("characterCanvas");
  const ctx = canvas.getContext("2d");
  const W = 28, H = 30;
  const uw = canvas.width / W, uh = canvas.height / H;
  const palette = {
    "1": "#E9C29B", "2": "#ECC7A1", "3": "#DDA383", "4": "#C98B6C", "5": "#DDA383",
    "6": "#D99A7E", "7": "#A85F58", "8": "#3F1A2A", t: "#E6E6E6", k: "#0F0F10",
    b: "#3B1D2D", g: "#3A2A38", G: "#2B1E2B", l: "#EBC59E", e: "#E8B58C", h: "#4B1E2C",
    H: "#381722", j: "#62283A", J: "#55233A", p: "#8A5A5E", s: "#5A2A3C", n: "#3F1A2A",
    W: "#FFFFFF", w: "#E6E6E6", X: "#322A30", V: "#2B2430", K: "#231C28", D: "#2D2830",
    Q: "#E53935"
  };
  const rows = [];
  for (let r = 0; r < H; r += 1) {
    let line = "";
    for (let c = 0; c < W; c += 1) {
      const d = ctx.getImageData(Math.floor(c * uw + uw / 2), Math.floor(r * uh + uh / 2), 1, 1).data;
      if (d[3] < 40) { line += "."; continue; }
      const hex = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
      let best = "?";
      let bestD = 1e9;
      for (const [ch, col] of Object.entries(palette)) {
        const n = parseInt(col.slice(1), 16);
        const dr = (n >> 16) - d[0], dg = ((n >> 8) & 255) - d[1], db = (n & 255) - d[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestD) { bestD = dist; best = ch; }
      }
      line += best;
    }
    rows.push(`${String(r).padStart(2)} ${line}`);
  }
  return rows.join("\n");
});
console.log(data);
await browser.close();
