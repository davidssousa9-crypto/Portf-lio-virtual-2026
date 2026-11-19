# Fase 1 — Personagem reativo

## Escopo

Retrabalhar o personagem do herói sem alterar o restante do portfólio congelado:
mesma grade 28 × 30, mesmos ganchos de modo, mesma composição de canvas.

## O que mudou

- **Óculos do modelo novo:** armação de 13 px, ponte central, aro inferior
  reforçado e haste até a orelha. Paleta própria em `CONFIG.character.glassesPalette`.
- **Cabelo levemente ondulado:** mantém o volume e a silhueta originais, com
  mechas claras/escuras e fios soltos na franja.
- **Roupas do modelo novo:** camiseta branca com gola escalonada no criativo e
  jaqueta escura com costuras/painéis no desenvolvedor. Tons em
  `CONFIG.character.clothesPalette`.
- **Peito do criativo:** o coração foi substituído por **333** em azul-claro.
- **Capuz removido:** o modo desenvolvedor não troca mais a cabeça no hover; o
  hover continua apenas com o feedback sonoro.
- **Camada aditiva:** `character.js` voltou a exportar `CHARACTER_GRIDS`,
  `DEFAULT_PALETTE`, `GRID_W`, `GRID_H` e `F_LINE` para o laboratório.
- **Ganchos para as minigames:** `setGameActive`, `lookAt`, `celebrate` e `jump`
  expostos no retorno de `createCharacter`, sem alterar o frame em repouso.

## O que ficou congelado

- Estrutura da página, copy existente, cores, tipografia, âncoras e classes.
- Comportamento Criativo/Desenvolvedor, transição, piscadas, respiração,
  Pac-Man nav, dock e modal de contato.
- O balão de fala continua sobreposto ao palco, sem entrar no canvas.

## Verificação

- `npm run build` concluído sem erros.
- `node scripts/shot-character.mjs` — capturas dos dois modos sem erros de console.
- `node scripts/shot-enhancements.mjs` — balão visível com o texto correto,
  modo menu da dock e painel aberto, sem erros.
- `?debug=1` — laboratório carrega, importa os grids exportados e responde a
  hover/scroll sem erros.

## Arquivos

- `character.js`
- `character/lab.js`
- `enhancements/index.js`
- `enhancements/speech.js`
- `enhancements/dock-menu.js`
- `enhancements/styles.css`
- `src/config.js`
- `main.js`
- `docs/INVENTORY.md`
- `scripts/shot-character.mjs`
- `scripts/shot-enhancements.mjs`
- `scripts/shot-mouth.mjs`
- `scripts/inspect-character.mjs`

## Próxima fase

Loader de entrada com progresso, mensagem e evento `agrvai:loader-complete`,
respeitando `prefers-reduced-motion` e a flag `CONFIG.features.loader`.
