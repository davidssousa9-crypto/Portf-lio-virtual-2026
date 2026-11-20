import linguagens from "./content/linguagens.json";
import matematica from "./content/matematica.json";
import humanas from "./content/humanas.json";
import natureza from "./content/natureza.json";
import senai from "./content/senai.json";

export const WORLDS = [linguagens, matematica, humanas, natureza, senai];

export function worldById(id) {
  return WORLDS.find((world) => world.id === id) || null;
}

export function worldIndex(id) {
  return WORLDS.findIndex((world) => world.id === id);
}
