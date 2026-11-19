# Fase 2 — Loader de entrada

## Escopo

Adicionar uma sequência de boot curta e opinativa, sem tocar no layout, copy,
cores ou tipografia do portfólio. Tudo vive em `loader/` e entra por um import
estático no topo de `main.js`.

## O que mudou

- Overlay `position: fixed` com painel de boot, logo pixel, barra segmentada,
  status, percentual e botão **PULAR [ESC]**.
- Progresso sincronizado com `document.fonts.ready` e com o evento `load`;
  mínimo de ~1,45 s e teto de ~4,6 s para nunca prender a página.
- Ao terminar (ou pular), remove o bloqueio de scroll e dispara
  `agrvai:loader-complete` no `window`, com `{ skipped, reason, duration }`.
- `window.__agrvaiLoaderDone` permite que camadas carregadas depois (balão de
  fala) saibam que o boot já terminou.
- `CONFIG.features.loader === false` desliga o overlay e emite o evento na hora.
- `localStorage.agrvai-loader-skip = "1"` pula o overlay (usado pelas capturas).
- `prefers-reduced-motion`: sem varredura/scanlines, progresso estático curto.
- Acessibilidade: `role="dialog"`, `aria-modal`, `aria-live` no status,
  `role="progressbar"` com `aria-valuenow`, foco inicial no painel, Tab preso no
  botão de pular e Escape para sair.

## Verificação

- `npm run build` sem erros.
- `node scripts/shot-loader.mjs`:
  - desktop e mobile exibem o overlay e concluem com `reason: "ready"`;
  - evento `agrvai:loader-complete` disparado uma vez;
  - overflow do documento volta a `visible`;
  - modo reduzido conclui em menos de 1 s;
  - botão PULAR remove o overlay e mantém `__agrvaiLoaderDone === true`;
  - nenhum erro de console.
- `node scripts/shot-character.mjs` e `node scripts/shot-enhancements.mjs`
  continuam passando; o balão só começa depois do boot.

## Arquivos

- `loader/index.js`
- `loader/styles.css`
- `main.js`
- `enhancements/index.js`
- `scripts/shot-loader.mjs`
- `docs/PHASE-02-LOADER.md`

## Próxima fase

Movimento e transições entre seções, com GSAP/Lenis, mantendo o modo reduzido e
as âncoras atuais funcionando.
