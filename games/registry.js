/* ============================================================
   ARCADE REGISTRY — static metadata for the 10 mini-games.
   The actual modules are imported on demand by the manager.
   ============================================================ */

export const GAMES = [
  {
    id: "snake",
    title: "PIXEL SNAKE",
    code: "SN",
    tag: "COMIDA",
    accent: "#BCED12",
    subtitle: "COMIDA = +10 PX",
    hint: "SETAS / WASD · SWIPE NO TABULEIRO",
    load: () => import("./snake.js")
  },
  {
    id: "breakout",
    title: "BREAKOUT",
    code: "BR",
    tag: "BLOCOS",
    accent: "#12C2ED",
    subtitle: "QUEBRE TODOS OS BLOCOS",
    hint: "MOVA O MOUSE / DEDO · SETAS ← →",
    load: () => import("./breakout.js")
  },
  {
    id: "pong",
    title: "PONG 8-BIT",
    code: "PN",
    tag: "DUELO",
    accent: "#F6C53A",
    subtitle: "PRIMEIRO A 7 PONTOS",
    hint: "MOUSE / DEDO · SETAS ↑ ↓",
    load: () => import("./pong.js")
  },
  {
    id: "invaders",
    title: "INVADERS",
    code: "IV",
    tag: "ALIENS",
    accent: "#ED3D91",
    subtitle: "DEFENDA A ÚLTIMA LINHA",
    hint: "← → MOVE · ESPAÇO ATIRA · TOQUE ATIRA",
    load: () => import("./invaders.js")
  },
  {
    id: "memory",
    title: "MEMORY PIXELS",
    code: "MM",
    tag: "PARES",
    accent: "#894AED",
    subtitle: "ENCONTRE OS 8 PARES",
    hint: "CLIQUE / TOQUE NAS CARTAS",
    load: () => import("./memory.js")
  },
  {
    id: "whack",
    title: "WHACK-A-PIXEL",
    code: "WK",
    tag: "REFLEXO",
    accent: "#ED7812",
    subtitle: "30 SEGUNDOS DE REFLEXO",
    hint: "CLIQUE / TOQUE NO PIXEL",
    load: () => import("./whack.js")
  },
  {
    id: "flappy",
    title: "FLAPPY PIXEL",
    code: "FL",
    tag: "VOO",
    accent: "#BCED12",
    subtitle: "NÃO TOQUE NO CANO",
    hint: "ESPAÇO / TOQUE PARA VOAR",
    load: () => import("./flappy.js")
  },
  {
    id: "merge2048",
    title: "2048 PIXELS",
    code: "24",
    tag: "SOMA",
    accent: "#F6C53A",
    subtitle: "JUNTE ATÉ 2048",
    hint: "SETAS / SWIPE · P PARA PAUSAR",
    load: () => import("./merge2048.js")
  },
  {
    id: "tetris",
    title: "TETRIS MINI",
    code: "TT",
    tag: "LINHAS",
    accent: "#12C2ED",
    subtitle: "LIMPE LINHAS, GANHE PONTOS",
    hint: "← → MOVE · ↑ GIRA · ↓ DESCE · ESPAÇO DROP",
    load: () => import("./tetris.js")
  },
  {
    id: "pacdodge",
    title: "PAC-DODGE",
    code: "PD",
    tag: "FUGA",
    accent: "#F6C53A",
    subtitle: "COLETE PONTOS, FUJA DOS FANTASMAS",
    hint: "SETAS / WASD · SWIPE",
    load: () => import("./pacdodge.js")
  }
];

export function gameById(id) {
  return GAMES.find((game) => game.id === id) || null;
}
