/* ============================================================
   KNOWLEDGE APP — five worlds, flashcards, quiz, boss, match,
   progress, Pomodoro, import/export and keyboard navigation.
   ============================================================ */

import "@fontsource/fraunces/600.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import "../styles.css";
import "./styles.css";

import { CONFIG } from "../src/config.js";
import { initLoader } from "../loader/index.js";
import { createAudioEngine } from "../enhancements/audio-engine.js";
import { WORLDS, worldById, worldIndex } from "./worlds.js";
import { createProgress } from "./progress.js";
import { createGuide } from "./npc.js";
import { createPomodoro, formatClock } from "./pomodoro.js";
import { createMatchGame } from "./match.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const pad = (value, size = 2) => String(Math.max(0, Math.round(Number(value) || 0))).padStart(size, "0");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TABS = ["flashcards", "quiz", "boss", "match"];
const TAB_KEYS = { f: "flashcards", q: "quiz", b: "boss", l: "match" };

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/* ------------------------------------------------------------
   BOOT: loader, audio, progress, guide
   ------------------------------------------------------------ */
const audio = createAudioEngine();
const loader = initLoader({ config: CONFIG, reducedMotion });
const progress = createProgress();
const guide = createGuide({
  canvas: $("#knGuide"),
  bubble: $("[data-npc-bubble]"),
  reducedMotion
});

const state = {
  route: { view: "map", worldId: null, tab: "flashcards" },
  flashIndex: 0,
  flashFlipped: false,
  quiz: null,
  boss: null,
  match: null,
  bossTimer: 0,
  toastTimer: 0,
  resetArmedAt: 0
};

function currentWorld() {
  return worldById(state.route.worldId);
}

function revealPage() {
  document.body.classList.add("is-ready");
}

if (window.__agrvaiLoaderDone) revealPage();
else {
  window.addEventListener("agrvai:loader-complete", revealPage, { once: true });
  window.setTimeout(revealPage, 7600);
}

/* ------------------------------------------------------------
   FEEDBACK
   ------------------------------------------------------------ */
function toast(message) {
  const node = $("[data-toast]");
  if (!node) return;
  node.textContent = message;
  node.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 2800);
}

window.addEventListener("agrvai:knowledge-award", (event) => {
  const { xp, message } = event.detail || {};
  if (message && xp) toast(`+${xp} XP · ${message.toUpperCase()}`);
  else if (message) toast(message.toUpperCase());
});

/* ------------------------------------------------------------
   HUD / MAP
   ------------------------------------------------------------ */
function reviewTotal() {
  return WORLDS.reduce(
    (sum, world) =>
      sum +
      world.flashcards.filter((card) => card.revisar).length +
      world.questions.filter((question) => question.revisar).length,
    0
  );
}

function renderHUD(snapshot) {
  $("[data-hud-level]").textContent = pad(snapshot.level);
  $("[data-hud-xpnum]").textContent = pad(snapshot.current, 3);
  $("[data-hud-streak]").textContent = pad(snapshot.streak);
  $("[data-hud-xp]").style.width = `${Math.round(snapshot.ratio * 100)}%`;
  $("[data-map-known]").textContent = pad(snapshot.knownTotal);
  $("[data-map-badges]").textContent = pad(snapshot.badges.length);
  $("[data-map-review]").textContent = pad(reviewTotal());
  $("[data-hero-known]").textContent = pad(snapshot.knownTotal);
  $("[data-session-value]").textContent = `${snapshot.knownTotal}/${snapshot.cardTotal} CARDS`;
  $("[data-session-meter]").style.width = `${Math.round(snapshot.cardRatio * 100)}%`;
  $("[data-session-note]").textContent =
    snapshot.knownTotal === 0
      ? "Comece por qualquer mundo. O progresso fica salvo neste navegador."
      : `${Math.round(snapshot.cardRatio * 100)}% da base dominada · ${snapshot.badges.length} insígnia(s) · streak de ${snapshot.streak} dia(s).`;
  $("[data-review-count]").textContent = pad(reviewTotal());
  $("[data-pomo-count]").textContent = pad(snapshot.pomodoros);
}

function renderWorldCards(snapshot) {
  $$(".kn-world-card").forEach((card) => {
    const world = worldById(card.dataset.world);
    if (!world) return;
    const entry = snapshot.worlds[world.id];
    card.querySelector("[data-card-known]").textContent = `${entry.cards}/${entry.cardsTotal}`;
    card.querySelector("[data-card-quiz]").textContent = pad(entry.quizBest, 3);
    card.querySelector("[data-card-boss]").textContent = pad(entry.bossBest, 3);
    card.querySelector("[data-card-meter]").style.width = `${Math.round(entry.cardRatio * 100)}%`;
    card.querySelector("[data-card-status]").textContent =
      entry.cards === entry.cardsTotal ? "DOMINADO" : `${Math.round(entry.cardRatio * 100)}%`;
    card.setAttribute(
      "aria-label",
      `${world.name}: ${entry.cards} de ${entry.cardsTotal} cards dominados. Quiz ${entry.quizBest}. Chefe ${entry.bossBest}.`
    );
  });
}

function buildWorldCards() {
  const grid = $("[data-worlds]");
  if (!grid) return;
  grid.replaceChildren();
  WORLDS.forEach((world, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "kn-world-card";
    card.dataset.world = world.id;
    card.style.setProperty("--accent", world.color);
    card.innerHTML = `
      <span class="kn-world-card__top">
        <span class="kn-world-card__code">${world.code}</span>
        <span class="kn-world-card__idx">${pad(index + 1)}</span>
      </span>
      <span class="kn-world-card__name">${world.name}</span>
      <span class="kn-world-card__short">${world.short}</span>
      <span class="kn-world-card__meter" aria-hidden="true"><i data-card-meter></i></span>
      <span class="kn-world-card__stats">
        <span>CARDS <b data-card-known>0/8</b></span>
        <span>QUIZ <b data-card-quiz>000</b></span>
        <span>BOSS <b data-card-boss>000</b></span>
      </span>
      <span class="kn-world-card__foot">
        <span class="kn-world-card__status" data-card-status>0%</span>
        <span class="kn-world-card__go">ENTRAR ▶</span>
      </span>
    `;
    card.addEventListener("pointerenter", () => audio.sfx("click"), { passive: true });
    card.addEventListener("click", () => openWorld(world.id));
    grid.append(card);
  });
}

