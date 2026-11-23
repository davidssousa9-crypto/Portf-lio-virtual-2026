const STORAGE_KEY = "agrvai-anexos";
const GALLERY_PHOTOS = [
  ["apresentação sobre industrias.jpeg", "Apresentação sobre Indústrias"],
  ["apresentaçãocomsaritagrandepix.jpeg", "Apresentação com Sarita — Grande Pix"],
  ["diaprofcleiton.jpeg", "Dia do Professor Cleiton"],
  ["diaprofregina.jpeg", "Dia da Professora Regina"],
  ["grandepix.jpeg", "Grande Pix"],
  ["grandepixjurados.jpeg", "Grande Pix — Jurados"],
  ["grandepixlargada.jpeg", "Grande Pix — Largada"],
  ["grandpixequipe.jpeg", "Grande Pix — Equipe"],
  ["image.png", "Registro da Galeria"],
  ["mostra.jpeg", "Mostra"],
  ["primeiro festival de bolos.jpeg", "Primeiro Festival de Bolos"],
  ["primeiro lanche coletivo.jpeg", "Primeiro Lanche Coletivo"],
  ["primeirofestivval de bolos juçara.jpeg", "Primeiro Festival de Bolos — Juçara"],
  ["primeiroprojetodeprogamação.jpeg", "Primeiro Projeto de Programação"],
  ["primeirotrote.jpeg", "Primeiro Trote"],
  ["saep.jpeg", "SAEP"],
  ["saep2.jpeg", "SAEP 2"],
  ["segundosarau.jpeg", "Segundo Sarau"],
  ["segundotrote.jpeg", "Segundo Trote"],
  ["segundotroteeueheitor.jpeg", "Segundo Trote — David e Heitor"],
  ["trote2.jpeg", "Trote 2"],
  ["trote3.jpeg", "Trote 3"],
  ["ultimosabadoletivo.jpeg", "Último Sábado Letivo"],
  ["ultimosabadoletivo2.jpeg", "Último Sábado Letivo 2"],
  ["visita dos veteranos no primeiro contraturno .jpeg", "Visita dos Veteranos no Primeiro Contraturno"],
  ["visitavirtex.jpeg", "Visita à Virtex"]
];
const statusMessage = document.getElementById("galleryStatus");
const gallery = document.querySelector(".frame-gallery");
const frames = Array.from(document.querySelectorAll("[data-photo-frame]"));
const acceptedImageData = /^data:image\/(?:webp|png|jpeg);base64,/i;
let photos = {};

function setStatus(message) {
  if (statusMessage) statusMessage.textContent = message;
}

function showPhoto(frame, dataUrl) {
  const image = frame.querySelector(".frame-photo");
  const empty = frame.querySelector(".frame-empty");
  image.src = dataUrl;
  image.hidden = false;
  empty.hidden = true;
}

function showEmptyFrame(frame) {
  const image = frame.querySelector(".frame-photo");
  const empty = frame.querySelector(".frame-empty");
  image.removeAttribute("src");
  image.hidden = true;
  empty.hidden = false;
}

GALLERY_PHOTOS.forEach(([filename, title], index) => {
  const frame = document.createElement("figure");
  frame.className = "photo-frame";
  frame.dataset.photoFrame = `archive-${String(index + 1).padStart(2, "0")}`;

  const windowElement = document.createElement("div");
  windowElement.className = "frame-window";

  const image = document.createElement("img");
  image.className = "frame-photo";
  image.src = `./anexos/${encodeURI(filename)}`;
  image.alt = title;

  windowElement.append(image);
  frame.append(windowElement);

  const caption = document.createElement("figcaption");
  caption.className = "frame-caption";
  const label = document.createElement("span");
  label.textContent = title;
  const small = document.createElement("small");
  small.textContent = "PASTA ANEXOS";
  caption.append(label, small);
  frame.append(caption);

  gallery?.append(frame);
});

try {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("Formato de anexos salvo inválido.");
    }
    photos = parsed;
    frames.forEach((frame) => {
      const photo = photos[frame.dataset.photoFrame];
      if (typeof photo === "string" && acceptedImageData.test(photo)) showPhoto(frame, photo);
    });
  }
} catch (error) {
  console.error("Não foi possível carregar os anexos salvos.", error);
  setStatus("Não foi possível carregar as fotos salvas neste navegador.");
}

async function encodePhoto(file) {
  if (!file.type.startsWith("image/")) {
    throw new TypeError("Escolha um arquivo de imagem.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new RangeError("A imagem deve ter até 12 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    bitmap.close();
  }
}

function savePhotos(nextPhotos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPhotos));
    photos = nextPhotos;
    return true;
  } catch (error) {
    console.error("Não foi possível salvar os anexos neste navegador.", error);
    setStatus("Não foi possível salvar a foto. O armazenamento do navegador pode estar cheio.");
    return false;
  }
}

frames.forEach((frame) => {
  const input = frame.querySelector(".frame-input");
  const frameId = frame.dataset.photoFrame;

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await encodePhoto(file);
      if (!acceptedImageData.test(dataUrl)) {
        throw new Error("O navegador não conseguiu preparar este formato de imagem.");
      }

      if (savePhotos({ ...photos, [frameId]: dataUrl })) {
        showPhoto(frame, dataUrl);
        setStatus("Foto salva neste navegador.");
      }
    } catch (error) {
      console.error("Não foi possível adicionar a foto.", error);
      setStatus(error instanceof Error ? error.message : "Não foi possível adicionar a foto.");
    } finally {
      input.value = "";
    }
  });

  frame.querySelector("[data-remove-photo]").addEventListener("click", () => {
    if (!photos[frameId]) return;
    const nextPhotos = { ...photos };
    delete nextPhotos[frameId];
    if (savePhotos(nextPhotos)) {
      showEmptyFrame(frame);
      setStatus("Foto removida.");
    }
  });
});
