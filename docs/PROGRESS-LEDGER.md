# Ledger — evolução pixel-art (prompt mestre)

Estado inicial: branch `feat/enhancements`, tag `baseline`, fases 0–2 commitadas.
Edições locais não commitadas em `index.html` (título e texto do #about) são
tratadas como trabalho do autor e preservadas.

## Fases

- [x] Fase 0 — baseline, tag, inventário.
- [x] Fase 1 — personagem (primeira versão; V2 fiel ao spec em andamento).
- [x] Fase 2 — loader (primeira versão; upgrade 8-bit em andamento).
- [ ] Fase 3 — motion (WIP: Lenis + parallax + cortina de página).
- [ ] Fase 4 — minigames.
- [ ] Fase 5 — página de conhecimento.
- [ ] Fase 6 — áudio e persistência.
- [ ] Fase 7 — qualidade, testes e performance.

## Rulings

- R1: edições locais do autor em `index.html` (título "David Sousa" e texto do
  #about) têm precedência sobre a regra de copy congelada; não serão revertidas.
  Custo se errado: o diff visual do #about difere do baseline por decisão do autor.
- R2: as imagens de referência citadas no prompt não estão no repositório;
  a fidelidade do personagem será medida contra a descrição textual detalhada
  (coordenadas, paleta e camadas). Custo se errado: ajuste fino posterior.
