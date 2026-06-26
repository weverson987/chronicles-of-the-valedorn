import type { Inimigo } from "./tipos.ts";
import esqueletoImg from "./esqueleto.png";

export type FaixaNivelEsqueleto = {
  nivelMinimo: number;
  nivelMaximo: number | null;
  chanceEncontro: number;
};

export const CHANCES_ENCONTRO_ESQUELETO: FaixaNivelEsqueleto[] = [
  { nivelMinimo: 1, nivelMaximo: 3, chanceEncontro: 0 },
  { nivelMinimo: 4, nivelMaximo: 5, chanceEncontro: 10 },
  { nivelMinimo: 6, nivelMaximo: 7, chanceEncontro: 50 },
  { nivelMinimo: 8, nivelMaximo: null, chanceEncontro: 35 },
];

export function chanceEncontroEsqueleto(nivelJogador: number) {
  return CHANCES_ENCONTRO_ESQUELETO.find(
    ({ nivelMinimo, nivelMaximo }) =>
      nivelJogador >= nivelMinimo && (nivelMaximo === null || nivelJogador <= nivelMaximo),
  )?.chanceEncontro ?? 0;
}

export const ESQUELETO: Inimigo = {
  id: "esqueleto",
  nome: "Esqueleto",
  nivel: 1,
  vidaMaxima: 55,
  ataque: 1,
  defesa: 1,
  magia: 0,
  agilidade: 4,
  ouroDrop: 15,
  xpDrop: 35,
  imagem: esqueletoImg,
  golpes: [
    { nome: "Machado duplo", tipo: "ataque", dano: 4 },
    { nome: "Ossada", tipo: "ataque", dano: 4 },
    { nome: "Estilhaço de ossos", tipo: "ataque", dano: 6 },
  ],
  falas: {
    aoTomarDano: ["Clap"],
    aoMorrer: "Ghaaa!",
  },
  reducaoDanoFisico: 1.25,
};