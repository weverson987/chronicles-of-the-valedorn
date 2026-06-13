export type TipoGolpe = "ataque" | "magia" | "habilidade";

export type GolpeMonstro = {
  nome: string;
  tipo: TipoGolpe;
  dano: number;
};

export type Inimigo = {
  id: string;
  nome: string;
  nivel: number;
  vidaMaxima: number;
  ataque: number;
  defesa: number;
  magia: number;
  agilidade: number;
  ouroDrop: number;
  xpDrop: number;
  imagem: string;
  golpes: GolpeMonstro[];
};