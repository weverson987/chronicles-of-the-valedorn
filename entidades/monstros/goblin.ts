import type { Inimigo } from "./tipos.ts";
import goblinXamaImg from "./goblin_mago.png";
import goblinGuerreiroImg from "./goblin_guerreiro.png";

export const GOBLIN_XAMA: Inimigo = {
  id: "goblin_xama",
  nome: "Goblin Xamã",
  nivel: 1,
  vidaMaxima: 15,
  ataque: 1,
  defesa: 0,
  magia: 2,
  agilidade: 6,
  ouroDrop: 5,
  xpDrop: 11,
  imagem: goblinXamaImg,
  golpes: [
    { nome: "Pedregulho", tipo: "magia", dano: 2 },
    { nome: "Invocar Goblin Guerreiro", tipo: "habilidade", dano: 0 },
    { nome: "Cajadada", tipo: "ataque", dano: 1 },
  ],
  falas: {
    aoTomarDano: ["keaaak!"],
    aoMorrer: "hu..ma..n..o",
  },
};

export const GOBLIN_GUERREIRO: Inimigo = {
  id: "goblin_guerreiro",
  nome: "Goblin Guerreiro",
  nivel: 1,
  vidaMaxima: 20,
  ataque: 2,
  defesa: 1,
  magia: 0,
  agilidade: 5,
  ouroDrop: 5,
  xpDrop: 15,
  imagem: goblinGuerreiroImg,
  golpes: [
    { nome: "Corte", tipo: "ataque", dano: 1 },
    { nome: "Turbilhão", tipo: "ataque", dano: 2 },
  ],
  falas: {
    aoTomarDano: ["keaaask!"],
  },
  reducaoDanoFisico: 0.8,
};
export const GOBLINS = [GOBLIN_XAMA, GOBLIN_GUERREIRO];