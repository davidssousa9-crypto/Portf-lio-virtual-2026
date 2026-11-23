/* ============================================================
   CONFIG — single source of truth
   Edit brand, hero copy, colours, links, sections and timings
   here. Nothing in the UI should need a second copy.
   ============================================================ */

const areasOfKnowledgePage = "areas-de-conhecimento.html";

export const CONFIG = {
  brand: "AGRVAI",

  /* ---------- ENHANCEMENT FLAGS (additive) ---------- */
  features: {
    loader: false,
    minigames: true,
    transitions: true,
    knowledge: true
  },

  meta: {
    title: "David Sousa",
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
    /* Editorial headlines, highly readable UI, and pixel-art microcopy. */
    body: '"Space Grotesk", "Segoe UI", sans-serif',
    display: '"Fraunces", "Iowan Old Style", Georgia, serif',
    pixel: '"Pixelify Sans", "Courier New", monospace'
  },

  /* ---------- LOGO ---------- */
  logo: {
    text: "DVD",
    ariaLabel: "DVD — voltar ao topo"
  },

  /* ---------- PRIMARY NAV ---------- */
  nav: {
    menuTitle: "NAVEGACAO.SYS",
    items: [
      { id: "about", label: "Criador" },
      { id: "hands", label: "Projetos" },
      { id: "tetris", label: "Jogar" },
      { id: "knowledge", label: "Áreas de conhecimento", href: areasOfKnowledgePage, level: "★" }
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
    lines: ["Portfólio virtual", "2026"],
    subtitleLines: [
      "Bem vindo ao meu portfólio",
      "Aqui você encontrará todas minhas atividades ao longo do ano de 2026, aproveite a exper"
    ],
    modes: [
      { id: "developer", label: "Modo Desenvolvedor", cardLabel: "DESENVOLVEDOR" },
      { id: "creative", label: "Modo Criativo", cardLabel: "CRIATIVO" },
      { id: "holiday", label: "Modo Férias", cardLabel: "FÉRIAS" }
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
      },
      {
        id: "knowledge",
        icon: "book",
        label: "/áreas",
        ariaLabel: "Áreas de conhecimento",
        href: areasOfKnowledgePage
      }
    ]
  },

  /* ---------- PAC-MAN SECTIONS (13 items ≡ 13 sections) ---------- */
  sections: [
    { id: "hero", label: "Início" },
    { id: "about", label: "Criador" },
    { id: "pixels", label: "Pixels" },
    { id: "ideas", label: "Ideias" },
    { id: "tetris", label: "Atividades" },
    { id: "dna", label: "DNA" },
    { id: "hands", label: "Projetos" },
    { id: "windows", label: "Janelas" },
    { id: "brain-section", label: "Cérebro" },
    { id: "emotion", label: "Emoção" },
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
      title: "Identificação pessoal",
      lead: "Nome: David Da Silva Sousa\nFiliação: Denise Gomes Da Silva Luz\nMayke Montiel Santos Luz\nIdade: 18 anos\nTelefone: +55 (89) 9419-5831\nEndereço: Rua Cristo Rei\nBairro: São José\nOrientadora: Wallace\nSérie: 3º Série EMI",
      body: ""
    },
    pixels: {
      kicker: "NÍVEL 03 / ORIGEM",
      title: "Objetivos.",
      lead: "Organizar um plano de estudos com rotina, foco na prática e técnicas de revisão para conseguir estudar com êxito e manter o aprendizado contínuo.\n\nDesenvolver habilidades técnicas, inteligência emocional e resolução de problemas para o mercado de trabalho e vida pessoal, tornando-se um profissional qualificado.\n\nIncluir no portfólio escolar: perfil com visão de futuro, mapeamento de competências, trilha de projetos práticos realizados, certificados de cursos extracurriculares e um diário de autoavaliação.",
      body: "Explorar e dominar novas ferramentas digitais e metodologias de produtividade, demonstrando inovação e adaptabilidade no portfólio para se destacar diante das rápidas mudanças do mercado."
    },
    ideas: {
      title: "Plano pessoal de estudo 'PPE'"
    },
    "brain-section": {
      kicker: "NÍVEL 09 / CONCEITO",
      title: "Considerações finais",
      lead: "Este portfólio reflete todas as atividades desenvolvidas na terceira série, destacando meu progresso e aprendizado. Aprendi conceitos fundamentais e desenvolvi habilidades importantes, como organização e gestão de tempo, essenciais para alcançar resultados melhores nos estudos. Foi uma experiência enriquecedora que reforçou a importância de manter um registro organizado e dedicado ao meu desenvolvimento.",
      body: "Agradeço a cada um de vocês que acompanharam minha jornada até aqui, foi um grande prazer aprender com profissionais qualificados e desenvolver ainda mais meus conhecimentos e habilidades."
    },
    dna: {
      kicker: "NÍVEL 06 / SISTEMA",
      title: "História de vida",
      lead: "Meu nome é David Da Silva Sousa tenho 17 anos e nasci na cidade de Picos Piauí, onde cresci e desenvolvi habilidades. Minha jornada estudantil começa lá no infantil na escola Frei Galvão, até chegar 2018 e eu me adentrar no SESI, desde então venho absorvendo conhecimentos, habilidades e talentos. Minha meta é conseguir ter uma vida financeira estável e bem organizada.",
      body: ""
    },
    emotion: {
      kicker: "NÍVEL 07 / EMOÇÃO",
      title: "Referências",
      lead: "https://www.todamateria.com.br/\nhttps://brasilescola.uol.com.br/\nhttps://chatgpt.com/\nhttps://claude.ai/",
      body: "Portfólio desenvolvido com conhecimentos aprendidos no curso técnico em informática para a internet."
    },
    hands: {
      kicker: "NÍVEL 09 / PROJETOS",
      title: "Projeto de vida",
      lead: "Projetos e organizações."
    },
    windows: {
      kicker: "NÍVEL 10 / PROCESSO",
      title: "Currículo",
      lead: "Alertas, estados de carregamento, avisos e confirmações: as pequenas interfaces que mantêm um processo claro.",
      body: "Feche, minimize e restaure as janelas para testar cada estado."
    },
    tetris: {
      kicker: "NÍVEL 11 / JOGO",
      title: "Visualize as atividades do ano de 2026",
      lead: "",
      body: ""
    },
    cta: {
      kicker: "NÍVEL 12 / ANEXOS",
      title: "Anexos",
      lead: "Fotos e registros reunidos em quadros pixelados."
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
