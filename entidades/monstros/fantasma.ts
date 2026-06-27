import type { Inimigo } from "./tipos.ts";
const fantasmaImg = new URL("./fantasma.png", import.meta.url).href;

export const FANTASMA: Inimigo = {
  id: "fantasma",
  nome: "Fantasma",
  nivel: 1,
  vidaMaxima: 30,
  ataque: 0,
  defesa: 1,
  magia: 0,
  agilidade: 8,
  ouroDrop: 10,
  xpDrop: 25,
  imagem: fantasmaImg,
  golpes: [
    { nome: "Possuir", tipo: "magia", dano: 3 },
    { nome: "Susto", tipo: "magia", dano: 4, efeito: "sem_atacar" },
  ],
  falas: {
    aoMorrer: "FWOOSH",
  },
  reducaoDanoFisico: 3 / 5,
  nuncaFoge: true,
};