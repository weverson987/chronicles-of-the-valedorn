import type { Inimigo } from "./tipos.ts";

export type FaixaNivelFantasma = {
  nivelMinimo: number;
  nivelMaximo: number | null;
  chanceEncontro: number;
};

export const CHANCES_ENCONTRO_FANTASMA: FaixaNivelFantasma[] = [
  { nivelMinimo: 1, nivelMaximo: 3, chanceEncontro: 4 },
  { nivelMinimo: 4, nivelMaximo: 5, chanceEncontro: 30 },
  { nivelMinimo: 6, nivelMaximo: 7, chanceEncontro: 35 },
  { nivelMinimo: 8, nivelMaximo: null, chanceEncontro: 25 },
];

export function chanceEncontroFantasma(nivelJogador: number) {
  return CHANCES_ENCONTRO_FANTASMA.find(
    ({ nivelMinimo, nivelMaximo }) =>
      nivelJogador >= nivelMinimo && (nivelMaximo === null || nivelJogador <= nivelMaximo),
  )?.chanceEncontro ?? 0;
}

export const FANTASMA: Inimigo = {
  id: "fantasma",
  nome: "Fantasma",
  nivel: 1,
  vidaMaxima: 40,
  ataque: 0,
  defesa: 1,
  magia: 0,
  agilidade: 8,
  ouroDrop: 7,
  xpDrop: 5,
  imagem: fantasmaImg,
  golpes: [
    { nome: "Possuir", tipo: "magia", dano: 3, efeito: "invencivel" },
    { nome: "Susto", tipo: "magia", dano: 4, efeito: "sem_atacar" },
  ],
  falas: {
    aoMorrer: "FWOOSH",
  },
  reducaoDanoFisico: 3 / 5,
  nuncaFoge: true,
};