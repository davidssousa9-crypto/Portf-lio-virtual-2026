# Ledger — evolução pixel-art (prompt mestre)

Estado inicial: branch `feat/enhancements`, tag `baseline`, fases 0–2 commitadas.
Edições locais não commitadas em `index.html` (título e texto do #about) são
tratadas como trabalho do autor e preservadas.

## Fases

- [x] Fase 0 — baseline, tag, inventário.
- [x] Fase 1 — personagem V2 fiel ao spec textual.
- [x] Fase 2 — loader 8-bit (Pac-Man, montagem do personagem, PRESS START).
- [x] Fase 3 — motion (Lenis + parallax + cortina de página + microinterações).
- [x] Fase 4 — minigames (10 cartuchos, HUD/XP/moedas, launcher no #tetris).
- [x] Fase 5 — página de conhecimento (5 mundos, cards, quiz, boss, ligar).
- [x] Fase 6 — áudio e persistência.
- [ ] Fase 7 — qualidade, testes e performance.

## Fase 4 — minigames

- `games/core/`: manager, shell retrô, HUD persistente, input (teclado/swipe),
  loop RAF e helpers de pixel.
- 10 jogos: snake, breakout, pong, invaders, memory, whack, flappy, 2048,
  tetris e pac-dodge. Todos expõem `{ init, start, pause, destroy }`.
- Launcher com 10 cartuchos dentro do `#tetris`, HUD LVL/XP/moedas/recorde,
  INSERT COIN para repetir, pausa por P, fechamento por ESC e Konami.
- Áudio preparado via `enhancements/audio-engine.js` (Howler + zzfx), iniciado
  apenas após gesto do usuário e sincronizado com `agrvai-sound-enabled`.
- Verificado em 1440×900 e 390×844, com teclado e toque, sem erros de console.

## Fase 5 — base de conhecimento

- Página `/conhecimento/` em Vite MPA, com hash router (`#/mundo/:id/:aba`)
  e fallback para o mapa.
- Cinco mundos (`linguagens`, `matematica`, `humanas`, `natureza`, `senai`)
  com 8 flashcards e 10 questões cada, em `knowledge/content/*.json`.
  Itens incertos usam `"revisar": true` (4 no SENAI).
- Abas Flashcards / Quiz / Boss / Ligar, com teclado (1–5, F/Q/B/L, 1–4,
  setas, Enter, ESC) e áreas de toque.
- Boss “Glitch do Esquecimento”: 8 perguntas, 15 s cada, 3 vidas, 100 HP.
- Minigame de ligar conceitos: 4 pares, 60 s, bônus por tempo restante.
- Progresso em `localStorage["agrvai-knowledge-v1"]`: XP (100/nível), cards
  dominados, recordes, streak, insígnias e ciclos Pomodoro; painel com
  importar/exportar JSON e reset em duas etapas.
- Guia NPC em canvas com fala datilografada, curto-circuito em reduced motion.
- Loader curto na rota de conhecimento: sem PRESS START, auto-reveal.
- Verificado em 1440×900 e 390×844, sem overflow horizontal e sem erros de
  console; build de produção validado em `vite preview`.

## Fase 6 — áudio e persistência

- `enhancements/audio-engine.js`: música chiptune gerada em memória (Howler)
  + efeitos zzfx, sem asset externo. Só inicia após gesto do usuário.
- Preferência única em `localStorage["agrvai-sound-enabled"]`; o motor ouve
  `agrvai:sound-change`, `agrvai:audio-unlock` e `storage` (sincroniza abas e
  atualiza o rótulo SOM: ON/OFF na página de conhecimento).
- Música pausa quando a aba fica oculta e retoma ao voltar; `destroy()`
  remove todos os listeners e libera o blob da música.
- Persistência: `agrvai-knowledge-v1` (XP, cards, recordes, streak, insígnias,
  Pomodoro, import/export) e `agrvai-arcade-v1` (HUD dos minigames) sobrevivem
  a reload; verificado na página de conhecimento e no portfólio.

## Rulings

- R1: edições locais do autor em `index.html` (título "David Sousa" e texto do
  #about) têm precedência sobre a regra de copy congelada; não serão revertidas.
  Custo se errado: o diff visual do #about difere do baseline por decisão do autor.
- R2: as imagens de referência citadas no prompt não estão no repositório;
  a fidelidade do personagem será medida contra a descrição textual detalhada
  (coordenadas, paleta e camadas). Custo se errado: ajuste fino posterior.