/* ------------------------------------------------------------
   ROUTE
   ------------------------------------------------------------ */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw) return { view: "map", worldId: null, tab: "flashcards" };
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "mundo" && parts[1]) {
    const world = worldById(parts[1]);
    if (world) {
      return {
        view: "world",
        worldId: world.id,
        tab: TABS.includes(parts[2]) ? parts[2] : "flashcards"
      };
    }
  }
  const direct = worldById(parts[0]);
  if (direct) return { view: "world", worldId: direct.id, tab: "flashcards" };
  return { view: "map", worldId: null, tab: "flashcards" };
}

function openWorld(id, tab = "flashcards") {
  if (!worldById(id)) return;
  audio.sfx("click");
  const next = `#/mundo/${id}/${tab}`;
  if (window.location.hash === next) {
    applyRoute();
    return;
  }
  window.location.hash = next;
}

function goMap() {
  audio.sfx("click");
  if (window.location.hash === "#/" || window.location.hash === "") {
    applyRoute();
    return;
  }
  window.location.hash = "#/";
}

function switchTab(tab) {
  if (!TABS.includes(tab) || state.route.view !== "world") return;
  const next = `#/mundo/${state.route.worldId}/${tab}`;
  if (window.location.hash === next) {
    applyTab(tab);
    return;
  }
  window.location.hash = next;
}

function applyRoute({ initial = false } = {}) {
  const next = parseHash();
  const worldChanged = next.worldId !== state.route.worldId;
  state.route = next;

  if (worldChanged) {
    state.flashIndex = 0;
    state.flashFlipped = false;
    state.quiz = null;
    state.boss = null;
    destroyMatch();
    stopBossTimer();
  }

  const world = currentWorld();
  if (next.view === "world" && !world) {
    goMap();
    return;
  }

  if (next.view === "map") {
    stopBossTimer();
    state.boss = null;
    state.quiz = null;
    destroyMatch();
    $("#knHero").hidden = false;
    $("#knMap").hidden = false;
    $("#knPomodoro").hidden = false;
    $("#knWorld").hidden = true;
    document.body.dataset.view = "map";
    document.title = "Base de Conhecimento — AGRVAI";
  } else {
    $("#knHero").hidden = true;
    $("#knMap").hidden = true;
    $("#knPomodoro").hidden = true;
    $("#knWorld").hidden = false;
    document.body.dataset.view = "world";
    document.title = `${world.name} — Base de Conhecimento AGRVAI`;
    renderWorldHeader(world, progress.getState());
    applyTab(next.tab, { initial });
  }

  renderAll(progress.getState());

  if (!initial) {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    if (next.view === "world") {
      $("#knWorldTitle").focus({ preventScroll: true });
      guide.say(`${world.name}. Comece pelos flashcards ou vá direto ao quiz.`, {
        hold: 4200
      });
    } else {
      $("#knMapTitle").focus({ preventScroll: true });
    }
  }
}

function applyTab(tab, { initial = false } = {}) {
  const world = currentWorld();
  if (!world) return;

  $$("[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });

  $$("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab;
  });

  if (tab === "flashcards") {
    renderFlashcard();
  } else if (tab === "quiz") {
    if (!state.quiz) startQuiz();
    else renderQuiz();
  } else if (tab === "boss") {
    if (!state.boss) renderBossIntro();
  } else if (tab === "match") {
    if (!state.match) startMatch();
  }

  if (tab !== "quiz") state.quiz = null;
  if (tab !== "boss") {
    stopBossTimer();
    state.boss = null;
  }
  if (tab !== "match") destroyMatch();

  if (!initial) {
    guide.say(
      {
        flashcards: "Vire o card, marque o que domina e deixe o resto para revisar.",
        quiz: "Dez perguntas. Use 1–4 para responder e Enter para avançar.",
        boss: "O chefe cobra rapidez. Cada erro custa uma vida e o tempo corre.",
        match: "Ligue cada termo à definição certa antes do tempo acabar."
      }[tab],
      { hold: 3600 }
    );
  }
}

window.addEventListener("hashchange", () => applyRoute());

/* ------------------------------------------------------------
   WORLD HEADER
   ------------------------------------------------------------ */
function renderWorldHeader(world, snapshot) {
  const entry = snapshot.worlds[world.id];
  $("[data-world-kicker]").textContent = `MUNDO ${pad(worldIndex(world.id) + 1)} / ESTUDO`;
  $("[data-world-title]").textContent = world.name;
  $("[data-world-lead]").textContent = world.lead;
  $("[data-world-known]").textContent = entry.cards;
  $("[data-world-quiz]").textContent = pad(entry.quizBest, 3);
  $("[data-world-boss]").textContent = pad(entry.bossBest, 3);
  $("[data-world-match]").textContent = pad(entry.matchBest, 3);
  const panel = $("#knWorld");
  panel.style.setProperty("--accent", world.color);
}

/* ------------------------------------------------------------
   FLASHCARDS
   ------------------------------------------------------------ */
function renderFlashcard() {
  const world = currentWorld();
  if (!world) return;
  const card = world.flashcards[state.flashIndex];
  const snapshot = progress.getState();
  const entry = snapshot.worlds[world.id];
  const known = entry.known.includes(card.id);
  const face = $("[data-flash-face]");
  const cardButton = $("[data-flash-card]");

  face.textContent = state.flashFlipped ? card.back : card.front;
  cardButton.classList.toggle("is-flipped", state.flashFlipped);
  cardButton.setAttribute(
    "aria-label",
    state.flashFlipped
      ? `Definição: ${card.back}. Clique para voltar ao termo.`
      : `Flashcard: ${card.front}. Clique para virar.`
  );
  $("[data-flash-count]").textContent = `${pad(state.flashIndex + 1)}/${pad(world.flashcards.length)}`;
  $("[data-flash-known-count]").textContent = `${entry.cards} DOMINADOS`;
  $("[data-flash-review]").hidden = !card.revisar;
  $("[data-flash-bar]").style.width = `${Math.round(entry.cardRatio * 100)}%`;

  const knownButton = $("[data-flash-known]");
  if (knownButton) {
    knownButton.textContent = known ? "DOMINADO ✓" : "DOMINEI";
    knownButton.classList.toggle("is-known", known);
  }
}

