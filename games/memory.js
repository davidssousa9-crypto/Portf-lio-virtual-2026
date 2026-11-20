/* ============================================================
   MEMORY PIXELS — 4 × 4 DOM card grid, eight pairs.
   ============================================================ */

const SYMBOLS = [
  { glyph: "◆", color: "#BCED12" },
  { glyph: "●", color: "#12C2ED" },
  { glyph: "■", color: "#ED3D91" },
  { glyph: "▲", color: "#F6C53A" },
  { glyph: "✚", color: "#ED7812" },
  { glyph: "✦", color: "#894AED" },
  { glyph: "◈", color: "#EDEDED" },
  { glyph: "▣", color: "#BCED12" }
];

function shuffledDeck() {
  const deck = [...SYMBOLS, ...SYMBOLS].map((symbol, index) => ({
    ...symbol,
    id: `${index}-${Math.random().toString(16).slice(2)}`
  }));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function createGame({ shell, api }) {
  let grid = null;
  let deck = [];
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let locked = false;
  let startedAt = 0;
  let elapsed = 0;
  let timer = 0;
  let over = false;

  function build() {
    grid = document.createElement("div");
    grid.className = "pixel-memory";
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label", "Jogo da memória com oito pares de símbolos");
    deck.forEach((symbol, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pixel-memory__card";
      card.dataset.index = String(index);
      card.setAttribute("aria-label", `Carta ${index + 1}`);
      card.innerHTML = `
        <span class="pixel-memory__back" aria-hidden="true">?</span>
        <span class="pixel-memory__face" aria-hidden="true" style="--symbol-color:${symbol.color}">${symbol.glyph}</span>
      `;
      card.addEventListener("click", () => flip(index));
      grid.append(card);
    });
    shell.stage.append(grid);
  }

  function reset() {
    window.clearInterval(timer);
    deck = shuffledDeck();
    flipped = [];
    matched = 0;
    moves = 0;
    locked = false;
    over = false;
    elapsed = 0;
    startedAt = performance.now();
    api.setScore(0);
    api.setStatus("ENCONTRE OS 8 PARES");
    grid?.remove();
    build();
    timer = window.setInterval(tick, 500);
  }

  function tick() {
    if (over) return;
    elapsed = Math.floor((performance.now() - startedAt) / 1000);
    api.setStatus(`PARES ${matched}/8 · ${moves} JOGADAS · ${elapsed}s`);
  }

  function flip(index) {
    if (locked || over) return;
    const card = grid.querySelector(`[data-index="${index}"]`);
    if (!card || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;
    card.classList.add("is-flipped");
    card.setAttribute("aria-label", `Carta ${index + 1}: ${deck[index].glyph}`);
    flipped.push(index);
    api.sfx("click");

    if (flipped.length < 2) return;
    moves += 1;
    const [a, b] = flipped;
    if (deck[a].glyph === deck[b].glyph) {
      const cardA = grid.querySelector(`[data-index="${a}"]`);
      const cardB = grid.querySelector(`[data-index="${b}"]`);
      cardA.classList.add("is-matched");
      cardB.classList.add("is-matched");
      matched += 1;
      flipped = [];
      api.setScore(matched * 100);
      api.sfx("coin");
      api.setStatus(`PARES ${matched}/8 · ${moves} JOGADAS`);
      if (matched === SYMBOLS.length) finish();
      return;
    }

    locked = true;
    window.setTimeout(() => {
      grid.querySelector(`[data-index="${a}"]`)?.classList.remove("is-flipped");
      grid.querySelector(`[data-index="${b}"]`)?.classList.remove("is-flipped");
      flipped = [];
      locked = false;
    }, 620);
  }

  function finish() {
    over = true;
    window.clearInterval(timer);
    const seconds = Math.max(1, Math.floor((performance.now() - startedAt) / 1000));
    const score = Math.max(120, 1200 - moves * 28 - seconds * 8);
    api.setScore(score);
    api.win({ score, xp: 26, coins: 3 });
  }

  return {
    init() {
      reset();
    },
    start() {
      if (over) reset();
      else if (!timer) timer = window.setInterval(tick, 500);
    },
    pause() {
      window.clearInterval(timer);
      timer = 0;
    },
    destroy() {
      window.clearInterval(timer);
      grid?.remove();
    }
  };
}
