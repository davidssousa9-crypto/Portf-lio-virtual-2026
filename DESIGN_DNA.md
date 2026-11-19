# DESIGN DNA — AGRVAI / 8-bit portfolio

**Design read:** portfolio one-page para recrutadores e clientes criativos, com linguagem editorial + arcade 8-bit, construída à mão em HTML/CSS/JS e canvas procedural.
**Dials:** DESIGN_VARIANCE 9 · MOTION_INTENSITY 8 · VISUAL_DENSITY 4.
**Teste "remove the logo":** a mistura Fraunces editorial + Silkscreen, personagem pixel procedural, nav Pac-Man e paleta arcade continua sendo reconhecível como este portfólio — não como um template.

## 1. Identidade
- **Personalidade:** preciso, lúdico, artesanal-digital, levemente nostálgico sem ser infantil.
- **Público:** times de produto, agências e recrutadores que valorizam execução front-end autoral.
- **Posicionamento:** "pixels como matéria-prima, engenharia como ofício".
- **Keywords visuais:** arcade cabinet, editorial serif, CRT glow controlado, sprites, grid.
- **Refutação:** se o personagem, o comportamento arcade ou a tipografia editorial saírem, a identidade se perde.

## 2. Tipografia
- **Display:** Fraunces 600 (mandato da marca/spec), `clamp(40px, 4.4vw, 88px)`, line-height 1.05, tracking -0.03em. Editorial e humana, contrasta com o pixel.
- **Corpo:** Space Grotesk 400/500, 16–22px, line-height 1.5, max 65ch. Legível e técnica.
- **UI/pixel:** Silkscreen 400/700 + Press Start 2P no logo. Usada com parcimônia: labels, nav, botões de modo, números. Nunca em parágrafos.
- **Refutação:** trocar Fraunces por outra serif ou o pixel por sans destruiria o contraste editorial/arcade que define a página.

## 3. Cor
- **Base:** `#121212`; **texto:** `#EDEDED`; **muted:** `#A6A6A6`.
- **Ação/identidade:** lime `#B8F21A`; **destaques:** yellow `#F5C518`, cyan `#1EC8E8`, magenta `#D63A8A`, purple `#8B5CF6`, orange `#F07A16`, red `#E53935`.
- **Regra:** lime é a única cor de ação; as outras aparecem como matéria pixel (sprites, tetrominós, dados). Superfícies são carvão, nunca vidro.
- **Refutação:** uma segunda cor de CTA ou um fundo claro quebraria a leitura de "arcade cabinet".

## 4. Iconografia
- Ícones desenhados em pixels (SVG rects/canvas), 8×8 ou 12×12, amarelo no dock. Sem biblioteca de ícones: o desenho é parte da linguagem.
- **Refutação:** ícones lineares modernos pareceriam colados de outro site.

## 5. Imagem
- Sem fotografia. A imagem é o personagem pixel procedural (28×30), sprites de seção e mapas de bits. Tudo canvas/CSS, `image-rendering: pixelated`.
- **Refutação:** stock photos destruiriam a autoria procedural.

## 6. Layout
- Grid assimétrico: hero 53% personagem / texto em 54%; seções 100svh com composições alternadas (split, full-bleed, grid de cards, stack de janelas).
- Espaçamento em escala 4/8/16/24/48/96. Bordas retas, radius 0. Linhas de 1px e "pixel corners" como moldura.
- **Refutação:** hero centralizado ou cards arredondados genéricos negariam a referência.

## 7. Shape language
- Tudo reto, blocos, sombras duras deslocadas (nunca blur decorativo), bordas 1px, cantos 0. O único "raio" é o desenho pixelado.

## 8. Motion
- Passos discretos (`steps()`), glitchs curtos, olhos que seguem o cursor, respiração de 1px, Pac-Man com boca em 3 frames.
- Entradas de seção em steps, uma vez. Durações 120–700ms. `prefers-reduced-motion` remove glitch, piscar, respiração e animação do Pac-Man, mantendo estados.
- **Refutação:** interpolação suave em tudo descaracterizaria o pixel; movimento infinito sem motivo vira ruído.

## 9. Componentes
- Botões de modo com marcador ▶ que desliza em `steps(4)`, estado ativo lime.
- Dock vertical com tooltips, Pac-Man nav, janelas retrô com barra de título, modal `C:/.../CONTACT` com validação inline e focus trap.
- Cards de projeto com hover em degraus, listras e sombra dura.

## 10. Anti-AI rules
- Proibido: glassmorphism, gradiente roxo de IA, cards arredondados, eyebrows genéricas em toda seção, três feature cards iguais, emojis, lorem ipsum, placeholders vazios.
- Obrigatório: cada seção tem uma peça visual procedural própria; textos específicos; zero assets externos além das fontes Google.
- **Exceções explícitas da spec:** Fraunces, hero em 4 linhas, dark-only, Google Fonts via link, ícones desenhados à mão, animações de scroll — todos mandatos da marca/usuário e, portanto, aceitos.
