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
- [ ] Fase 5 — página de conhecimento.
- [ ] Fase 6 — áudio e persistência.
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

## Rulings

- R1: edições locais do autor em `index.html` (título "David Sousa" e texto do
  #about) têm precedência sobre a regra de copy congelada; não serão revertidas.
  Custo se errado: o diff visual do #about difere do baseline por decisão do autor.
- R2: as imagens de referência citadas no prompt não estão no repositório;
  a fidelidade do personagem será medida contra a descrição textual detalhada
  (coordenadas, paleta e camadas). Custo se errado: ajuste fino posterior.
