import type { Inimigo } from "./tipos.ts";
import esqueletoImg from "./esqueleto.png";

export const ESQUELETO: Inimigo = {
  id: "esqueleto",
  nome: "Esqueleto",
  nivel: 1,
  vidaMaxima: 40,
  ataque: 4,
  defesa: 2,
  magia: 0,
  agilidade: 4,
  ouroDrop: 18,
  xpDrop: 35,
  imagem: esqueletoImg,
  golpes: [
    { nome: "Golpe de osso", tipo: "ataque", dano: 2 },
    { nome: "Corte enferrujado", tipo: "ataque", dano: 3 },
  ],
  falas: {
    aoMorrer: "clac... clac...",
  },
  reducaoDanoFisico: 0.9,
};