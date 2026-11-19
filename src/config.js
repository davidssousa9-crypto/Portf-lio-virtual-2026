/* ============================================================
   CONFIG — single source of truth
   Edit brand, hero copy, colours, links, sections and timings
   here. Nothing in the UI should need a second copy.
   ============================================================ */

export const CONFIG = {
  brand: "AGRVAI",

  /* ---------- ENHANCEMENT FLAGS (additive) ---------- */
  features: {
    loader: true,
    minigames: true,
    transitions: true,
    knowledge: true
  },

  meta: {
    title: "AGRVAI — Transformando pixels em experiências digitais memoráveis",
    description:
      "AGRVAI — portfólio em pixel art que mistura design editorial, interfaces feitas à mão e engenharia 8-bit. Transformando pixels em experiências digitais memoráveis desde 2010.",
    themeColor: "#121212"
  },

  /* ---------- DESIGN TOKENS ---------- */
  colors: {
    bg: "#121212",
    ink: "#EDEDED",
    lime: "#BCED12",
    limeLogo: "#CEFF00",
    gold: "#F6C53A",
    cyan: "#12C2ED",
    purple: "#894AED",
    orange: "#ED7812",
    magenta: "#ED3D91",
    blue: "#124AED",
    red: "#EE3B3E",
    logoShadow: "#262626",

    /* aliases kept for the existing section canvases / CSS */
    text: "#EDEDED",
    yellow: "#F6C53A"
  },

  fonts: {
    body: '"Space Grotesk", "Segoe UI", sans-serif',
    display: '"Fraunces", "Iowan Old Style", Georgia, serif',
    pixel: '"Pixelify Sans", "Courier New", monospace'
  },

  /* ---------- LOGO ---------- */
  logo: {
    text: "AGRVAI",
    ariaLabel: "AGRVAI — voltar ao topo"
  },

  /* ---------- PRIMARY NAV ---------- */
  nav: {
    menuTitle: "NAVEGACAO.SYS",
    items: [
      { id: "about", label: "Criador" },
      { id: "hands", label: "Projetos" },
      { id: "tetris", label: "Jogar" }
    ],
    cta: {
      label: "Contato",
      href: "#cta"
    }
  },

  /* ---------- CHARACTER (Prompt 1) ---------- */
  character: {
    /* New-model glasses only; everything else uses the original palette. */
    glassesPalette: {
      g: "#3A2A38",
      G: "#2B1E2B"
    },
    /* New-model jacket tones. */
    clothesPalette: {
      X: "#322A30",
      V: "#2B2430",
      K: "#231C28",
      D: "#2D2830"
    },
    speech: ["oi, meu nome é David", "bem vindo ao meu portfólio"],
    pixelSize: 0,
    mobileVw: 0.032,
    transition: 650,
    blinkMin: 3000,
    blinkMax: 5000,
    blinkDuration: 120,
    breathMs: 1200,
    jumpMs: 150,
    winkEvery: 12000,
    winkDuration: 220,
    palette: {
      lime: "#BCED12",
      yellow: "#F6C53A",
      cyan: "#12C2ED",
      magenta: "#ED3D91",
      purple: "#894AED",
      orange: "#ED7812",
      red: "#EE3B3E",

      /* hair, glasses, hood, shirt and jacket pixels */
      h: "#4A2A1A",
      H: "#2C180F",
      j: "#6D452B",
      x: "#9A6A3E",
      g: "#2A2028",
      G: "#1B151C",
      L: "#D8EDEF",
      M: "#B4D6DA",
      q: "#FFFFFF",
      O: "#2A212F",
      R: "#574960",
      W: "#F7F4EC",
      w: "#D8D2C7",
      c: "#FFFDF7",
      J: "#232026",
      K: "#141216",
      P: "#3B353F",
      Q: "#C9A45C"
    }
  },

  /* ---------- HERO ---------- */
  hero: {
    lines: ["Transformo pixels", "em experiências", "digitais", "memoráveis."],
    subtitleLines: [
      "Código fluido e design cuidadoso,",
      "criando e dando vida a visões desde 2010."
    ],
    modes: [
      { id: "developer", label: "Modo Desenvolvedor", cardLabel: "DESENVOLVEDOR" },
      { id: "creative", label: "Modo Criativo", cardLabel: "CRIATIVO" }
    ],
    defaultMode: "creative",
    characterAria:
      "Retrato em pixel art do criador do portfólio. Pressione Enter ou clique para fazer o personagem pular."
  },

  /* ---------- LEFT TOOLBAR ---------- */
  toolbar: {
    iconUnit: 4.46,
    items: [
      { id: "sound", icon: "sound", label: "#som", ariaLabel: "Som" },
      {
        id: "contact",
        icon: "phone",
        label: "#contato",
        ariaLabel: "Contato",
        href: "#cta",
        action: "contact"
      },
      {
        id: "game",
        icon: "controller",
        label: "/jogo",
        ariaLabel: "Jogo",
        href: "#tetris"
      },
      {
        id: "projects",
        icon: "folder",
        label: "/projetos",
        ariaLabel: "Projetos",
        href: "#hands"
      }
    ]
  },

  /* ---------- PAC-MAN SECTIONS (13 items ≡ 13 sections) ---------- */
  sections: [
    { id: "hero", label: "Início" },
    { id: "about", label: "Criador" },
    { id: "pixels", label: "Pixels" },
    { id: "ideas", label: "Ideias" },
    { id: "brain-section", label: "Cérebro" },
    { id: "dna", label: "DNA" },
    { id: "emotion", label: "Emoção" },
    { id: "beauty", label: "Beleza" },
    { id: "hands", label: "Projetos" },
    { id: "windows", label: "Janelas" },
    { id: "tetris", label: "Tetris" },
    { id: "cta", label: "Contato" },
    { id: "world", label: "Mundo" }
  ],

  /* ---------- AUDIO ---------- */
  audio: {
    volume: 0.4,
    mutedByDefault: true,
    hover: { freq: 880, duration: 0.04, gain: 0.018 },
    click: { from: 660, to: 990, duration: 0.08, gain: 0.04 },
    mode: [523.25, 659.25, 783.99, 1046.5],
    modeNote: 0.06,
    waka: [300, 200],
    wakaDuration: 0.06,
    wakaGain: 0.035
  },

  /* ---------- TIMINGS (ms) ---------- */
  timings: {
    loadGlitchDelay: 400,
    glitchDuration: 600,
    logoHoverCooldown: 500,
    modeFlip: 700,
    modeLock: 800,
    contactDelay: 520,
    pacmanFrame: 125,
    navLerp: 0.24,
    navIdleStop: 400
  },

  /* ---------- STORAGE ---------- */
  storage: {
    mode: "agrvai-mode",
    sound: "agrvai-sound-enabled"
  },

  /* ---------- SECTION COPY ---------- */
  copy: {
    about: {
      kicker: "NÍVEL 02 / CRIADOR",
      title: "Sobre Mim.",
      lead: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.",
      body: "Vestibulum id ligula porta felis euismod semper. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla."
    },
    pixels: {
      kicker: "NÍVEL 03 / ORIGEM",
      title: "História de Vida.",
      lead: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis interdum.",
      body: "Nullam quis risus eget urna mollis ornare vel eu leo. Aenean lacinia bibendum nulla sed consectetur."
    },
    ideas: {
      kicker: "NÍVEL 04 / FAÍSCA",
      title: "É aqui que as ideias tomam forma.",
      lead: "Transformo conceitos iniciais em direções de interface: estrutura, fluxo e as primeiras telas que provam a ideia."
    },
    "brain-section": {
      kicker: "NÍVEL 05 / CONCEITO",
      title: "Torne o invisível legível.",
      lead: "Mapeio a ideia em wireframes, componentes e um plano de build.",
      body: "Cada parte ganha nome, propósito e lugar antes da primeira linha de código."
    },
    dna: {
      kicker: "NÍVEL 06 / SISTEMA",
      title: "Deste fio, tudo cresce…",
      lead: "Tokens de design, escalas tipográficas, espaçamento e regras de movimento, documentados e reutilizáveis.",
      body: "O sistema mantém a próxima tela consistente sem travar o trabalho."
    },
    emotion: {
      kicker: "NÍVEL 07 / EMOÇÃO",
      title: "Mais do que função.",
      lead: "Movimento, tempo e feedback carregam significado. Eles confirmam ações e orientam a atenção.",
      body: "Mova o ponteiro pelo campo para testar a resposta."
    },
    beauty: {
      kicker: "NÍVEL 08 / FORMA",
      title: "A forma segue a função, mas a beleza conduz.",
      lead: "Cor, tipografia, espaçamento e alinhamento são escolhidos em conjunto, não adicionados como decoração.",
      body: "Role a página para alinhar a composição. Passe o mouse por um bloco para isolar uma cor."
    },
    hands: {
      kicker: "NÍVEL 09 / PROJETOS",
      title: "Ideias não são nada sem mãos que as construam.",
      lead: "Três projetos autorais que cobrem sistemas de UI, áudio generativo e ferramentas de design."
    },
    windows: {
      kicker: "NÍVEL 10 / PROCESSO",
      title: "Cada janela é uma decisão.",
      lead: "Alertas, estados de carregamento, avisos e confirmações: as pequenas interfaces que mantêm um processo claro.",
      body: "Feche, minimize e restaure as janelas para testar cada estado."
    },
    tetris: {
      kicker: "NÍVEL 11 / JOGO",
      title: "Encaixe perfeito.",
      lead: "Um pequeno tabuleiro estilo Tetris feito para ritmo, cliques e linhas limpas.",
      body: "O tabuleiro roda sozinho. Use Próxima para acelerar a próxima peça."
    },
    cta: {
      kicker: "NÍVEL 12 / CONTATO",
      title: ["Empilhe sua visão", "com a minha."],
      lead: "Me conte o que você quer construir. Respondo com os próximos passos."
    },
    world: {
      kicker: "NÍVEL 13 / MUNDO",
      title: "Vamos construir seu próximo projeto, pixel a pixel."
    }
  },

  /* ---------- LINKS ---------- */
  socials: {
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
    email: "hello@agrvai.dev"
  },

  location: {
    city: "PICOS — PI",
    timeZone: "America/Fortaleza"
  },

  world: {
    timeZone: "America/Fortaleza"
  },

  contact: {
    dialogTitle: "C:/SEU-SITE/CONTATO",
    intro: "Abra um novo projeto ou apenas diga olá. Os campos obrigatórios estão marcados com *.",
    successTitle: "MENSAGEM.ENVIADA",
    successText:
      "Obrigado — sua mensagem entrou na fila. Vou responder de um endereço humano de verdade.",
    successButton: "Fechar janela"
  }
};

export default CONFIG;
