import type { Inimigo } from "./tipos.ts";
import goblinXamaImg from "./goblin_mago.png";
import goblinGuerreiroImg from "./goblin_guerreiro.png";

export type FaixaNivelGoblin = {
  nivelMinimo: number;
  nivelMaximo: number | null;
  chanceEncontro: number;
};

export const CHANCES_ENCONTRO_GOBLIN: FaixaNivelGoblin[] = [
  { nivelMinimo: 1, nivelMaximo: 3, chanceEncontro: 95 },
  { nivelMinimo: 4, nivelMaximo: 5, chanceEncontro: 60 },
  { nivelMinimo: 6, nivelMaximo: 7, chanceEncontro: 5 },
  { nivelMinimo: 8, nivelMaximo: null, chanceEncontro: 0 },
];

export function chanceEncontroGoblin(nivelJogador: number) {
  return CHANCES_ENCONTRO_GOBLIN.find(
    ({ nivelMinimo, nivelMaximo }) =>
      nivelJogador >= nivelMinimo && (nivelMaximo === null || nivelJogador <= nivelMaximo),
  )?.chanceEncontro ?? 0;
}

export const GOBLIN_XAMA: Inimigo = {
  id: "goblin_xama",
  nome: "Goblin Xamã",
  nivel: 1,
  vidaMaxima: 20,
  ataque: 1,
  defesa: 1,
  magia: 2,
  agilidade: 6,
  ouroDrop: 5,
  xpDrop: 4,
  imagem: goblinXamaImg,
  golpes: [
    { nome: "Pedregulho", tipo: "magia", dano: 3 },
    { nome: "Invocar Goblin Guerreiro", tipo: "habilidade", dano: 0 },
    { nome: "Cajadada", tipo: "ataque", dano: 2 },
  ],
  falas: {
    aoTomarDano: ["keaaak!"],
    aoMorrer: "hu..ma..n..o",
  },
  fuga: {
    chance: 20,
    percentualVidaPerdida: 70,
  },
};

export const GOBLIN_GUERREIRO: Inimigo = {
  id: "goblin_guerreiro",
  nome: "Goblin Guerreiro",
  nivel: 1,
  vidaMaxima: 35,
  ataque: 4,
  defesa: 2,
  magia: 0,
  agilidade: 5,
  ouroDrop: 5,
  xpDrop: 5,
  imagem: goblinGuerreiroImg,
  golpes: [
    { nome: "Corte", tipo: "ataque", dano: 4 },
    { nome: "Turbilhão", tipo: "ataque", dano: 6 },
  ],
  falas: {
    aoTomarDano: ["keaaask!"],
  },
  fuga: {
    chance: 25,
    percentualVidaPerdida: 85,
  },
};
export const GOBLINS = [GOBLIN_XAMA, GOBLIN_GUERREIRO];