/* Generates docs/INVENTORY.md — the frozen contract snapshot. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../src/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const html = await readFile(join(root, "index.html"), "utf8");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const classes = [...new Set(
  [...html.matchAll(/\bclass="([^"]+)"/g)]
    .flatMap((m) => m[1].split(/\s+/))
    .filter(Boolean)
)].sort();
const anchors = [...html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);

function keys(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = `${prefix}${key}`;
    if (value && typeof value === "object" && !Array.isArray(value)) return [path, ...keys(value, `${path}.`)];
    return [path];
  });
}

const configKeys = keys(CONFIG);
const lines = [
  "# Inventário — contrato congelado",
  "",
  "Gerado a partir de `index.html` e `src/config.js` antes das melhorias.",
  "Qualquer alteração fora das áreas permitidas deve ser tratada como regressão.",
  "",
  "## Âncoras de seção",
  "",
  ...anchors.map((id) => `- \`#${id}\``),
  "",
  "## IDs do documento",
  "",
  ...ids.map((id) => `- \`#${id}\``),
  "",
  "## Classes presentes no HTML",
  "",
  ...classes.map((name) => `- \`.${name}\``),
  "",
  "## Chaves do CONFIG",
  "",
  ...configKeys.map((key) => `- \`${key}\``),
  "",
  "## Elementos interativos protegidos",
  "",
  "- Personagem: `#characterCanvas`, `#heroStage`, modos Developer/Creative.",
  "- Nav Pac-Man: `#pacNav` e `#topNav`.",
  "- Dock: `#dock`.",
  "- Modal de contato: `#contactDialog` / `#contactForm`.",
  "- Tetris atual: `#tetrisCanvas`, `#tetrisNext`, `#tetrisFlash`.",
  "- Janelas: `#windowStack`, `#restoreWindows`.",
  "",
  "## Novas chaves aditivas previstas",
  "",
  "- `CONFIG.features` (loader, minigames, transitions, knowledge) — adicionada sem remover chaves.",
  "- O link `/conhecimento`, o ícone de livro no dock e o balão de fala do personagem são as únicas adições visíveis permitidas.",
  ""
];

await mkdir(join(root, "docs"), { recursive: true });
await writeFile(join(root, "docs", "INVENTORY.md"), lines.join("\n"), "utf8");
console.log(`Inventory: ${ids.length} ids, ${classes.length} classes, ${configKeys.length} config keys.`);