function goFlash(delta) {
  const world = currentWorld();
  if (!world) return;
  const total = world.flashcards.length;
  state.flashIndex = (state.flashIndex + delta + total) % total;
  state.flashFlipped = false;
  renderFlashcard();
}

function flipFlash() {
  state.flashFlipped = !state.flashFlipped;
  audio.sfx("click");
  renderFlashcard();
}

function markFlash(known) {
  const world = currentWorld();
  if (!world) return;
  const card = world.flashcards[state.flashIndex];
  const before = progress.getState();
  const entry = before.worlds[world.id];
  const wasKnown = entry.known.includes(card.id);

  progress.markCard(world.id, card.id, known);
  audio.sfx(known ? "coin" : "click");

  if (known && !wasKnown) {
    guide.say("Card dominado. Próximo.", { hold: 2400 });
  } else if (known && wasKnown) {
    toast("ESTE CARD JÁ ESTAVA DOMINADO");
  } else {
    toast("CARD MARCADO PARA REVISAR");
    guide.say("Sem problema. Revisar também é estudar.", { hold: 2400 });
  }

  const after = progress.getState();
  if (
    after.knownTotal === after.cardTotal &&
    !after.badges.includes("colecionador")
  ) {
    progress.award({
      xp: 50,
      badge: "colecionador",
      message: "Base completa"
    });
    guide.say("Todos os cards dominados. A base é sua.", { hold: 5200 });
  }

  state.flashFlipped = false;
  state.flashIndex = (state.flashIndex + 1) % world.flashcards.length;
  renderFlashcard();
}

/* ------------------------------------------------------------
   QUIZ
   ------------------------------------------------------------ */
function startQuiz() {
  const world = currentWorld();
  if (!world) return;
  state.quiz = {
    questions: shuffle(world.questions),
    index: 0,
    score: 0,
    correct: 0,
    answered: false,
    selected: null,
    finished: false,
    result: null
  };
  renderQuiz();
}

function renderQuiz() {
  const host = $("[data-quiz]");
  if (!host) return;
  const quiz = state.quiz;
  if (!quiz) {
    host.replaceChildren();
    return;
  }
  if (quiz.finished) {
    renderQuizResult();
    return;
  }

  const world = currentWorld();
  const question = quiz.questions[quiz.index];
  host.innerHTML = `
    <div class="kn-quiz__head">
      <p class="kn-quiz__count" data-quiz-count>QUESTÃO ${pad(quiz.index + 1)}/${pad(quiz.questions.length)}</p>
      <p class="kn-quiz__score" data-quiz-score>${pad(quiz.score, 3)} PX</p>
    </div>
    <div class="kn-meter kn-quiz__bar" aria-hidden="true"><i data-quiz-bar style="width:${Math.round((quiz.index / quiz.questions.length) * 100)}%"></i></div>
    <h3 class="kn-quiz__question" data-quiz-question tabindex="-1">${question.question}</h3>
    <div class="kn-quiz__options" data-quiz-options role="group" aria-label="Alternativas">
      ${question.options
        .map(
          (option, index) => `
            <button type="button" class="kn-quiz__option" data-option="${index}">
              <span class="kn-quiz__key" aria-hidden="true">${index + 1}</span>
              <span>${option}</span>
            </button>`
        )
        .join("")}
    </div>
    <p class="kn-quiz__feedback" data-quiz-feedback aria-live="polite"></p>
    <div class="kn-quiz__actions">
      <button class="pixel-btn pixel-btn--solid" type="button" data-quiz-next hidden>${
        quiz.index + 1 >= quiz.questions.length ? "VER RESULTADO ▶" : "PRÓXIMA ▶"
      }</button>
    </div>
  `;

  $$("[data-option]", host).forEach((button) => {
    button.addEventListener("click", () => answerQuiz(Number(button.dataset.option)));
  });
  $("[data-quiz-next]", host).addEventListener("click", nextQuiz);
  $("[data-quiz-question]", host).focus({ preventScroll: true });
}

function answerQuiz(index) {
  const quiz = state.quiz;
  if (!quiz || quiz.finished || quiz.answered) return;
  const world = currentWorld();
  const question = quiz.questions[quiz.index];
  if (!world || !question) return;

  quiz.answered = true;
  quiz.selected = index;
  const right = index === question.answer;
  if (right) {
    quiz.correct += 1;
    quiz.score += 100;
    audio.sfx("coin");
    guide.say("Certo. Siga para a próxima.", { hold: 1800 });
  } else {
    audio.sfx("hit");
    guide.say("Quase. Leia a explicação e siga em frente.", { hold: 2200 });
  }

  const host = $("[data-quiz]");
  $$("[data-option]", host).forEach((button) => {
    const option = Number(button.dataset.option);
    button.disabled = true;
    if (option === question.answer) button.classList.add("is-correct");
    else if (option === index) button.classList.add("is-wrong");
  });

  const feedback = $("[data-quiz-feedback]", host);
  feedback.innerHTML = right
    ? `<b class="is-right">ACERTOU · +100 PX</b> ${question.explanation}`
    : `<b class="is-wrong">RESPOSTA CERTA: ${question.options[question.answer]}</b> ${question.explanation}`;
  if (question.revisar) {
    const tag = document.createElement("span");
    tag.className = "kn-tag kn-tag--review";
    tag.textContent = "REVISAR";
    feedback.append(" ", tag);
  }

  $("[data-quiz-score]", host).textContent = `${pad(quiz.score, 3)} PX`;
  const bar = $("[data-quiz-bar]", host);
  if (bar) bar.style.width = `${Math.round(((quiz.index + 1) / quiz.questions.length) * 100)}%`;
  const next = $("[data-quiz-next]", host);
  next.hidden = false;
  next.focus({ preventScroll: true });
}

