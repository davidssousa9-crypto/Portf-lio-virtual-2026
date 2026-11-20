/* ============================================================
   MATCH — ligue termos e definições. Four pairs per round,
   data-driven from the world's flashcards.
   ============================================================ */

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const PAIRS = 4;
const DURATION = 60;

export function createMatchGame({
  mount,
  world,
  onFinish = null,
  onStatus = null,
  sfx = null,
  reducedMotion = false
}) {
  if (!mount || !world?.flashcards?.length) {
    return { destroy() {} };
  }

  const controller = new AbortController();
  const { signal } = controller;
  const cards = shuffle(world.flashcards).slice(0, PAIRS);
  const terms = shuffle(cards.map((card) => ({ id: card.id, label: card.front })));
  const definitions = shuffle(
    cards.map((card) => ({ id: card.id, label: card.back }))
  );
  const matched = new Set();
  let selected = null;
  let attempts = 0;
  let score = 0;
  let time = DURATION;
  let running = true;
  let timer = 0;

  mount.innerHTML = `
    <div class="kn-match">
      <div class="kn-match__head">
        <p class="kn-match__timer" data-match-timer>01:00</p>
        <p class="kn-match__score" data-match-score>000</p>
      </div>
      <div class="kn-match__board">
        <div class="kn-match__col" aria-label="Termos">
          <p class="kn-match__label">TERMO</p>
          ${terms
            .map(
              (term) =>
                `<button type="button" class="kn-match__item" data-side="term" data-id="${term.id}" aria-pressed="false">${term.label}</button>`
            )
            .join("")}
        </div>
        <div class="kn-match__col" aria-label="Definições">
          <p class="kn-match__label">DEFINIÇÃO</p>
          ${definitions
            .map(
              (definition) =>
                `<button type="button" class="kn-match__item kn-match__item--def" data-side="def" data-id="${definition.id}">${definition.label}</button>`
            )
            .join("")}
        </div>
      </div>
      <p class="kn-match__hint">LIGUE 4 PARES · 60 SEGUNDOS · CADA ERRO CUSTA 15 PX</p>
    </div>
  `;

  const timerEl = mount.querySelector("[data-match-timer]");
  const scoreEl = mount.querySelector("[data-match-score]");
  const items = Array.from(mount.querySelectorAll(".kn-match__item"));

  function paint() {
    timerEl.textContent = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
      time % 60
    ).padStart(2, "0")}`;
    scoreEl.textContent = String(score).padStart(3, "0");
    timerEl.classList.toggle("is-low", time <= 10);
  }

  function status(text) {
    onStatus?.(text);
  }

  function finish(won) {
    if (!running) return;
    running = false;
    window.clearInterval(timer);
    const bonus = won ? Math.round(time) * 5 : 0;
    const finalScore = score + bonus;
    items.forEach((item) => {
      item.disabled = true;
    });
    paint();
    onFinish?.({
      score: finalScore,
      won,
      matched: matched.size,
      attempts
    });
    status(
      won
        ? `TODOS OS PARES · +${bonus} BÔNUS DE TEMPO`
        : `TEMPO ESGOTADO · ${matched.size}/${PAIRS} PARES`
    );
  }

  function tick() {
    time -= 1;
    paint();
    if (time <= 0) finish(false);
  }

  function onItemClick(event) {
    if (!running) return;
    const item = event.currentTarget;
    if (item.classList.contains("is-matched")) return;
    const side = item.dataset.side;
    const id = item.dataset.id;

    if (side === "term") {
      items
        .filter((node) => node.dataset.side === "term")
        .forEach((node) => {
          node.classList.toggle("is-selected", node === item);
          node.setAttribute("aria-pressed", node === item ? "true" : "false");
        });
      selected = { id, item };
      sfx?.("click");
      status("TERMO SELECIONADO · ESCOLHA A DEFINIÇÃO");
      return;
    }

    if (!selected) {
      status("ESCOLHA UM TERMO PRIMEIRO");
      sfx?.("hit");
      return;
    }

    attempts += 1;
    if (selected.id === id) {
      matched.add(id);
      [selected.item, item].forEach((node) => {
        node.classList.remove("is-selected");
        node.classList.add("is-matched");
        node.setAttribute("aria-pressed", "false");
        node.disabled = true;
      });
      score += 100;
      selected = null;
      sfx?.("coin");
      status(`PAR CORRETO · ${matched.size}/${PAIRS}`);
      paint();
      if (matched.size === PAIRS) finish(true);
      return;
    }

    score = Math.max(0, score - 15);
    sfx?.("hit");
    status("PAR ERRADO · TENTE DE NOVO");
    paint();
    if (!reducedMotion) {
      item.classList.remove("is-wrong");
      void item.offsetWidth;
      item.classList.add("is-wrong");
      selected.item.classList.remove("is-wrong");
      void selected.item.offsetWidth;
      selected.item.classList.add("is-wrong");
    }
  }

  items.forEach((item) => {
    item.addEventListener("click", onItemClick, { signal });
  });

  timer = window.setInterval(tick, 1000);
  paint();
  status("LIGUE OS CONCEITOS AOS SEUS SIGNIFICADOS");

  return {
    destroy() {
      running = false;
      window.clearInterval(timer);
      controller.abort();
      mount.innerHTML = "";
    }
  };
}
