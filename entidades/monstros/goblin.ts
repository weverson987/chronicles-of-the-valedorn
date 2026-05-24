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
  imagem: string;
};

export const GOBLIN_NOVATO: Inimigo = {
  id: "goblin_novato",
  nome: "Goblin Novato",
  nivel: 1,
  vidaMaxima: 24,
  ataque: 6,
  defesa: 2,
  magia: 1,
  agilidade: 4,
  ouroDrop: 8,
  imagem: "/monstros/pngwing.com.png"
};