function nextQuiz() {
  const quiz = state.quiz;
  if (!quiz || !quiz.answered || quiz.finished) return;
  if (quiz.index + 1 >= quiz.questions.length) {
    finishQuiz();
    return;
  }
  quiz.index += 1;
  quiz.answered = false;
  quiz.selected = null;
  audio.sfx("click");
  renderQuiz();
}

function finishQuiz() {
  const quiz = state.quiz;
  const world = currentWorld();
  if (!quiz || !world) return;
  const before = progress.getState().xp;
  const snapshot = progress.recordQuiz(world.id, {
    score: quiz.score,
    correct: quiz.correct,
    total: quiz.questions.length
  });
  quiz.finished = true;
  quiz.result = {
    snapshot,
    gained: snapshot.xp - before,
    best: snapshot.worlds[world.id].quizBest
  };
  audio.sfx(quiz.correct === quiz.questions.length ? "win" : "power");
  renderQuizResult();
}

function renderQuizResult() {
  const quiz = state.quiz;
  const world = currentWorld();
  const host = $("[data-quiz]");
  if (!quiz || !world || !quiz.result) return;
  const { gained, best } = quiz.result;
  const perfect = quiz.correct === quiz.questions.length;
  host.innerHTML = `
    <div class="kn-result">
      <p class="kn-result__tag">QUIZ CONCLUÍDO · ${world.name}</p>
      <h3 class="kn-result__title">${perfect ? "GABARITO PERFEITO" : quiz.correct >= 7 ? "BOM DOMÍNIO" : "SEGUE O JOGO"}</h3>
      <p class="kn-result__score">${pad(quiz.score, 3)} <span>PX</span></p>
      <p class="kn-result__line">${quiz.correct}/${quiz.questions.length} ACERTOS · +${gained} XP · RECORDE ${pad(best, 3)}</p>
      <p class="kn-result__note">${
        perfect
          ? "Insígnia de gabarito desbloqueada. Agora teste a velocidade no chefe."
          : "Revise as explicações e repita. Cada tentativa vale XP."
      }</p>
      <div class="kn-result__actions">
        <button class="pixel-btn pixel-btn--solid" type="button" data-quiz-again>REPETIR QUIZ</button>
        <button class="pixel-btn" type="button" data-quiz-boss>ENFRENTAR BOSS</button>
        <button class="pixel-btn" type="button" data-quiz-map>VOLTAR AO MAPA</button>
      </div>
    </div>
  `;
  $("[data-quiz-again]", host).addEventListener("click", startQuiz);
  $("[data-quiz-boss]", host).addEventListener("click", () => switchTab("boss"));
  $("[data-quiz-map]", host).addEventListener("click", goMap);
  guide.say(
    perfect
      ? "Gabarito perfeito. O chefe é o próximo passo."
      : "Resultado registrado. Repetir é a melhor revisão.",
    { hold: 4200 }
  );
}

/* ------------------------------------------------------------
   BOSS
   ------------------------------------------------------------ */
const SKULL = [
  "..########..",
  ".##########.",
  "############",
  "###oo##oo###",
  "###oo##oo###",
  "############",
  ".###.##.###.",
  "..########..",
  "...######...",
  "..##.##.##..",
  "..#..##..#..",
  "............"
];

function drawBoss(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const cell = canvas.width / SKULL[0].length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  SKULL.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === ".") return;
      ctx.fillStyle = char === "o" ? "#ED3D91" : "#EDEDED";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    });
  });
}

function renderBossIntro() {
  const world = currentWorld();
  if (!world) return;
  stopBossTimer();
  state.boss = null;
  const host = $("[data-boss]");
  host.innerHTML = `
    <div class="kn-boss__intro">
      <div class="kn-boss__portrait">
        <canvas width="144" height="144" data-boss-canvas aria-hidden="true"></canvas>
        <p class="kn-boss__name">GLITCH DO ESQUECIMENTO</p>
      </div>
      <div class="kn-boss__brief">
        <p class="kicker">CHEFE DO MUNDO · ${world.name}</p>
        <h3 class="kn-boss__title">Prove que ficou.</h3>
        <p class="body">Oito perguntas, 15 segundos cada, três vidas e 100 de HP. Acertar causa dano; errar ou deixar o tempo acabar custa uma vida.</p>
        <ul class="kn-boss__rules">
          <li>ACERTO <b>−15 HP</b> + bônus de tempo</li>
          <li>ERRO OU TIMEOUT <b>−1 VIDA</b></li>
          <li>TECLAS <b>1–4</b> respondem · <b>ENTER</b> avança</li>
        </ul>
        <div class="kn-boss__actions">
          <button class="pixel-btn pixel-btn--solid" type="button" data-boss-start>INICIAR BOSS <span aria-hidden="true">▶</span></button>
          <button class="pixel-btn" type="button" data-boss-quiz>IR PARA O QUIZ</button>
        </div>
      </div>
    </div>
  `;
  drawBoss($("[data-boss-canvas]", host));
  $("[data-boss-start]", host).addEventListener("click", startBoss);
  $("[data-boss-quiz]", host).addEventListener("click", () => switchTab("quiz"));
  guide.say("O chefe cobra rapidez. Use 1–4 para responder.", { hold: 4200 });
}

function startBoss() {
  const world = currentWorld();
  if (!world) return;
  state.boss = {
    questions: shuffle(world.questions).slice(0, 8),
    index: 0,
    hp: 100,
    lives: 3,
    score: 0,
    timeLeft: 15,
    answered: false,
    over: false,
    timer: 0,
    deadline: 0
  };
  audio.sfx("power");
  renderBossBattle();
  renderBossQuestion();
}

function renderBossBattle() {
  const host = $("[data-boss]");
  host.innerHTML = `
    <div class="kn-boss__battle">
      <div class="kn-boss__arena" data-boss-arena>
        <canvas width="144" height="144" data-boss-canvas aria-hidden="true"></canvas>
        <div class="kn-boss__hud">
          <p class="kn-boss__name">GLITCH DO ESQUECIMENTO</p>
          <div class="kn-boss__hp" role="progressbar" aria-label="HP do chefe" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
            <i data-boss-hp style="width:100%"></i>
          </div>
          <p class="kn-boss__hudline">HP <b data-boss-hpnum>100</b>/100 · VIDAS <b data-boss-lives>♥♥♥</b> · TEMPO <b data-boss-time>15</b>s</p>
        </div>
      </div>
      <div class="kn-boss__question">
        <p class="kn-boss__count" data-boss-count>PERGUNTA 01/08</p>
        <h3 class="kn-boss__prompt" data-boss-question tabindex="-1"></h3>
        <div class="kn-boss__options" data-boss-options></div>
        <p class="kn-boss__feedback" data-boss-feedback aria-live="polite"></p>
        <button class="pixel-btn pixel-btn--solid" type="button" data-boss-next hidden>PRÓXIMA ▶</button>
      </div>
    </div>
  `;
  drawBoss($("[data-boss-canvas]", host));
}

function renderBossQuestion() {
  const boss = state.boss;
  const host = $("[data-boss]");
  if (!boss || !host) return;
  const question = boss.questions[boss.index];
  boss.answered = false;
  boss.timeLeft = 15;

  $("[data-boss-count]", host).textContent = `PERGUNTA ${pad(boss.index + 1)}/${pad(boss.questions.length)}`;
  $("[data-boss-question]", host).textContent = question.question;
  $("[data-boss-feedback]", host).textContent =
    "Escolha uma alternativa. O tempo está correndo.";
  const options = $("[data-boss-options]", host);
  options.innerHTML = question.options
    .map(
      (option, index) => `
        <button type="button" class="kn-quiz__option" data-boss-option="${index}">
          <span class="kn-quiz__key" aria-hidden="true">${index + 1}</span>
          <span>${option}</span>
        </button>`
    )
    .join("");
  $$("[data-boss-option]", options).forEach((button) => {
    button.addEventListener("click", () => answerBoss(Number(button.dataset.bossOption)));
  });
  const next = $("[data-boss-next]", host);
  next.hidden = true;
  $("[data-boss-question]", host).focus({ preventScroll: true });
  paintBossHUD();
  startBossTimer();
}

function paintBossHUD() {
  const boss = state.boss;
  if (!boss) return;
  const hp = Math.max(0, boss.hp);
  const hpBar = $("[data-boss-hp]");
  if (hpBar) hpBar.style.width = `${hp}%`;
  const hpNum = $("[data-boss-hpnum]");
  if (hpNum) hpNum.textContent = hp;
  const lives = $("[data-boss-lives]");
  if (lives) lives.textContent = "♥".repeat(Math.max(0, boss.lives)) || "—";
  const time = $("[data-boss-time]");
  if (time) time.textContent = Math.max(0, boss.timeLeft);
  const progressBar = $(".kn-boss__hp");
  if (progressBar) progressBar.setAttribute("aria-valuenow", String(hp));
}

function startBossTimer() {
  const boss = state.boss;
  if (!boss || boss.over) return;
  stopBossTimer();
  boss.deadline = Date.now() + boss.timeLeft * 1000;
  state.bossTimer = window.setInterval(() => {
    if (!state.boss || state.boss.answered || state.boss.over) return;
    state.boss.timeLeft = Math.max(
      0,
      Math.ceil((state.boss.deadline - Date.now()) / 1000)
    );
    paintBossHUD();
    if (state.boss.timeLeft <= 0) bossTimeout();
  }, 200);
}

function stopBossTimer() {
  window.clearInterval(state.bossTimer);
  state.bossTimer = 0;
}

function answerBoss(index) {
  const boss = state.boss;
  const host = $("[data-boss]");
  if (!boss || boss.over || boss.answered || !host) return;
  const question = boss.questions[boss.index];
  boss.answered = true;
  stopBossTimer();
  boss.timeLeft = Math.max(0, Math.ceil((boss.deadline - Date.now()) / 1000));
  const right = index === question.answer;

  $$("[data-boss-option]", host).forEach((button) => {
    const option = Number(button.dataset.bossOption);
    button.disabled = true;
    if (option === question.answer) button.classList.add("is-correct");
    else if (option === index) button.classList.add("is-wrong");
  });

  const feedback = $("[data-boss-feedback]", host);
  if (right) {
    boss.hp = Math.max(0, boss.hp - 15);
    boss.score += 100 + boss.timeLeft * 5;
    audio.sfx("coin");
    feedback.innerHTML = `<b class="is-right">DANO · −15 HP</b> ${question.explanation}`;
    const arena = $("[data-boss-arena]", host);
    arena.classList.remove("is-hit");
    void arena.offsetWidth;
    arena.classList.add("is-hit");
  } else {
    boss.lives -= 1;
    audio.sfx("hit");
    feedback.innerHTML = `<b class="is-wrong">ERRO · RESPOSTA: ${question.options[question.answer]}</b> ${question.explanation}`;
  }

  paintBossHUD();

  if (boss.hp <= 0) {
    winBoss();
    return;
  }
  if (boss.lives <= 0) {
    loseBoss("Vidas esgotadas. O chefe resistiu.");
    return;
  }

  const next = $("[data-boss-next]", host);
  next.hidden = false;
  next.focus({ preventScroll: true });
}

function bossTimeout() {
  const boss = state.boss;
  const host = $("[data-boss]");
  if (!boss || boss.over || boss.answered || !host) return;
  boss.answered = true;
  boss.timeLeft = 0;
  boss.lives -= 1;
  stopBossTimer();
  audio.sfx("hit");
  const question = boss.questions[boss.index];
  $$("[data-boss-option]", host).forEach((button) => {
    button.disabled = true;
    if (Number(button.dataset.bossOption) === question.answer) {
      button.classList.add("is-correct");
    }
  });
  $("[data-boss-feedback]", host).innerHTML =
    `<b class="is-wrong">TEMPO ESGOTADO · −1 VIDA</b> ${question.explanation}`;
  paintBossHUD();
  if (boss.lives <= 0) {
    loseBoss("O tempo venceu. O chefe resistiu.");
    return;
  }
  const next = $("[data-boss-next]", host);
  next.hidden = false;
  next.focus({ preventScroll: true });
}

function nextBoss() {
  const boss = state.boss;
  if (!boss || boss.over || !boss.answered) return;
  if (boss.index + 1 >= boss.questions.length) {
    loseBoss("O chefe resistiu ao turno. Repita o quiz e volte.");
    return;
  }
  boss.index += 1;
  audio.sfx("click");
  renderBossQuestion();
}

function finishBoss(win, reason) {
  const boss = state.boss;
  const world = currentWorld();
  const host = $("[data-boss]");
  if (!boss || !world || !host) return;
  boss.over = true;
  stopBossTimer();
  const before = progress.getState().xp;
  const snapshot = progress.recordBoss(world.id, {
    score: boss.score + (win ? 200 : 0),
    win
  });
  const gained = snapshot.xp - before;
  audio.sfx(win ? "win" : "lose");
  host.innerHTML = `
    <div class="kn-result kn-result--boss">
      <p class="kn-result__tag">CHEFE · ${world.name}</p>
      <h3 class="kn-result__title">${win ? "GLITCH DERROTADO" : "O CHEFE RESISTIU"}</h3>
      <p class="kn-result__score">${pad(boss.score + (win ? 200 : 0), 3)} <span>PX</span></p>
      <p class="kn-result__line">HP ${Math.max(0, boss.hp)}/100 · ${boss.lives} VIDA(S) · +${gained} XP</p>
      <p class="kn-result__note">${reason}</p>
      <div class="kn-result__actions">
        <button class="pixel-btn pixel-btn--solid" type="button" data-boss-again>REPETIR BOSS</button>
        <button class="pixel-btn" type="button" data-boss-map>VOLTAR AO MAPA</button>
      </div>
    </div>
  `;
  $("[data-boss-again]", host).addEventListener("click", () => {
    state.boss = null;
    renderBossIntro();
  });
  $("[data-boss-map]", host).addEventListener("click", goMap);
  guide.say(
    win
      ? "Chefe derrotado. Esse mundo já tem dono."
      : "O chefe venceu desta vez. Revise os cards e tente de novo.",
    { hold: 5000 }
  );
}

function winBoss() {
  const boss = state.boss;
  if (!boss) return;
  finishBoss(true, "Você zerou o HP do chefe antes das vidas acabarem.");
}

function loseBoss(reason) {
  const boss = state.boss;
  if (!boss) return;
  finishBoss(false, reason);
}

/* ------------------------------------------------------------
   MATCH MINIGAME
   ------------------------------------------------------------ */
function startMatch() {
  const world = currentWorld();
  if (!world) return;
  destroyMatch();
  const host = $("[data-match-host]");
  if (!host) return;
  state.match = createMatchGame({
    mount: host,
    world,
    reducedMotion,
    sfx: (name) => audio.sfx(name),
    onStatus: (text) => {
      const hint = host.querySelector(".kn-match__hint");
      if (hint) hint.textContent = text;
    },
    onFinish: (result) => {
      state.match = null;
      const before = progress.getState().xp;
      const snapshot = progress.recordMatch(world.id, result);
      const gained = snapshot.xp - before;
      audio.sfx(result.won ? "win" : "lose");
      renderMatchResult(host, result, gained);
    }
  });
}

function destroyMatch() {
  if (state.match) {
    state.match.destroy();
    state.match = null;
  }
  const host = $("[data-match-host]");
  if (host) host.replaceChildren();
}

function renderMatchResult(host, result, gained) {
  host.innerHTML = `
    <div class="kn-result">
      <p class="kn-result__tag">MINIGAME · LIGUE OS CONCEITOS</p>
      <h3 class="kn-result__title">${result.won ? "TODOS OS PARES" : "TEMPO ESGOTADO"}</h3>
      <p class="kn-result__score">${pad(result.score, 3)} <span>PX</span></p>
      <p class="kn-result__line">${result.matched}/4 PARES · ${result.attempts} TENTATIVA(S) · +${gained} XP</p>
      <p class="kn-result__note">${
        result.won
          ? "Bônus de tempo aplicado. Tente fechar mais rápido na próxima."
          : "Ligue os termos que você já domina e volte para os cards difíceis."
      }</p>
      <div class="kn-result__actions">
        <button class="pixel-btn pixel-btn--solid" type="button" data-match-again>JOGAR DE NOVO</button>
        <button class="pixel-btn" type="button" data-match-quiz>IR PARA O QUIZ</button>
        <button class="pixel-btn" type="button" data-match-map>VOLTAR AO MAPA</button>
      </div>
    </div>
  `;
  $("[data-match-again]", host).addEventListener("click", startMatch);
  $("[data-match-quiz]", host).addEventListener("click", () => switchTab("quiz"));
  $("[data-match-map]", host).addEventListener("click", goMap);
  guide.say(
    result.won
      ? "Pares completos. Esse conteúdo já está ligado na memória."
      : "Tempo curto. Refaça os flashcards e volte.",
    { hold: 4200 }
  );
}

/* ------------------------------------------------------------
   POMODORO
   ------------------------------------------------------------ */
const pomodoro = createPomodoro({
  onTick: renderPomodoro,
  onComplete: (mode) => {
    if (mode === "focus") {
      progress.completePomodoro();
      audio.sfx("win");
      guide.say("Ciclo concluído. Levante, beba água e volte em cinco minutos.", {
        hold: 5600
      });
    } else {
      audio.sfx("coin");
      toast("PAUSA ENCERRADA · PRONTO PARA OUTRO FOCO");
      guide.say("Pausa encerrada. Bora para mais vinte e cinco?", {
        hold: 4200
      });
    }
  }
});

function renderPomodoro(current = pomodoro.state()) {
  const clock = $("[data-pomo-clock]");
  if (!clock) return;
  clock.textContent = formatClock(current.remaining);
  $("[data-pomo-mode]").textContent = current.mode === "focus" ? "FOCO" : "PAUSA";
  const toggle = $("[data-pomo-toggle]");
  toggle.textContent = current.running
    ? "PAUSAR"
    : current.mode === "focus"
      ? "INICIAR"
      : "RETOMAR";
  document.body.classList.toggle("is-pomo-rest", current.mode === "rest");
}

/* ------------------------------------------------------------
   PROGRESS DIALOG / IMPORT / EXPORT
   ------------------------------------------------------------ */
const BADGES = {
  pomodoro: "FOCO 25",
  colecionador: "COLEÇÃO COMPLETA",
  ...Object.fromEntries(
    WORLDS.flatMap((world) => [
      [`${world.id}:gabarito`, `GABARITO ${world.name}`],
      [`${world.id}:boss`, `CHEFE ${world.name}`],
      [`${world.id}:match`, `LIGA ${world.name}`]
    ])
  )
};

function renderProgressDialog(snapshot) {
  const body = $("[data-progress-body]");
  if (!body) return;
  body.innerHTML = `
    <div class="kn-progress__hero">
      <div>
        <p class="kn-progress__level">NÍVEL <b>${pad(snapshot.level)}</b></p>
        <p class="kn-progress__meta">${pad(snapshot.current, 3)}/${snapshot.needed} XP · STREAK ${pad(snapshot.streak)} · ${pad(snapshot.pomodoros)} POMODOROS</p>
      </div>
      <div class="kn-meter kn-progress__xp" aria-hidden="true"><i style="width:${Math.round(snapshot.ratio * 100)}%"></i></div>
    </div>

    <div class="kn-progress__worlds">
      ${WORLDS.map((world) => {
        const entry = snapshot.worlds[world.id];
        return `
          <div class="kn-progress__world" style="--accent:${world.color}">
            <p class="kn-progress__world-name">${world.name}</p>
            <p>CARDS <b>${entry.cards}/${entry.cardsTotal}</b></p>
            <p>QUIZ <b>${pad(entry.quizBest, 3)}</b> · BOSS <b>${pad(entry.bossBest, 3)}</b> · LIGA <b>${pad(entry.matchBest, 3)}</b></p>
          </div>`;
      }).join("")}
    </div>

    <div class="kn-progress__badges">
      <p class="kn-progress__label">INSÍGNIAS</p>
      <div class="kn-progress__badge-list">
        ${
          snapshot.badges.length
            ? snapshot.badges
                .map(
                  (badge) =>
                    `<span class="kn-badge">${BADGES[badge] || badge}</span>`
                )
                .join("")
            : `<span class="kn-progress__empty">NENHUMA AINDA — JOGUE UMA PARTIDA.</span>`
        }
      </div>
    </div>

    <div class="kn-progress__actions">
      <button class="pixel-btn" type="button" data-export>EXPORTAR JSON</button>
      <button class="pixel-btn" type="button" data-import>IMPORTAR JSON</button>
      <button class="pixel-btn kn-progress__reset" type="button" data-reset>ZERAR PROGRESSO</button>
    </div>
    <input type="file" accept="application/json,.json" data-import-file hidden>
    <details class="kn-progress__paste">
      <summary>COLAR JSON</summary>
      <textarea data-import-text rows="5" spellcheck="false" aria-label="Cole o JSON de progresso"></textarea>
      <button class="pixel-btn" type="button" data-import-apply>APLICAR JSON</button>
    </details>
  `;

  $("[data-export]", body).addEventListener("click", exportProgress);
  $("[data-import]", body).addEventListener("click", () => $("[data-import-file]", body).click());
  $("[data-import-file]", body).addEventListener("change", importFromFile);
  $("[data-import-apply]", body).addEventListener("click", importFromText);
  $("[data-reset]", body).addEventListener("click", resetProgress);
}

function openProgress() {
  audio.sfx("click");
  renderProgressDialog(progress.getState());
  const dialog = $("#knProgressDialog");
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  $("[data-close-progress]", dialog)?.focus({ preventScroll: true });
}

function closeProgress() {
  const dialog = $("#knProgressDialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  else dialog.removeAttribute("open");
}

function exportProgress() {
  const blob = new Blob([progress.exportJSON()], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agrvai-conhecimento.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  audio.sfx("coin");
  toast("PROGRESSO EXPORTADO");
}

async function importFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    applyImport(text);
  } catch {
    toast("NÃO FOI POSSÍVEL LER O ARQUIVO");
  } finally {
    event.target.value = "";
  }
}

function importFromText() {
  const textarea = $("[data-import-text]");
  if (!textarea) return;
  applyImport(textarea.value);
}

function applyImport(text) {
  const ok = progress.importJSON(text);
  if (ok) {
    audio.sfx("win");
    toast("PROGRESSO IMPORTADO");
    renderProgressDialog(progress.getState());
  } else {
    audio.sfx("hit");
    toast("JSON INVÁLIDO — VERIFIQUE O ARQUIVO");
  }
}

function resetProgress() {
  const button = $("[data-reset]");
  const now = Date.now();
  if (now - state.resetArmedAt > 3200) {
    state.resetArmedAt = now;
    if (button) button.textContent = "CONFIRMAR ZERAR?";
    toast("CLIQUE NOVAMENTE PARA ZERAR");
    return;
  }
  state.resetArmedAt = 0;
  progress.reset();
  renderProgressDialog(progress.getState());
  audio.sfx("lose");
  toast("PROGRESSO ZERADO");
  guide.say("Começando do zero. Todo pixel conta.", { hold: 3600 });
}

/* ------------------------------------------------------------
   SOUND
   ------------------------------------------------------------ */
function updateSoundUI() {
  const enabled = audio.isEnabled();
  $$("[data-sound]").forEach((button) => {
    button.textContent = `SOM: ${enabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.classList.toggle("is-on", enabled);
  });
}

window.addEventListener("agrvai:sound-change", updateSoundUI);

/* ------------------------------------------------------------
   RENDER ALL
   ------------------------------------------------------------ */
function renderAll(snapshot) {
  renderHUD(snapshot);
  renderWorldCards(snapshot);
  if (state.route.view === "world") {
    const world = currentWorld();
    if (world) {
      renderWorldHeader(world, snapshot);
      if (state.route.tab === "flashcards") renderFlashcard();
    }
  }
}

progress.subscribe((snapshot, detail) => {
  renderAll(snapshot);
  const dialog = $("#knProgressDialog");
  if (dialog?.open && (detail.award || detail.imported || detail.reset || detail.card)) {
    renderProgressDialog(snapshot);
  }
});

/* ------------------------------------------------------------
   EVENTS
   ------------------------------------------------------------ */
function bindEvents() {
  $("[data-sound]")?.addEventListener("click", () => {
    const enabled = audio.setEnabled(!audio.isEnabled());
    updateSoundUI();
    toast(enabled ? "SOM ATIVADO" : "SOM DESATIVADO");
  });

  $$("[data-progress]").forEach((button) =>
    button.addEventListener("click", openProgress)
  );

  $("[data-close-progress]")?.addEventListener("click", closeProgress);
  $("#knProgressDialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeProgress();
  });

  $("[data-back]")?.addEventListener("click", goMap);

  $("[data-resume]")?.addEventListener("click", () => {
    const snapshot = progress.getState();
    const seen = WORLDS.map((world) => ({
      world,
      at: snapshot.worlds[world.id].lastSeen
    }))
      .filter((entry) => entry.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
    const target = seen[0]?.world || WORLDS[0];
    openWorld(target.id, "flashcards");
  });

  $("[data-map-jump]")?.addEventListener("click", () => {
    audio.sfx("click");
    $("#knMap")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start"
    });
  });

  $$("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      audio.sfx("click");
      switchTab(button.dataset.tab);
    });
  });

  const tablist = $(".kn-tabs");
  tablist?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const tabs = $$("[data-tab]", tablist);
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    switchTab(tabs[next].dataset.tab);
  });

  $("[data-flash-card]")?.addEventListener("click", flipFlash);
  $("[data-flash-prev]")?.addEventListener("click", () => {
    audio.sfx("click");
    goFlash(-1);
  });
  $("[data-flash-next]")?.addEventListener("click", () => {
    audio.sfx("click");
    goFlash(1);
  });
  $("[data-flash-known]")?.addEventListener("click", () => markFlash(true));
  $("[data-flash-review-btn]")?.addEventListener("click", () => markFlash(false));

  $("[data-pomo-toggle]")?.addEventListener("click", () => {
    const current = pomodoro.toggle();
    audio.sfx("click");
    toast(current.running ? "FOCO INICIADO" : "POMODORO PAUSADO");
  });
  $("[data-pomo-reset]")?.addEventListener("click", () => {
    pomodoro.reset();
    audio.sfx("click");
    toast("POMODORO ZERADO");
  });
  $("[data-pomo-skip]")?.addEventListener("click", () => {
    pomodoro.skip();
    audio.sfx("click");
    toast("CICLO PULADO — SEM XP");
  });

  document.addEventListener("keydown", onKeydown);
}

function onKeydown(event) {
  if (document.querySelector("dialog[open]")) return;
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const key = event.key;
  const lower = key.toLowerCase();

  if (key === "Escape") {
    if (state.route.view === "world") {
      event.preventDefault();
      goMap();
    }
    return;
  }

  if (state.route.view === "map") {
    if (/^[1-5]$/.test(key)) {
      event.preventDefault();
      openWorld(WORLDS[Number(key) - 1].id);
    }
    if (lower === "p") {
      event.preventDefault();
      openProgress();
    }
    return;
  }

  if (TAB_KEYS[lower] && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (
      event.target.closest("button, a") &&
      (key === "Enter" || key === " ")
    ) {
      return;
    }
    event.preventDefault();
    switchTab(TAB_KEYS[lower]);
    return;
  }

  if (state.route.tab === "flashcards") {
    if (key === "ArrowRight") {
      event.preventDefault();
      goFlash(1);
      return;
    }
    if (key === "ArrowLeft") {
      event.preventDefault();
      goFlash(-1);
      return;
    }
    if (key === "Enter" || key === " ") {
      if (event.target.closest("button")) return;
      event.preventDefault();
      flipFlash();
      return;
    }
    if (key === "1") {
      event.preventDefault();
      markFlash(true);
      return;
    }
    if (key === "2") {
      event.preventDefault();
      markFlash(false);
      return;
    }
  }

  if (state.route.tab === "quiz" && state.quiz && !state.quiz.finished) {
    if (/^[1-4]$/.test(key)) {
      event.preventDefault();
      answerQuiz(Number(key) - 1);
      return;
    }
    if (key === "Enter" && state.quiz.answered) {
      event.preventDefault();
      nextQuiz();
    }
  }

  if (state.route.tab === "boss" && state.boss && !state.boss.over) {
    if (/^[1-4]$/.test(key) && !state.boss.answered) {
      event.preventDefault();
      answerBoss(Number(key) - 1);
      return;
    }
    if (key === "Enter" && state.boss.answered) {
      event.preventDefault();
      nextBoss();
    }
  }
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
buildWorldCards();
bindEvents();
renderAll(progress.getState());
updateSoundUI();
renderPomodoro();
$("#knWorldTitle").setAttribute("tabindex", "-1");
$("#knMapTitle").setAttribute("tabindex", "-1");
state.route = parseHash();
applyRoute({ initial: true });

/* Keep the audio engine available for debugging / tests without
   leaking it into the UI. */
window.__agrvaiKnowledge = {
  progress,
  pomodoro,
  audio,
  loader,
  openWorld,
  goMap,
  switchTab,
  state
};
