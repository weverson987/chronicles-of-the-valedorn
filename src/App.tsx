import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import guerreiroImg from "../entidades/player/guerreiro.png";
import magoImg from "../entidades/player/mago.png";
import ladinaImg from "../entidades/player/ladina.png";
import guildaImg from "../estruturas/guilda_de_aventureiros.png";
import melquiorImg from "../estruturas/Melquior.png";
import casteloImg from "../estruturas/castelo.png";
import mercadoImg from "../estruturas/mercado.png";
import saidaMuralhaImg from "../estruturas/saida_muralha.png";
import vilaImg from "../estruturas/vila.png";
import forjaImg from "../estruturas/forja.png";
import florestaSombriaImg from "../estruturas/floresta_sombria.jpg";
import ritualImg from "../estruturas/ritual.png";
import taylorMachucadoImg from "../entidades/npc/taylor_machucado.png";
import manticoraImg from "../entidades/monstros/manticora_mini_boss.png";
import reinoAnoesImg from "../estruturas/reino_anoes.png";
import anaoImg from "../entidades/npc/anao.png";
import ogroImg from "../entidades/monstros/ogro.png";
import reinoElfosImg from "../estruturas/reino_elfos.png";
import laboratorioImg from "../estruturas/laboratorio.png";
import reiElfoNegroImg from "../entidades/monstros/rei_elfo_negro.png";
import bossLichImg from "../entidades/monstros/boss_lich.png";
import { GOBLINS, GOBLIN_GUERREIRO } from "../entidades/monstros/goblin";
import { FANTASMA } from "../entidades/monstros/fantasma";
import { ESQUELETO } from "../entidades/monstros/esqueleto";
import type { Inimigo } from "../entidades/monstros/tipos";
import "./App.css";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

type Tela = "menu" | "slots" | "criar" | "continuar" | "historia" | "combate";
type ClasseId = "guerreiro" | "mago" | "ladino";
type AcaoCombate = "ataque" | "magia" | "habilidade" | "item" | "fugir";
type AtributoDistribuivel = "vida" | "defesa" | "magia" | "agilidade" | "ataque";
type TipoInimigo =
  | "goblin"
  | "fantasma"
  | "esqueleto"
  | "manticora"
  | "ogro"
  | "rei_elfo_negro"
  | "lich";

type Stats = {
  vida: number;
  defesa: number;
  magia: number;
  agilidade: number;
  ataque: number;
  ouro: number;
};

type ClasseConfig = {
  nome: string;
  base: Stats;
  habilidade: string;
  magiaNome: string;
  imagem: string;
};

type Progresso = {
  nivel: number;
  xp: number;
  xpProximo: number;
  pontosStatus: number;
};

type ItemInventario = { id: string; quantidade: number };

type Personagem = {
  nome: string;
  classe: ClasseId;
  stats: Stats;
  // vida atual (vidaAtual <= stats.vida). É salva junto do resto do personagem
  // e só volta a 100% quando o jogador sobe de nível.
  vidaAtual: number;
  habilidade: string;
  magiaNome: string;
  imagem: string;
  progresso: Progresso;
  inventario: ItemInventario[];
};

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const CLASSES: Record<ClasseId, ClasseConfig> = {
  guerreiro: {
    nome: "Guerreiro",
    base: { vida: 15, defesa: 5, magia: 0, agilidade: 5, ataque: 20, ouro: 30 },
    habilidade: "Incansável",
    magiaNome: "Golpe Arcano",
    imagem: guerreiroImg,
  },
  mago: {
    nome: "Mago",
    base: { vida: 11, defesa: 3, magia: 20, agilidade: 5, ataque: 5, ouro: 30 },
    habilidade: "Fireball",
    magiaNome: "Fireball",
    imagem: magoImg,
  },
  ladino: {
    nome: "Ladino",
    base: { vida: 10, defesa: 3, magia: 5, agilidade: 13, ataque: 15, ouro: 30 },
    habilidade: "Dark Poison",
    magiaNome: "Dark Poison",
    imagem: ladinaImg,
  },
};

const PROGRESSAO_NIVEL: Array<{ nivel: number; xpProximo: number; pontosStatus: number }> = [
  { nivel: 1, xpProximo: 20, pontosStatus: 0 },
  { nivel: 2, xpProximo: 55, pontosStatus: 10 },
  { nivel: 3, xpProximo: 90, pontosStatus: 10 },
  { nivel: 4, xpProximo: 150, pontosStatus: 10 },
  { nivel: 5, xpProximo: 240, pontosStatus: 10 },
  { nivel: 6, xpProximo: 320, pontosStatus: 10 },
  { nivel: 7, xpProximo: 470, pontosStatus: 10 },
  { nivel: 8, xpProximo: 540, pontosStatus: 10 },
  { nivel: 9, xpProximo: 590, pontosStatus: 10 },
  { nivel: 10, xpProximo: 670, pontosStatus: 10 },
];

const ATRIBUTOS_DISTRIBUIVEIS: AtributoDistribuivel[] = [
  "vida",
  "defesa",
  "magia",
  "agilidade",
  "ataque",
];

const ITENS_COMBATE = [
  { id: "pocao_cura", nome: "Poção pequena", descricao: "Restaura 5 de vida.", cura: 5 },
  { id: "pocao_media", nome: "Poção média", descricao: "Restaura 20 de vida.", cura: 20 },
  {
    id: "cristal_congelante",
    nome: "Cristal congelante",
    descricao: "Causa 5 de dano e paralisa o inimigo por 2 turnos.",
    cura: 0,
  },
] as const;

const ITENS_MERCADO = [
  { id: "pocao_cura", nome: "Poção pequena", descricao: "Restaura 5 de vida.", custo: 5 },
  { id: "pocao_media", nome: "Poção média", descricao: "Restaura 20 de vida.", custo: 15 },
  {
    id: "cristal_congelante",
    nome: "Cristal congelante",
    descricao: "Causa 5 dano e paralisa seu inimigo por 2 turnos.",
    custo: 30,
  },
] as const;

const CHANCE_FUGA_BASE = 90;
const VELOCIDADE_DIGITACAO = 34;

// ─────────────────────────────────────────────
// UTILITÁRIOS PUROS
// ─────────────────────────────────────────────

const calcDano = (base: number, defesa: number) =>
  Math.max(1, Math.floor(base - defesa * 0.4));

const rolarPorcentagem = () => Math.random() * 100;

const sortearInteiro = (minimo: number, maximo: number) =>
  Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;

const barraPct = (atual: number, maximo: number) =>
  Math.max(0, Math.floor((atual / maximo) * 100));

// ─────────────────────────────────────────────
// FÁBRICAS DE INIMIGOS
// ─────────────────────────────────────────────

function criarGoblin(nivelJogador: number, indice: number): Inimigo {
  const goblin = GOBLINS[indice % GOBLINS.length];
  const xpDrop = goblin.id === "goblin_xama" ? sortearInteiro(10, 15) : sortearInteiro(8, 9);
  return { ...goblin, nivel: nivelJogador, xpDrop };
}

function criarFantasma(nivelJogador: number): Inimigo {
  return {
    ...FANTASMA,
    nivel: nivelJogador,
    vidaMaxima: sortearInteiro(35, 45),
    ouroDrop: sortearInteiro(7, 15),
    xpDrop: sortearInteiro(10, 20),
  };
}

function criarEsqueleto(nivelJogador: number): Inimigo {
  return {
    ...ESQUELETO,
    nivel: nivelJogador,
    vidaMaxima: sortearInteiro(30, 40),
    ouroDrop: sortearInteiro(15, 24),
    xpDrop: sortearInteiro(20, 30),
  };
}

function criarManticora(nivelJogador: number): Inimigo {
  return {
    id: "manticora",
    nome: "Manticora",
    nivel: nivelJogador,
    vidaMaxima: 65,
    ataque: 3,
    defesa: 3,
    magia: 2,
    agilidade: 7,
    ouroDrop: 30,
    xpDrop: 45,
    imagem: manticoraImg,
    golpes: [
      { nome: "Garras", tipo: "ataque" as const, dano: 3 },
      { nome: "Ferrão venenoso", tipo: "habilidade" as const, dano: 5 },
    ],
    falas: { aoMorrer: "GRRAAAH!" },
  };
}

function criarOgro(nivelJogador: number): Inimigo {
  return {
    id: "ogro_mini_boss",
    nome: "Ogro",
    nivel: nivelJogador,
    vidaMaxima: 45,
    ataque: 2,
    defesa: 5,
    magia: 0,
    agilidade: 4,
    ouroDrop: 40,
    xpDrop: 60,
    imagem: ogroImg,
    golpes: [
      { nome: "Tapa brutal", tipo: "ataque" as const, dano: 4 },
      { nome: "Esmagar", tipo: "habilidade" as const, dano: 5 },
    ],
    falas: { aoMorrer: "AAARGH!!" },
  };
}

function criarReiElfoNegro(nivelJogador: number): Inimigo {
  return {
    id: "rei_elfo_negro",
    nome: "Rei Elfo Negro",
    nivel: nivelJogador,
    vidaMaxima: 140,
    ataque: 9,
    defesa: 6,
    magia: 10,
    agilidade: 6,
    ouroDrop: 0,
    xpDrop: 90,
    imagem: reiElfoNegroImg,
    golpes: [
      { nome: "Lâmina Negra", tipo: "ataque" as const, dano: 9 },
      { nome: "Magia Corrompida", tipo: "magia" as const, dano: 10 },
    ],
    falas: { aoMorrer: "Melquior... você prometeu..." },
  };
}

function criarLich(nivelJogador: number): Inimigo {
  return {
    id: "boss_lich",
    nome: "Melquior, o Lich",
    nivel: nivelJogador,
    vidaMaxima: 200,
    ataque: 10,
    defesa: 8,
    magia: 14,
    agilidade: 5,
    ouroDrop: 0,
    xpDrop: 150,
    imagem: bossLichImg,
    golpes: [
      { nome: "Toque da Morte", tipo: "magia" as const, dano: 11 },
      { nome: "Maldição Sombria", tipo: "habilidade" as const, dano: 13 },
    ],
    falas: { aoMorrer: "Desculpe... eu realmente tentei..." },
  };
}

function criarInimigoParaCombate(tipo: TipoInimigo, nivelJogador: number, indiceGoblin = 0): Inimigo {
  switch (tipo) {
    case "fantasma":
      return criarFantasma(nivelJogador);
    case "esqueleto":
      return criarEsqueleto(nivelJogador);
    case "manticora":
      return criarManticora(nivelJogador);
    case "ogro":
      return criarOgro(nivelJogador);
    case "rei_elfo_negro":
      return criarReiElfoNegro(nivelJogador);
    case "lich":
      return criarLich(nivelJogador);
    case "goblin":
    default:
      return criarGoblin(nivelJogador, indiceGoblin);
  }
}

// Inimigo aleatório para TelaCombate livre (fora da história)
function criarInimigoAleatorio(nivelJogador: number): Inimigo {
  const tipos: TipoInimigo[] = ["goblin", "fantasma", "esqueleto"];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  return criarInimigoParaCombate(tipo, nivelJogador, Math.floor(Math.random() * GOBLINS.length));
}

// ─────────────────────────────────────────────
// LÓGICA DE PERSONAGEM
// ─────────────────────────────────────────────

function normalizarProgresso(progresso?: Progresso): Progresso {
  if (!progresso) return { nivel: 1, xp: 0, xpProximo: 20, pontosStatus: 0 };
  const regra = PROGRESSAO_NIVEL.find((item) => item.nivel === progresso.nivel);
  return { ...progresso, xpProximo: regra?.xpProximo ?? progresso.xpProximo };
}

function normalizarPersonagem(p: Personagem): Personagem {
  const classe = CLASSES[p.classe];
  const stats = { ...classe.base, ...p.stats };
  return {
    ...p,
    habilidade: p.habilidade || classe.habilidade,
    magiaNome: p.magiaNome || classe.magiaNome,
    imagem: p.imagem || classe.imagem,
    progresso: normalizarProgresso(p.progresso),
    stats,
    // garante que a vida atual nunca exceda a vida máxima e que personagens
    // salvos antes dessa funcionalidade existir comecem com a vida cheia.
    vidaAtual: Math.min(p.vidaAtual ?? stats.vida, stats.vida),
    inventario: p.inventario ?? [{ id: "pocao_cura", quantidade: 1 }],
  };
}

function adicionarItem(personagem: Personagem, itemId: string, quantidade = 1): Personagem {
  const existente = personagem.inventario.find((i) => i.id === itemId);
  const inventario = existente
    ? personagem.inventario.map((i) =>
        i.id === itemId ? { ...i, quantidade: i.quantidade + quantidade } : i
      )
    : [...personagem.inventario, { id: itemId, quantidade }];
  return { ...personagem, inventario };
}

function removerItem(personagem: Personagem, itemId: string, quantidade = 1): Personagem {
  const inventario = personagem.inventario
    .map((i) => (i.id === itemId ? { ...i, quantidade: i.quantidade - quantidade } : i))
    .filter((i) => i.quantidade > 0);
  return { ...personagem, inventario };
}

function aplicarXp(
  personagem: Personagem,
  xpGanho: number
): { personagem: Personagem; niveisGanhos: number } {
  let progresso = { ...personagem.progresso, xp: personagem.progresso.xp + xpGanho };
  let niveisGanhos = 0;

  while (progresso.xp >= progresso.xpProximo) {
    const proxNivel = progresso.nivel + 1;
    const regra = PROGRESSAO_NIVEL.find((item) => item.nivel === proxNivel);
    progresso = {
      nivel: proxNivel,
      xp: progresso.xp,
      xpProximo: regra?.xpProximo ?? Math.floor(progresso.xpProximo * 1.45),
      pontosStatus: progresso.pontosStatus + (regra?.pontosStatus ?? 7),
    };
    niveisGanhos += 1;
  }

  return { personagem: { ...personagem, progresso }, niveisGanhos };
}

// ─────────────────────────────────────────────
// PERSISTÊNCIA
// ─────────────────────────────────────────────

function lerSave(slot: number): Personagem | null {
  const raw = localStorage.getItem(`save${slot}`);
  return raw ? normalizarPersonagem(JSON.parse(raw) as Personagem) : null;
}

function salvarPersonagem(personagem: Personagem, slot: number): void {
  localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
}

// ─────────────────────────────────────────────
// MOMENTOS DA HISTÓRIA
// ─────────────────────────────────────────────

// IDs únicos para cada ponto de navegação, evitando busca frágil por texto
type MomentoId =
  | "inicio"
  | "escolha_guilda"
  | "castelo_inicio"
  | "escolha_destino"           // mercado ou porta
  | "mercado"
  | "porta_cidade"
  | "vila_entrada"
  | "goblin_1" | "goblin_2" | "goblin_4"
  | "vila_exploracao"
  | "escolha_vila"              // investigar casas ou rastros
  | "forja_entrada"
  | "forja_olhar"
  | "forja_nevoa"
  | "forja_fantasma"
  | "forja_pos_fantasma"
  | "forja_porta"
  | "forja_escadaria"
  | "forja_taylor"
  | "taylor_escolha"            // entregar poção ou seguir rastros
  | "rastros_vila"
  | "floresta_entrada"
  | "floresta_escolha"          // seguir adiante
  | "esqueleto_1" | "esqueleto_2" | "esqueleto_3"
  | "floresta_recompensa"
  | "ritual_chegada"
  | "ritual_elfa"
  | "manticora_boss"
  | "pos_manticora"
  | "castelo_retorno"
  | "castelo_rei_fala"
  | "castelo_decisao"           // seguir para reino dos anões (fim da cena 07)
  // ── Cena 08 — reino dos anões ──
  | "anoes_chegada"
  | "anoes_combate_1" | "anoes_combate_2" | "anoes_combate_3" | "anoes_combate_4" | "anoes_combate_5"
  | "ogro_boss"
  | "pos_ogro"
  // ── Cena 09 — reino dos elfos ──
  | "elfos_chegada"
  | "elfos_guardas"
  | "elfos_rainha"
  | "escolha_arma"
  | "elfos_rei_pergunta"
  | "elfos_explicacao"
  // ── Cena 10 — laboratório ──
  | "laboratorio_entrada"
  | "rei_elfo_negro_boss"
  | "pos_rei_elfo_negro"
  // ── Cena 11 — plot twist ──
  | "plot_twist"
  // ── Cena 12 — boss final ──
  | "boss_final_intro"
  | "lich_boss"
  // ── Cena final ──
  | "cena_final"
  | "fim_historia";

type Recompensa = { itemId: string; quantidade: number; mensagem: string };

type Momento = {
  id: MomentoId;
  fundo?: string;
  texto?: string;
  falante?: string;
  duracaoAutomatica?: number;   // ms, avança automaticamente
  limparAntes?: boolean;        // limpa a caixa de diálogo antes de exibir
  telaEscura?: boolean;         // fundo preto (cenas de transição)
  escolhas?: { texto: string; proxId: MomentoId }[];
  tipo?: "mercado" | "portao" | "combate";
  inimigoTipo?: TipoInimigo;
  indiceGoblin?: number;        // qual goblin da lista usar
  recompensa?: Recompensa;
};

function montarHistoria(nome: string, classe: ClasseId): Momento[] {
  return [
    // ── CENA 01 ──────────────────────────────────────────────────────────
    {
      id: "inicio",
      texto: `Olá aventureiro(a) ${nome}! …\n\nVocê está no continente de Valedorn. Onde diversas criaturas e seres mágicos andam sobre o alvorecer do dia, como os humanos, elfos e anões, além de monstros que estão sempre à espreita nos locais mais diversos desse vasto continente…`,
    },
    {
      id: "inicio",
      limparAntes: true,
      texto: `Sua história começa aqui, no centro do reino de Kaestral, cercado por muralhas gigantescas, sua paisagem é repleta de casas simples e modestas com um castelo na parte mais alta do reino, onde vive o rei dos humanos, Rei Emanoel II…\n\nPor muito tempo você foi um andarilho, mas, um fenômeno estranho chamou a atenção de todos os reinos de Valedorn… Vilarejos inteiros começaram a desaparecer, florestas foram queimadas e minas de metais preciosos foram subitamente fechadas.`,
    },
    {
      id: "inicio",
      limparAntes: true,
      texto: `A guilda de aventureiros então começa a buscar novos candidatos para buscarem pistas do que estava acontecendo a pedido do rei…\n\nVocê então parte para se registrar na guilda de aventureiros.`,
    },
    {
      id: "inicio",
      fundo: guildaImg,
      duracaoAutomatica: 3000,
    },
    {
      id: "inicio",
      texto: "Ao entrar você se depara com um senhor, curando as feridas dos outros aventureiros ali no local.",
    },
    {
      id: "inicio",
      fundo: melquiorImg,
      falante: "Melquior",
      texto: "Finalmente! Estávamos esperando por alguém disposto a aceitar essa missão!",
    },
    {
      id: "inicio",
      fundo: melquiorImg,
      falante: "Melquior",
      texto: `Pois bem, você deve ser ${nome}. Por quê demorou tanto? O rei estava impaciente de encontrar a pessoa que se candidatou para essa missão…`,
    },
    {
      id: "inicio",
      fundo: melquiorImg,
      falante: "Melquior",
      texto: "Meu nome é Melquior. Sou um dos magos da corte.",
    },
    {
      id: "escolha_guilda",
      fundo: melquiorImg,
      falante: "Melquior",
      texto: "Como já deve ter ouvido nos boatos, muitos estão desaparecendo!!",
      escolhas: [
        { texto: "Devem ser só uns ladrões.", proxId: "castelo_inicio" },
        { texto: "Leve-me logo ao Rei, quanto mais cedo resolvemos melhor para todos.", proxId: "castelo_inicio" },
      ],
    },
    // A resposta à escolha da guilda é tratada em runtime — o componente mostra o texto
    // de resposta e depois avança para castelo_inicio automaticamente.

    // ── CENA 02 ──────────────────────────────────────────────────────────
    {
      id: "castelo_inicio",
      telaEscura: true,
      texto: "…\n\nMelquior:\nChegamos!",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: nome,
      texto: "Saudações meu Rei, vim aqui auxiliar na missão de busca de pistas da guilda.",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Há dois meses, eu perdi soldados…",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Depois perdi capitães…",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "E agora um vilarejo inteiro desaparece!",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Eu já venci guerras, derrotei rebeliões, e pela primeira vez, não sei contra quem estou lutando.\n\nO rei olha para Melquior.\n\nMelquior abaixa a cabeça.",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Muito bem! Como já se sabe, não só o reino de Kaestral está sofrendo com fenômenos estranhos, mas também Yingdad o reino dos elfos e Kotof reino escondido dos anões.",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Quero que você se dirija ao vilarejo ao norte da cidade, onde aconteceu o primeiro desaparecimento e verifique se conseguimos achar alguma pista do que pode estar ocorrendo.",
    },
    {
      id: "castelo_inicio",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Melquior te ajudará com isso, é meu súdito mais leal.",
    },
    {
      id: "escolha_destino",
      texto: "Você recebeu 1 poção de cura média de Melquior.",
      recompensa: { itemId: "pocao_media", quantidade: 1, mensagem: "Você recebeu 1 poção de cura média de Melquior." },
      escolhas: [
        { texto: "Ir ao mercado", proxId: "mercado" },
        { texto: "Ir para a entrada da cidade", proxId: "porta_cidade" },
      ],
    },

    // ── MERCADO ──────────────────────────────────────────────────────────
    {
      id: "mercado",
      fundo: mercadoImg,
      tipo: "mercado",
      texto: "Bem-vindo ao mercado de Kaestral.",
    },

    // ── CENA 03 ──────────────────────────────────────────────────────────
    {
      id: "porta_cidade",
      fundo: saidaMuralhaImg,
      tipo: "portao",
      texto: "A muralha de Kaestral fica para trás, e a estrada aponta para o campo aberto.",
    },
    {
      id: "vila_entrada",
      fundo: vilaImg,
      texto: "Você chega ao vilarejo ao norte. Um silêncio estranho paira no ar.",
    },
    {
      id: "goblin_1",
      fundo: vilaImg,
      tipo: "combate",
      inimigoTipo: "goblin",
      indiceGoblin: 0,
      texto: "Um goblin surge entre as ruínas.",
    },
    // fala APÓS derrotar o primeiro goblin
    {
      id: "goblin_1",
      fundo: vilaImg,
      falante: nome,
      texto: "Estranho…\nEles não tentaram roubar nada.",
    },
    {
      id: "goblin_2",
      fundo: vilaImg,
      tipo: "combate",
      inimigoTipo: "goblin",
      indiceGoblin: 1,
      texto: "Outro goblin aparece, farejando o sangue.",
    },
    // fala APÓS derrotar o segundo goblin
    {
      id: "goblin_2",
      fundo: vilaImg,
      falante: nome,
      texto: "Parece que estavam seguindo o cheiro de sangue..",
    },
    // foto da vila novamente + fala, só depois de derrotar o segundo goblin
    {
      id: "goblin_4",
      fundo: vilaImg,
      falante: nome,
      texto: "Meu Deus! O que houve aqui…",
    },
    {
      id: "vila_exploracao",
      fundo: vilaImg,
      limparAntes: true,
      texto: `As portas estavam abertas.\n\nNinguém andava nas ruas, nem mesmo os animais.\n\nTinham roupas espalhadas no chão, e várias marcas de pegadas fundas na areia fofa.\n\nComo se estivessem correndo de algo.\n\n${nome} sente uma estranha energia vindo da vila.`,
    },
    {
      id: "vila_exploracao",
      fundo: vilaImg,
      falante: nome,
      texto: "Não sobrou ninguém, parece até uma cidade fantasma..",
    },
    {
      id: "escolha_vila",
      fundo: vilaImg,
      texto: "O que você deseja fazer?",
      escolhas: [
        { texto: "Investigar casas", proxId: "forja_entrada" },
        { texto: "Investigar rastros de sangue ❗", proxId: "rastros_vila" },
      ],
    },

    // ── CENA 04 — FORJA ──────────────────────────────────────────────────
    {
      id: "forja_entrada",
      fundo: forjaImg,
      texto: "Você entra na casa que parece estar um pouco menos desgastada do que as demais, a casa também parece maior do que as outras e lá é o que parece ser uma espécie de forja.",
      escolhas: [
        { texto: "Olhar ao redor", proxId: "forja_olhar" },
        { texto: "Adentrar mais fundo na forja", proxId: "forja_porta" },
      ],
    },
    {
      id: "forja_olhar",
      fundo: forjaImg,
      falante: nome,
      texto: "olha ao redor e sente uma energia estranha no local.",
    },
    {
      id: "forja_olhar",
      fundo: forjaImg,
      limparAntes: true,
      texto: "É a mesma sensação que ele sentiu quando chegou na vila..",
    },
    {
      id: "forja_olhar",
      fundo: forjaImg,
      limparAntes: true,
      falante: nome,
      texto: "sente um calafrio percorrendo sua espinha.",
    },
    {
      id: "forja_nevoa",
      fundo: forjaImg,
      limparAntes: true,
      texto: "Uma névoa começa a se formar dentro da forja..",
    },
    {
      id: "forja_fantasma",
      fundo: forjaImg,
      tipo: "combate",
      inimigoTipo: "fantasma",
      texto: "Um fantasma surge da névoa.",
    },
    {
      id: "forja_pos_fantasma",
      fundo: forjaImg,
      falante: "Fantasma",
      texto: "Por favor…",
    },
    {
      id: "forja_pos_fantasma",
      fundo: forjaImg,
      texto: "A forja volta a ficar silenciosa.",
      escolhas: [
        { texto: "Adentrar mais fundo na forja", proxId: "forja_porta" },
      ],
    },
    {
      id: "forja_porta",
      fundo: forjaImg,
      texto: "Você se depara com uma porta. Gostaria de abri-la?",
      escolhas: [
        { texto: "Abrir porta", proxId: "forja_escadaria" },
        { texto: "Voltar e investigar os rastros de sangue", proxId: "rastros_vila" },
      ],
    },
    {
      id: "forja_escadaria",
      fundo: forjaImg,
      limparAntes: true,
      texto: "Você se depara com uma escadaria que leva ao subsolo.",
    },

    // ── CENA 05 — TAYLOR ─────────────────────────────────────────────────
    {
      id: "forja_taylor",
      fundo: forjaImg,
      limparAntes: true,
      texto: `Enquanto ${nome} desce as escadas, ele ouve uma voz meio ofegante ecoando nas paredes daquela escadaria.`,
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      limparAntes: true,
      texto: `Com cautela, porém apreensivo, ${nome} continua a descer as escadas e se depara com um ser meio diferente: era baixo, com um bigode grande, além de algumas poucas mechas brancas na cabeça.`,
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      texto: "*suspiro…",
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: nome,
      texto: "O que aconteceu aqui ?!?",
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      texto: "Por fa..vor, *cof cof*",
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Eles levaram.. todos.. eu não consegui proteger ninguém, eu prometo protegê los",
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Eu sabia… aquele homem não é *cof cof* confiável.",
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: nome,
      limparAntes: true,
      texto: "Que homem?? Me diga por favor!",
    },
    {
      id: "taylor_escolha",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      texto: "A floresta *cof cof* levaram todos… depressa",
      escolhas: [
        { texto: "Entregar uma poção ao anão", proxId: "forja_taylor" },   // sequência de entrega
        { texto: "Voltar e seguir os rastros de sangue para a floresta", proxId: "rastros_vila" },
      ],
    },
    // Sequência depois de entregar a poção:
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      limparAntes: true,
      texto: `${nome} ajuda o anão com uma poção.`,
    },
    {
      id: "forja_taylor",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Obrigado aventureiro, mas já não sou o mesmo de antes. Peço que você ajude as pessoas dessa vila.",
      escolhas: [
        { texto: "Seguir para a floresta", proxId: "rastros_vila" },
      ],
    },

    // ── RASTROS → FLORESTA ────────────────────────────────────────────────
    {
      id: "rastros_vila",
      fundo: vilaImg,
      limparAntes: true,
      texto: "Você segue andando pela estrada principal que cruza toda a vila e nota várias marcas de sangue. Por onde passa, vê marcas de sangue e destruição. É quase como se não houvesse um tempo de reação.",
    },

    // ── CENA 06 — FLORESTA ────────────────────────────────────────────────
    {
      id: "floresta_entrada",
      fundo: florestaSombriaImg,
      limparAntes: true,
      texto: "Os rastros de sangue levam até a orla da floresta sombria, onde sombras se movem entre os troncos.",
    },
    {
      id: "floresta_entrada",
      fundo: florestaSombriaImg,
      limparAntes: true,
      texto: "A vegetação começa a ficar cada vez mais fechada.\nA luz do sol quase não atravessa as árvores.\nO silêncio toma conta do ambiente.",
      escolhas: [
        { texto: "Seguir adiante", proxId: "esqueleto_1" },
      ],
    },
    {
      id: "esqueleto_1",
      fundo: florestaSombriaImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "Durante o caminho aparecem três esqueletos.",
    },
    {
      id: "esqueleto_2",
      fundo: florestaSombriaImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "O segundo esqueleto avança com ossos rangendo.",
    },
    {
      id: "esqueleto_3",
      fundo: florestaSombriaImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "O último esqueleto bloqueia sua passagem.",
    },
    {
      id: "floresta_recompensa",
      fundo: florestaSombriaImg,
      texto: "Um dos esqueletos detinha uma poção…\nVocê recebe 1 poção de cura.",
      recompensa: { itemId: "pocao_cura", quantidade: 1, mensagem: "Você recebeu 1 poção de cura." },
    },
    {
      id: "ritual_chegada",
      fundo: ritualImg,
      limparAntes: true,
      texto: "O jogador encontra um enorme círculo mágico desenhado no chão.\nAo redor dele existem dezenas de esqueletos espalhados.\nNo centro...\numa pequena garota elfa está presa por correntes mágicas.",
    },
    {
      id: "ritual_elfa",
      fundo: ritualImg,
      falante: "Elfa",
      texto: "Socorro!!!\nPor favor…\nAlguém me ajuda…\nMe tirem daqui…",
    },
    {
      id: "manticora_boss",
      fundo: ritualImg,
      tipo: "combate",
      inimigoTipo: "manticora",
      texto: "Uma Manticora surge protegendo o círculo mágico!",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      texto: "As correntes mágicas desaparecem.\nA garota elfa agora está a salvo.",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: nome,
      texto: "Você está bem?",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Elfa",
      limparAntes: true,
      texto: "Obrigada...\nAchei que fosse morrer aqui...",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      texto: "Taylor chega ao local.",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Taylor",
      texto: "Essa criança...\nEssas roupas...\nEla pertence à família real dos elfos…\nVocê é Gabriela, não é?",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Taylor",
      texto: "Cadê os outros?",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Princesa Gabriela",
      limparAntes: true,
      texto: "Mataram a todos…\nLevaram meu pai...\nLevaram nosso povo…",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Princesa Gabriela",
      limparAntes: true,
      texto: "O homem de preto dizia...\nQue precisava do sangue da família real.",
    },
    {
      id: "pos_manticora",
      fundo: ritualImg,
      falante: "Taylor",
      texto: "Precisamos voltar imediatamente, o rei precisa saber disso.",
    },

    // ── CENA 07 — RETORNO AO CASTELO ──────────────────────────────────────
    {
      id: "castelo_retorno",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Vocês encontraram alguém vivo?",
    },
    {
      id: "castelo_retorno",
      fundo: casteloImg,
      falante: nome,
      texto: "Encontramos esta criança.\nEla pertence à família real dos elfos.",
    },
    {
      id: "castelo_retorno",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Então...\nIsso é muito pior do que imaginei...",
    },
    {
      id: "castelo_retorno",
      fundo: casteloImg,
      texto: "Melquior permanece em silêncio.",
      limparAntes: true,
    },
    {
      id: "castelo_retorno",
      fundo: casteloImg,
      falante: "Melquior",
      texto: "Então os responsáveis realmente chegaram ao reino dos elfos...\nPrecisamos agir rapidamente.",
    },
    {
      id: "castelo_rei_fala",
      fundo: casteloImg,
      falante: "Rei",
      texto: "Taylor!\nVocê conhece os antigos caminhos até Kotof.\nLeve nosso aventureiro até os anões.\nTalvez eles consigam impedir esse exército.",
    },
    {
      id: "castelo_rei_fala",
      fundo: casteloImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Sim majestade, apesar de já ser um soldado aposentado, nunca esquecerei meus dias de glória no império de Kotof, será um prazer ajudar os reinos a desvendar esse caso.",
    },
    {
      id: "castelo_rei_fala",
      fundo: casteloImg,
      falante: "Melquior",
      texto: "Boa sorte.\nEspero revê-los em breve...",
      recompensa: { itemId: "pocao_media", quantidade: 2, mensagem: "Melquior entregou 2 poções de cura média." },
    },
    {
      id: "castelo_decisao",
      fundo: casteloImg,
      texto: "Melquior sorri e entrega mais 2 poções de cura.",
      escolhas: [
        { texto: "Seguir para o reino dos anões", proxId: "anoes_chegada" },
      ],
    },

    // ── CENA 08 — REINO DOS ANÕES ──────────────────────────────────────────
    {
      id: "anoes_chegada",
      fundo: reinoAnoesImg,
      limparAntes: true,
      texto: "Assim que chegam…\n\nO enorme portão de pedra está parcialmente destruído.\nVários esqueletos invadem o reino.",
    },
    {
      id: "anoes_combate_1",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "Você avança para enfrentar os esqueletos invasores.",
    },
    {
      id: "anoes_combate_2",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "Mais um esqueleto surge das ruínas do portão.",
    },
    {
      id: "anoes_combate_3",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "O terceiro esqueleto ataca sem hesitar.",
    },
    {
      id: "anoes_combate_4",
      fundo: reinoAnoesImg,
      limparAntes: true,
      texto: "Logo depois, mais dois esqueletos aparecem para reforçar o ataque.",
    },
    {
      id: "anoes_combate_4",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "Um quarto esqueleto entra em combate.",
    },
    {
      id: "anoes_combate_5",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "esqueleto",
      texto: "O quinto e último esqueleto desta onda ataca.",
    },
    {
      id: "ogro_boss",
      fundo: reinoAnoesImg,
      limparAntes: true,
      texto: "Quando tudo parece terminar…\num rugido sacode as pedras do reino.",
    },
    {
      id: "ogro_boss",
      fundo: reinoAnoesImg,
      tipo: "combate",
      inimigoTipo: "ogro",
      texto: "Um Ogro surge entre os destroços do portão!",
    },
    {
      id: "pos_ogro",
      fundo: anaoImg,
      limparAntes: true,
      texto: "Um dos esqueletos derrotados deixou cair suprimentos.\nVocê recebe 3 poções de cura.",
      recompensa: { itemId: "pocao_cura", quantidade: 3, mensagem: "Você recebeu 3 poções de cura." },
    },
    {
      id: "pos_ogro",
      fundo: anaoImg,
      falante: "Anão",
      limparAntes: true,
      texto: "Conseguimos…\nEles finalmente recuaram…",
    },
    {
      id: "pos_ogro",
      fundo: anaoImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Ainda não.\nIsso foi apenas uma pequena parte do exército.",
    },
    {
      id: "pos_ogro",
      fundo: anaoImg,
      falante: "Anão",
      limparAntes: true,
      texto: "Obrigado aventureiros.\nInfelizmente…\nperdemos nossas minas.",
    },
    {
      id: "pos_ogro",
      fundo: anaoImg,
      falante: nome,
      limparAntes: true,
      texto: "Agora precisamos seguir até Yingdad.\nAinda há tempo de salvar os elfos.",
    },

    // ── CENA 09 — REINO DOS ELFOS ──────────────────────────────────────────
    {
      id: "elfos_chegada",
      fundo: reinoElfosImg,
      limparAntes: true,
      texto: "Assim que chegam…\n\nOs guardas apontam suas lanças.",
    },
    {
      id: "elfos_chegada",
      fundo: reinoElfosImg,
      falante: "Princesa Gabriela",
      limparAntes: true,
      texto: "Esperem!\nEles salvaram minha vida.",
    },
    {
      id: "elfos_guardas",
      fundo: reinoElfosImg,
      limparAntes: true,
      texto: "Os guardas abaixam as armas.",
    },
    {
      id: "elfos_rainha",
      fundo: reinoElfosImg,
      falante: "Rainha Elfa",
      limparAntes: true,
      texto: "Minha filha…",
    },
    {
      id: "elfos_rainha",
      fundo: reinoElfosImg,
      limparAntes: true,
      texto: "Princesa abraça a rainha.",
    },
    {
      id: "elfos_rainha",
      fundo: reinoElfosImg,
      falante: "Rainha Elfa",
      limparAntes: true,
      texto: "Jamais conseguirei agradecer.\nAceite esta arma.",
    },
    {
      id: "escolha_arma",
      fundo: reinoElfosImg,
      texto:
        classe === "mago"
          ? "A rainha entrega um Cajado Élfico. (+8 de magia)"
          : classe === "guerreiro"
          ? "A rainha entrega uma Espada Élfica. (+8 de ataque)"
          : "A rainha entrega uma Adaga Élfica. (+8 de ataque)",
    },
    {
      id: "elfos_rei_pergunta",
      fundo: reinoElfosImg,
      falante: nome,
      limparAntes: true,
      texto: "Mas… cadê o rei elfo?",
    },
    {
      id: "elfos_explicacao",
      fundo: reinoElfosImg,
      limparAntes: true,
      texto: "A rainha fica meio espantada e leva o grupo para longe dos guardas.",
    },
    {
      id: "elfos_explicacao",
      fundo: reinoElfosImg,
      falante: "Rainha Elfa",
      limparAntes: true,
      texto: "Eu não sei o que tá acontecendo…\nDepois que os esqueletos levaram nosso povo, ele de alguma forma trouxe todos de volta.\nMas ele não parece ser mais o meu marido que eu conhecia.\nEle vive isolado naquele laboratório, e não deixa ninguém ver ele.",
    },
    {
      id: "elfos_explicacao",
      fundo: reinoElfosImg,
      limparAntes: true,
      texto: `Ao ouvir essas palavras, ${nome} parte na direção do laboratório em busca de mais pistas, eles não tinham mais tanto tempo, e quase nada fazia sentido ainda.`,
    },

    // ── CENA 10 — LABORATÓRIO ──────────────────────────────────────────────
    {
      id: "laboratorio_entrada",
      fundo: laboratorioImg,
      limparAntes: true,
      texto: "Enquanto procuram…\nO grupo encontra um laboratório escondido.",
    },
    {
      id: "laboratorio_entrada",
      fundo: laboratorioImg,
      limparAntes: true,
      texto: "Existem corpos.\nLivros.\nFrascos.\nMinérios.\nEsqueletos incompletos.",
    },
    {
      id: "laboratorio_entrada",
      fundo: laboratorioImg,
      falante: nome,
      limparAntes: true,
      texto: "O que é este lugar…",
    },
    {
      id: "rei_elfo_negro_boss",
      fundo: reiElfoNegroImg,
      limparAntes: true,
      texto: "Surge o Rei Elfo Negro.",
    },
    {
      id: "rei_elfo_negro_boss",
      fundo: reiElfoNegroImg,
      falante: "Rei Elfo Negro",
      limparAntes: true,
      texto: "Vocês chegaram tarde demais…",
    },
    {
      id: "rei_elfo_negro_boss",
      fundo: reiElfoNegroImg,
      tipo: "combate",
      inimigoTipo: "rei_elfo_negro",
      texto: "O Rei Elfo Negro ataca!",
    },
    {
      id: "pos_rei_elfo_negro",
      fundo: reiElfoNegroImg,
      limparAntes: true,
      texto: "O rei cai.",
    },
    {
      id: "pos_rei_elfo_negro",
      fundo: reiElfoNegroImg,
      falante: "Rei Elfo Negro",
      limparAntes: true,
      texto: "Melquior…\nVocê prometeu…\nSalvar meu povo…",
    },
    {
      id: "pos_rei_elfo_negro",
      fundo: reiElfoNegroImg,
      falante: "Rei Elfo Negro",
      limparAntes: true,
      texto: "Mas…\nVocê me transformou…\nNisso…",
    },
    {
      id: "pos_rei_elfo_negro",
      fundo: reiElfoNegroImg,
      limparAntes: true,
      texto: "Ele morre.",
    },

    // ── CENA 11 — PLOT TWIST ────────────────────────────────────────────────
    {
      id: "plot_twist",
      fundo: laboratorioImg,
      limparAntes: true,
      texto: "O corpo do rei começa a brilhar.\nUm círculo mágico aparece.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      limparAntes: true,
      texto: "Melquior surge lentamente.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Excelente trabalho…",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Você eliminou todos os obstáculos.\nEncontrou Taylor.\nProtegeu a princesa.\nAbriu caminho até este lugar.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: nome,
      limparAntes: true,
      texto: "Foi…\nVocê?",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Desde o início.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Precisava dos corpos humanos.\nPrecisava dos minérios dos anões.\nPrecisava do sangue da família real élfica.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      limparAntes: true,
      texto: "Melquior tira um medalhão do bolso.\nDentro existe a fotografia de uma mulher.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Há vinte anos…\nEla morreu em meus braços.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Prometi…\nQue jamais perderia quem eu amo novamente.\nMesmo que todo este mundo precisasse desaparecer.",
    },
    {
      id: "plot_twist",
      fundo: melquiorImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Seu maldito…",
    },

    // ── CENA 12 — BOSS FINAL ────────────────────────────────────────────────
    {
      id: "boss_final_intro",
      fundo: bossLichImg,
      limparAntes: true,
      texto: "O laboratório inteiro começa a tremer.\nUma enorme barreira envolve todo o reino élfico.",
    },
    {
      id: "boss_final_intro",
      fundo: bossLichImg,
      limparAntes: true,
      texto: "Melquior ergue seu cajado.\nSua aparência começa a mudar.",
    },
    {
      id: "boss_final_intro",
      fundo: bossLichImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Chegou ao fim…\nAventureiro.",
    },
    {
      id: "lich_boss",
      fundo: bossLichImg,
      tipo: "combate",
      inimigoTipo: "lich",
      texto: "O Lich ataca com toda sua magia sombria!",
    },

    // ── CENA FINAL ──────────────────────────────────────────────────────────
    {
      id: "cena_final",
      fundo: bossLichImg,
      limparAntes: true,
      texto: "Melquior cai lentamente.\nO medalhão escapa de sua mão.\nEle olha pela última vez para a fotografia.",
    },
    {
      id: "cena_final",
      fundo: bossLichImg,
      falante: "Melquior",
      limparAntes: true,
      texto: "Desculpe…\nEu realmente tentei…",
    },
    {
      id: "cena_final",
      fundo: bossLichImg,
      limparAntes: true,
      texto: "Ele morre.",
    },
    {
      id: "cena_final",
      telaEscura: true,
      limparAntes: true,
      texto: "A barreira desaparece.\nOs esqueletos começam a cair um após o outro.",
    },
    {
      id: "cena_final",
      fundo: casteloImg,
      falante: "Rei dos Humanos",
      limparAntes: true,
      texto: "Hoje…\nValedorn volta a conhecer a paz.",
    },
    {
      id: "cena_final",
      fundo: reinoElfosImg,
      falante: "Rainha Elfa",
      limparAntes: true,
      texto: "Jamais esqueceremos o que fez por nosso povo.",
    },
    {
      id: "cena_final",
      fundo: reinoAnoesImg,
      falante: "Rei dos Anões",
      limparAntes: true,
      texto: "Nossa dívida será eterna.",
    },
    {
      id: "cena_final",
      fundo: taylorMachucadoImg,
      falante: "Taylor",
      limparAntes: true,
      texto: "Finalmente…\nAcabou.",
    },
    {
      id: "fim_historia",
      telaEscura: true,
      limparAntes: true,
      texto: "Obrigado por jogar.\nFIM.",
    },
  ];
}

// ─────────────────────────────────────────────
// COMPONENTE: TEXTO COM DIGITAÇÃO
// ─────────────────────────────────────────────

function TextoDigitado({
  texto,
  onDone,
}: {
  texto: string;
  onDone: () => void;
}) {
  const [visivel, setVisivel] = useState("");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!texto) {
      onDoneRef.current();
      return;
    }
    setVisivel("");
    let indice = 0;
    const timer = window.setInterval(() => {
      indice += 1;
      setVisivel(texto.slice(0, indice));
      if (indice >= texto.length) {
        window.clearInterval(timer);
        onDoneRef.current();
      }
    }, VELOCIDADE_DIGITACAO);
    return () => window.clearInterval(timer);
  }, [texto]);

  return (
    <p className="typewriter-text">
      {visivel}
      <span className="typing-caret" aria-hidden="true" />
    </p>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: MERCADO
// ─────────────────────────────────────────────

function MercadoHistoria({
  personagem,
  onComprar,
  onSair,
}: {
  personagem: Personagem;
  onComprar: (itemId: string, custo: number) => void;
  onSair: () => void;
}) {
  return (
    <div className="story-market" onClick={(e) => e.stopPropagation()}>
      <p>
        Ouro: <strong>{personagem.stats.ouro}</strong>
      </p>
      <div className="story-market-items">
        {ITENS_MERCADO.map((item) => (
          <button
            key={item.id}
            className="market-item-button"
            disabled={personagem.stats.ouro < item.custo}
            onClick={() => onComprar(item.id, item.custo)}
          >
            <strong>{item.nome}</strong>
            <span>{item.descricao}</span>
            <span>Custo: {item.custo} gold.</span>
          </button>
        ))}
      </div>
      <button className="btn" onClick={onSair}>
        Ir embora
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: TELA HISTÓRIA
// ─────────────────────────────────────────────

function TelaHistoria({
  personagem: personagemInicial,
  slot,
  onFinish,
}: {
  personagem: Personagem;
  slot: number;
  onFinish: (personagemAtualizado: Personagem) => void;
}) {
  const [personagem, setPersonagem] = useState<Personagem>(personagemInicial);
  const momentos = useMemo(
    () => montarHistoria(personagem.nome, personagem.classe),
    [personagem.nome, personagem.classe]
  );

  const [indiceMomento, setIndiceMomento] = useState(0);
  const [digitacaoCompleta, setDigitacaoCompleta] = useState(false);
  // respostaEscolha: texto exibido depois que o usuário clica em uma opção da guilda
  const [respostaGuilda, setRespostaGuilda] = useState<string | null>(null);
  // controla se a recompensa do momento atual já foi aplicada
  const recompensasAplicadas = useRef<Set<number>>(new Set());
  // controla qual goblin da lista usar durante a história
  const indiceGoblin = useRef(0);
  // controla se taylor já entregou a poção (para não remover 2x)
  const pocaoEntregue = useRef(false);

  const momento = momentos[indiceMomento];
  const textoExibido = respostaGuilda ?? momento.texto ?? "";

  // Salva sempre que o personagem mudar (vida, xp, ouro, inventário, etc.)
  useEffect(() => {
    salvarPersonagem(personagem, slot);
  }, [personagem, slot]);

  const irPara = useCallback(
    (alvoId: MomentoId, aPartirDe: number) => {
      const proximo = momentos.findIndex((m, i) => i > aPartirDe && m.id === alvoId);
      const idx = proximo >= 0 ? proximo : momentos.findIndex((m) => m.id === alvoId);
      if (idx >= 0) {
        setIndiceMomento(idx);
        setDigitacaoCompleta(false);
        setRespostaGuilda(null);
      }
    },
    [momentos]
  );

  const avancarSequencial = useCallback(() => {
    const proximo = Math.min(indiceMomento + 1, momentos.length - 1);
    setIndiceMomento(proximo);
    setDigitacaoCompleta(false);
    setRespostaGuilda(null);
  }, [indiceMomento, momentos.length]);

  // Avança automaticamente para momentos com duração automática
  useEffect(() => {
    if (!momento.duracaoAutomatica) return;
    const timer = window.setTimeout(avancarSequencial, momento.duracaoAutomatica);
    return () => window.clearTimeout(timer);
  }, [indiceMomento, momento.duracaoAutomatica, avancarSequencial]);

  // Aplica recompensa (item ou bônus de arma) do momento atual (uma só vez)
  const aplicarRecompensaAtual = useCallback(() => {
    if (recompensasAplicadas.current.has(indiceMomento)) return;

    if (momento.recompensa) {
      recompensasAplicadas.current.add(indiceMomento);
      setPersonagem((p) =>
        adicionarItem(p, momento.recompensa!.itemId, momento.recompensa!.quantidade)
      );
      return;
    }

    // Bônus de arma élfica (cena 09), aplicado de acordo com a classe do jogador
    if (momento.id === "escolha_arma") {
      recompensasAplicadas.current.add(indiceMomento);
      setPersonagem((p) => {
        const atributo: AtributoDistribuivel = p.classe === "mago" ? "magia" : "ataque";
        return { ...p, stats: { ...p.stats, [atributo]: p.stats[atributo] + 8 } };
      });
    }
  }, [momento, indiceMomento]);

  const concluirDigitacao = useCallback(() => setDigitacaoCompleta(true), []);

  // Clique na caixa de diálogo
  const aoClicar = () => {
    if (!digitacaoCompleta) return;
    if (momento.duracaoAutomatica) return;
    if (momento.tipo) return; // combate / mercado / portão: botões próprios
    if (momento.escolhas && !respostaGuilda) return; // aguarda escolha

    aplicarRecompensaAtual();

    if (momento.id === "fim_historia") {
      onFinish(personagem);
      return;
    }
    avancarSequencial();
  };

  const selecionarEscolha = (escolha: { texto: string; proxId: MomentoId }) => {
    // Escolhas especiais da guilda: exibe resposta antes de navegar
    if (momento.id === "escolha_guilda") {
      const respostas: Record<string, string> = {
        "Devem ser só uns ladrões.":
          "Melquior:\nLadrões é… eu não tenho certeza disso, mas sei que logo dará tudo certo.",
        "Leve-me logo ao Rei, quanto mais cedo resolvemos melhor para todos.":
          "Melquior:\nIguais a você já vinheram aos montes aqui, se está nessa missão pelo dinheiro, então boa sorte tentando não se matar. Precisamos muito de novas pessoas para nos ajudar.",
      };
      setRespostaGuilda(respostas[escolha.texto] ?? null);
      setDigitacaoCompleta(false);
      // A navegação para castelo_inicio acontece quando o usuário clicar depois da resposta
      return;
    }

    // Entregar poção ao Taylor: remove item do inventário
    if (momento.id === "taylor_escolha" && escolha.texto.startsWith("Entregar")) {
      if (!pocaoEntregue.current) {
        pocaoEntregue.current = true;
        setPersonagem((p) => {
          const temMedia = p.inventario.find((i) => i.id === "pocao_media" && i.quantidade > 0);
          const temPequena = p.inventario.find((i) => i.id === "pocao_cura" && i.quantidade > 0);
          if (temMedia) return removerItem(p, "pocao_media");
          if (temPequena) return removerItem(p, "pocao_cura");
          return p;
        });
      }
    }

    aplicarRecompensaAtual();
    irPara(escolha.proxId, indiceMomento);
  };

  const comprarItem = (itemId: string, custo: number) => {
    setPersonagem((p) => {
      if (p.stats.ouro < custo) return p;
      return adicionarItem(
        { ...p, stats: { ...p.stats, ouro: p.stats.ouro - custo } },
        itemId
      );
    });
  };

  // Navegação após clicar em "Seguir em frente" no portão
  const avancarPortao = () => {
    irPara("vila_entrada", indiceMomento);
  };

  // Vitória em combate da história — recebe o personagem já atualizado (com
  // vida atual, xp, ouro e inventário corretos) e a vida atual após a vitória.
  const aoVencerCombate = (personagemAtualizado: Personagem, novaVida: number) => {
    setPersonagem({ ...personagemAtualizado, vidaAtual: novaVida });
    avancarSequencial();
  };

  const aoMorrerCombate = () => {
    localStorage.removeItem(`save${slot}`);
    window.location.reload();
  };

  const temFundo = !!momento.fundo && momento.tipo !== "combate";
  const estiloCombate = momento.tipo === "combate";

  return (
    <section
      className={[
        "story-screen",
        momento.telaEscura ? "story-blackout" : "",
        temFundo ? "story-has-background" : "",
        estiloCombate ? "story-combat-screen" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={momento.fundo ? { backgroundImage: `url(${momento.fundo})` } : undefined}
    >
      <div className="story-vignette" />

      {textoExibido && (
        <div className="story-dialog" onClick={aoClicar}>
          {momento.falante && !respostaGuilda && (
            <strong className="story-speaker">{momento.falante}:</strong>
          )}

          <TextoDigitado
            key={`${indiceMomento}-${respostaGuilda ?? "base"}`}
            texto={textoExibido}
            onDone={concluirDigitacao}
          />

          {/* Escolhas */}
          {digitacaoCompleta && momento.escolhas && !respostaGuilda && (
            <div className="story-choices">
              {momento.escolhas.map((escolha) => (
                <button
                  key={escolha.texto}
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    selecionarEscolha(escolha);
                  }}
                >
                  {escolha.texto}
                </button>
              ))}
            </div>
          )}

          {/* Mercado */}
          {digitacaoCompleta && momento.tipo === "mercado" && (
            <MercadoHistoria
              personagem={personagem}
              onComprar={comprarItem}
              onSair={() => irPara("porta_cidade", indiceMomento)}
            />
          )}

          {/* Portão / seguir em frente */}
          {digitacaoCompleta && momento.tipo === "portao" && (
            <div className="story-choices">
              <button
                className="btn"
                onClick={(e) => {
                  e.stopPropagation();
                  avancarPortao();
                }}
              >
                Seguir em frente
              </button>
            </div>
          )}

          {/* Combate na história */}
          {digitacaoCompleta && momento.tipo === "combate" && (
            <CombateHistoria
              personagem={personagem}
              slot={slot}
              inimigoTipo={momento.inimigoTipo ?? "goblin"}
              indiceGoblin={momento.inimigoTipo === "goblin" ? (indiceGoblin.current++) : 0}
              recompensa={momento.recompensa}
              onVencer={aoVencerCombate}
              onMorrer={aoMorrerCombate}
            />
          )}

          {/* "Clique para continuar" */}
          {digitacaoCompleta &&
            !momento.tipo &&
            (!momento.escolhas || respostaGuilda) &&
            momento.id !== "fim_historia" && (
              <span className="story-hint">Clique para continuar</span>
            )}

          {/* Botão de fim de história */}
          {digitacaoCompleta && momento.id === "fim_historia" && (
            <div className="story-choices">
              <button
                className="btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinish(personagem);
                }}
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: COMBATE NA HISTÓRIA (wrapper)
// ─────────────────────────────────────────────

function CombateHistoria({
  personagem,
  slot,
  inimigoTipo,
  indiceGoblin,
  recompensa,
  onVencer,
  onMorrer,
}: {
  personagem: Personagem;
  slot: number;
  inimigoTipo: TipoInimigo;
  indiceGoblin: number;
  recompensa?: Recompensa;
  onVencer: (personagemAtualizado: Personagem, novaVida: number) => void;
  onMorrer: () => void;
}) {
  const inimigo = useMemo(
    () => criarInimigoParaCombate(inimigoTipo, personagem.progresso.nivel, indiceGoblin),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <TelaCombate
      personagem={personagem}
      slot={slot}
      encontroInicial={inimigo}
      modoHistoria
      recompensaVitoria={recompensa}
      onBack={() => onVencer(personagem, personagem.vidaAtual ?? personagem.stats.vida)}
      onDeath={onMorrer}
      onVictory={onVencer}
    />
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: TELA COMBATE
// ─────────────────────────────────────────────

type InimigoEmCombate = { inimigo: Inimigo; vida: number };

function criarInimigoEmCombate(inimigo: Inimigo): InimigoEmCombate {
  return { inimigo: { ...inimigo }, vida: inimigo.vidaMaxima };
}

function TelaCombate({
  personagem: personagemProp,
  slot,
  onBack,
  onDeath,
  encontroInicial,
  modoHistoria = false,
  recompensaVitoria,
  onVictory,
}: {
  personagem: Personagem;
  slot: number;
  onBack: () => void;
  onDeath: () => void;
  encontroInicial?: Inimigo;
  modoHistoria?: boolean;
  recompensaVitoria?: Recompensa;
  onVictory?: (personagemAtualizado: Personagem, novaVida: number) => void;
}) {
  const inimigoInicial = useMemo(
    () => encontroInicial ?? criarInimigoAleatorio(personagemProp.progresso.nivel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [player, setPlayer] = useState<Personagem>(personagemProp);
  const [inimigosAtivos, setInimigosAtivos] = useState<InimigoEmCombate[]>([
    criarInimigoEmCombate(inimigoInicial),
  ]);
  const [alvoSelecionado, setAlvoSelecionado] = useState(0);
  // a vida atual sempre parte do que está salvo no personagem — só é restaurada
  // a 100% quando o jogador sobe de nível (ver lógica de vitória mais abaixo).
  const [vidaPlayer, setVidaPlayer] = useState(
    personagemProp.vidaAtual ?? personagemProp.stats.vida
  );
  const [log, setLog] = useState<string[]>([
    `${personagemProp.nome} encontrou ${inimigoInicial.nome} Lv.${inimigoInicial.nivel}.`,
  ]);
  const [turnosParalisadoInimigo, setTurnosParalisadoInimigo] = useState(0);
  const [turnosSemAtacar, setTurnosSemAtacar] = useState(0);
  const [penalidadeFuga, setPenalidadeFuga] = useState(0);
  const [mostraItens, setMostraItens] = useState(false);
  const [modalNivel, setModalNivel] = useState(false);
  const [niveisPendentes, setNiveisPendentes] = useState(0);
  // vitória da história aguardando o fechamento do modal de nível (se houver)
  const [vitoriaPendente, setVitoriaPendente] = useState<{
    personagem: Personagem;
    vida: number;
  } | null>(null);

  const alvoAtual = inimigosAtivos[alvoSelecionado] ?? inimigosAtivos[0];
  const combateEncerrado = inimigosAtivos.length === 0;
  const chanceFuga = Math.max(5, CHANCE_FUGA_BASE - penalidadeFuga);
  const acaoDesabilitada = vidaPlayer <= 0 || combateEncerrado || modalNivel;

  // Mantém a vida atual sincronizada no personagem (para persistir corretamente)
  useEffect(() => {
    setPlayer((p) => (p.vidaAtual === vidaPlayer ? p : { ...p, vidaAtual: vidaPlayer }));
  }, [vidaPlayer]);

  // Salva sempre que o player mudar
  useEffect(() => {
    salvarPersonagem(player, slot);
  }, [player, slot]);

  // Só avança a história depois que o modal de nível (se aberto) for confirmado.
  // Isso evita que a tela de distribuição de pontos seja fechada à força antes
  // do jogador terminar de gastar os pontos.
  useEffect(() => {
    if (!vitoriaPendente || modalNivel) return;
    const t = window.setTimeout(() => {
      onVictory?.(vitoriaPendente.personagem, vitoriaPendente.vida);
      setVitoriaPendente(null);
    }, 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitoriaPendente, modalNivel]);

  const adicionarLog = (mensagem: string) =>
    setLog((l) => [mensagem, ...l]);

  // ── Ataque dos monstros ─────────────────────────────────────────────
  function ataqueDosMonstros(vidaAtual: number, listaInimigos: InimigoEmCombate[]): number {
    let vidaRestante = vidaAtual;

    listaInimigos.forEach(({ inimigo, vida }, idx) => {
      if (vidaRestante <= 0) return;

      const golpesDisponiveis = inimigo.golpes.filter(
        (g) => g.nome !== "Estilhaço de ossos" || vida <= inimigo.vidaMaxima * 0.3
      );
      const golpe =
        golpesDisponiveis[(log.length + idx) % golpesDisponiveis.length] ?? inimigo.golpes[0];

      // Invocar goblin guerreiro
      if (golpe.nome === "Invocar Goblin Guerreiro") {
        setInimigosAtivos((lista) => [
          ...lista,
          criarInimigoEmCombate({
            ...GOBLIN_GUERREIRO,
            nivel: player.progresso.nivel,
            xpDrop: sortearInteiro(4, 5),
          }),
        ]);
        adicionarLog(`${inimigo.nome} invocou um ${GOBLIN_GUERREIRO.nome}!`);
        return;
      }

      const dano = calcDano(
        golpe.dano + (golpe.tipo === "magia" ? inimigo.magia : inimigo.ataque),
        player.stats.defesa
      );
      vidaRestante = Math.max(0, vidaRestante - dano);
      adicionarLog(`${inimigo.nome} usou ${golpe.nome} e causou ${dano} de dano.`);

      if (golpe.efeito === "invencivel") {
        setTurnosParalisadoInimigo(1);
        adicionarLog(`${inimigo.nome} ficou invencível por 1 turno.`);
      }
      if (golpe.efeito === "sem_atacar") {
        setTurnosSemAtacar(1);
        adicionarLog(`${player.nome} ficou 1 turno sem atacar.`);
      }
    });

    setVidaPlayer(vidaRestante);

    if (vidaRestante <= 0) {
      adicionarLog(`${player.nome} foi derrotado. Todo o progresso foi perdido.`);
      setTimeout(onDeath, 900);
    }

    return vidaRestante;
  }

  // ── Iniciar novo combate (modo livre) ─────────────────────────────
  function iniciarNovoCombate() {
    const proximoInimigo = criarInimigoAleatorio(player.progresso.nivel);
    setInimigosAtivos([criarInimigoEmCombate(proximoInimigo)]);
    setAlvoSelecionado(0);
    setTurnosParalisadoInimigo(0);
    setTurnosSemAtacar(0);
    setPenalidadeFuga(0);
    setMostraItens(false);
    adicionarLog(`${player.nome} encontrou ${proximoInimigo.nome} Lv.${proximoInimigo.nivel}.`);
  }

  // ── Executar ação do jogador ───────────────────────────────────────
  function executarAcao(acao: AcaoCombate) {
    if (acaoDesabilitada || !alvoAtual) return;

    // Turno perdido por efeito
    if (turnosSemAtacar > 0 && acao !== "fugir") {
      setTurnosSemAtacar((t) => Math.max(0, t - 1));
      adicionarLog("Você está assustado e perdeu o turno sem atacar.");
      ataqueDosMonstros(vidaPlayer, inimigosAtivos);
      return;
    }

    // Fuga
    if (acao === "fugir") {
      if (modoHistoria) {
        adicionarLog("Você não pode fugir deste combate da história.");
        ataqueDosMonstros(vidaPlayer, inimigosAtivos);
        return;
      }
      setPenalidadeFuga((p) => p + 10);
      if (rolarPorcentagem() < chanceFuga) {
        adicionarLog("Você fugiu com sucesso.");
        onBack();
      } else {
        adicionarLog("Falhou ao fugir.");
        ataqueDosMonstros(vidaPlayer, inimigosAtivos);
      }
      return;
    }

    // Itens
    if (acao === "item") {
      setMostraItens((v) => !v);
      return;
    }

    // Ataque / magia / habilidade
    const nomeAcao =
      acao === "magia"
        ? player.magiaNome
        : acao === "habilidade"
        ? player.habilidade
        : "Ataque básico";

    const bruto =
      acao === "ataque"
        ? player.stats.ataque
        : acao === "magia"
        ? player.stats.magia + 4
        : player.stats.ataque + player.stats.magia * 0.6;

    const danoBase = calcDano(bruto, alvoAtual.inimigo.defesa);
    const ehFisico = acao === "ataque";
    const danoFinal =
      ehFisico && alvoAtual.inimigo.reducaoDanoFisico
        ? Math.max(1, Math.floor(danoBase * alvoAtual.inimigo.reducaoDanoFisico))
        : danoBase;
    const dano = turnosParalisadoInimigo > 0 ? 0 : danoFinal;

    if (turnosParalisadoInimigo > 0)
      setTurnosParalisadoInimigo((t) => Math.max(0, t - 1));

    const novaVidaAlvo = Math.max(0, alvoAtual.vida - dano);
    adicionarLog(`Você usou ${nomeAcao} em ${alvoAtual.inimigo.nome} e causou ${dano} de dano.`);

    // Inimigo morreu
    if (novaVidaAlvo <= 0) {
      const ouroGanho = alvoAtual.inimigo.ouroDrop;
      const xpGanho = alvoAtual.inimigo.xpDrop;
      const falaMorte =
        alvoAtual.inimigo.falas?.aoMorrer
          ? `${alvoAtual.inimigo.nome}: ${alvoAtual.inimigo.falas.aoMorrer}`
          : `${alvoAtual.inimigo.nome} foi derrotado!`;

      adicionarLog(`${falaMorte} +${xpGanho} XP, +${ouroGanho} ouro.`);

      const playerComOuro = {
        ...player,
        stats: { ...player.stats, ouro: player.stats.ouro + ouroGanho },
      };
      const { personagem: playerComXp, niveisGanhos } = aplicarXp(playerComOuro, xpGanho);

      let playerFinal = playerComXp;
      // vida que o jogador terá depois deste combate: por padrão continua
      // exatamente como estava (não volta cheia à toa); só é restaurada a
      // 100% quando o jogador sobe de nível.
      let vidaResultante = vidaPlayer;

      if (niveisGanhos > 0) {
        vidaResultante = playerFinal.stats.vida;
        setVidaPlayer(vidaResultante);
        adicionarLog(
          `Subiu de nível! ${playerFinal.nome} teve a vida totalmente restaurada.`
        );
        setNiveisPendentes((n) => n + niveisGanhos);
        setModalNivel(true);
      }

      setPlayer(playerFinal);

      setInimigosAtivos((lista) => {
        const vivos = lista.filter((_, i) => i !== alvoSelecionado);
        setAlvoSelecionado(Math.max(0, Math.min(alvoSelecionado, vivos.length - 1)));

        if (modoHistoria && vivos.length === 0) {
          let personagemVitorioso = playerFinal;
          if (recompensaVitoria) {
            personagemVitorioso = adicionarItem(
              personagemVitorioso,
              recompensaVitoria.itemId,
              recompensaVitoria.quantidade
            );
            adicionarLog(recompensaVitoria.mensagem);
          }
          personagemVitorioso = { ...personagemVitorioso, vidaAtual: vidaResultante };
          // Só dispara a transição de fato quando não houver modal de nível
          // pendente (ver useEffect de vitoriaPendente acima).
          setVitoriaPendente({ personagem: personagemVitorioso, vida: vidaResultante });
        }

        return vivos;
      });
      return;
    }

    // Inimigo sobreviveu
    setInimigosAtivos((lista) =>
      lista.map((item, i) =>
        i === alvoSelecionado ? { ...item, vida: novaVidaAlvo } : item
      )
    );
    ataqueDosMonstros(vidaPlayer, inimigosAtivos);
  }

  const usarItemCombate = (item: (typeof ITENS_COMBATE)[number]) => {
    const inv = player.inventario.find((i) => i.id === item.id);
    if (!inv?.quantidade) return;
    const novaVida = Math.min(player.stats.vida, vidaPlayer + item.cura);
    setPlayer((p) => removerItem(p, item.id));
    setVidaPlayer(novaVida);
    setMostraItens(false);
    adicionarLog(`Você usou ${item.nome} e restaurou ${novaVida - vidaPlayer} de vida.`);
    ataqueDosMonstros(novaVida, inimigosAtivos);
  };

  return (
    <section
      className={`panel combate-panel ${modoHistoria ? "historia-combate-panel" : ""}`}
    >
      <h2>Combate</h2>

      <div className="combatants">
        <div className="fighter-card">
          <img src={player.imagem} alt={player.nome} className="fighter-img" />
          <strong>{player.nome}</strong>
          <span>
            {CLASSES[player.classe].nome} Lv.{player.progresso.nivel}
          </span>
        </div>

        {inimigosAtivos.map(({ inimigo, vida }, idx) => (
          <button
            key={`${inimigo.id}-${idx}`}
            type="button"
            className={`fighter-card enemy-target ${idx === alvoSelecionado ? "selected" : ""}`}
            onClick={() => setAlvoSelecionado(idx)}
          >
            <img src={inimigo.imagem} alt={inimigo.nome} className="fighter-img" />
            <strong>{inimigo.nome}</strong>
            <span>Lv.{inimigo.nivel}</span>
            <span>
              Vida: {vida}/{inimigo.vidaMaxima}
            </span>
          </button>
        ))}
      </div>

      <div className="novo-jogo-info">
        Ouro: <strong>{player.stats.ouro}</strong> | XP:{" "}
        <strong>
          {player.progresso.xp}/{player.progresso.xpProximo}
        </strong>{" "}
        | Pontos: <strong>{player.progresso.pontosStatus}</strong>
      </div>

      <div className="hp-wrap">
        <span>
          Sua vida: {vidaPlayer}/{player.stats.vida}
        </span>
        <div className="hp-bar">
          <div style={{ width: `${barraPct(vidaPlayer, player.stats.vida)}%` }} />
        </div>
      </div>

      {alvoAtual && (
        <div className="hp-wrap">
          <span>
            Alvo: {alvoAtual.inimigo.nome} ({alvoAtual.vida}/{alvoAtual.inimigo.vidaMaxima})
          </span>
          <div className="hp-bar enemy">
            <div
              style={{
                width: `${barraPct(alvoAtual.vida, alvoAtual.inimigo.vidaMaxima)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="row">
        {(["ataque", "magia", "habilidade", "item", "fugir"] as AcaoCombate[]).map((a) => (
          <button
            key={a}
            className="btn"
            disabled={acaoDesabilitada || (modoHistoria && a === "fugir")}
            onClick={() => executarAcao(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {mostraItens && (
        <ListaItens
          itens={player.inventario}
          vidaAtual={vidaPlayer}
          vidaMaxima={player.stats.vida}
          usarItem={usarItemCombate}
        />
      )}

      {!modoHistoria && (
        <div className="row">
          <button
            className="btn"
            disabled={vidaPlayer <= 0 || !combateEncerrado || modalNivel}
            onClick={iniciarNovoCombate}
          >
            Procurar outro inimigo
          </button>
        </div>
      )}

      {modalNivel && (
        <ModalNivel
          personagem={player}
          niveisGanhos={niveisPendentes}
          distribuir={(atributo) => {
            if (player.progresso.pontosStatus <= 0) return;
            setPlayer((p) => ({
              ...p,
              stats: { ...p.stats, [atributo]: p.stats[atributo] + 1 },
              progresso: { ...p.progresso, pontosStatus: p.progresso.pontosStatus - 1 },
            }));
          }}
          fechar={() => {
            setModalNivel(false);
            setNiveisPendentes(0);
          }}
        />
      )}

      <div className="log">
        {log.slice(0, 8).map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>

      {!modoHistoria && (
        <button className="btn" onClick={onBack}>
          Voltar
        </button>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: LISTA DE ITENS
// ─────────────────────────────────────────────

function ListaItens({
  itens,
  vidaAtual,
  vidaMaxima,
  usarItem,
}: {
  itens: ItemInventario[];
  vidaAtual: number;
  vidaMaxima: number;
  usarItem: (item: (typeof ITENS_COMBATE)[number]) => void;
}) {
  const disponiveis = ITENS_COMBATE.filter((item) =>
    itens.some((i) => i.id === item.id && i.quantidade > 0)
  );

  return (
    <div className="items-panel">
      <h3>Itens</h3>
      {disponiveis.length === 0 ? (
        <p>Você não tem itens.</p>
      ) : (
        <div className="items-list">
          {disponiveis.map((item) => {
            const quantidade = itens.find((i) => i.id === item.id)?.quantidade ?? 0;
            return (
              <button
                key={item.id}
                className="item-button"
                disabled={item.cura > 0 && vidaAtual >= vidaMaxima}
                onClick={() => usarItem(item)}
              >
                <strong>
                  {item.nome} x{quantidade}
                </strong>
                <span>{item.descricao}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: MODAL NÍVEL
// ─────────────────────────────────────────────

function ModalNivel({
  personagem,
  niveisGanhos,
  distribuir,
  fechar,
}: {
  personagem: Personagem;
  niveisGanhos: number;
  distribuir: (atributo: AtributoDistribuivel) => void;
  fechar: () => void;
}) {
  const classeBase = CLASSES[personagem.classe].base;
  const pontos = personagem.progresso.pontosStatus;

  return (
    <div className="level-overlay" role="dialog" aria-modal="true" aria-labelledby="level-title">
      <div className="level-modal">
        <p className="level-kicker">Nível aumentado!</p>
        <h3 id="level-title">
          {personagem.nome} chegou ao nível {personagem.progresso.nivel}
        </h3>
        <p>
          Você ganhou {niveisGanhos} nível(is). Distribua os pontos recebidos nos atributos
          abaixo.
        </p>
        <div className="attributes-grid">
          {ATRIBUTOS_DISTRIBUIVEIS.map((atributo) => (
            <div key={atributo} className="attribute-row">
              <div>
                <strong>{atributo}</strong>
                <span>
                  Inicial: {classeBase[atributo]} | Atual: {personagem.stats[atributo]}
                </span>
              </div>
              <button
                className="plus-btn"
                disabled={pontos <= 0}
                onClick={() => distribuir(atributo)}
                aria-label={`Aumentar ${atributo}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
        <div className="level-footer">
          <span>
            Pontos disponíveis: <strong>{pontos}</strong>
          </span>
          <button className="btn" disabled={pontos > 0} onClick={fechar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: MODAL CONFIRMAÇÃO
// ─────────────────────────────────────────────

function ModalConfirmacao({
  titulo,
  mensagem,
  confirmar,
  cancelar,
  perigo = false,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  mensagem: string;
  confirmar: string;
  cancelar?: string;
  perigo?: boolean;
  onConfirmar: () => void;
  onCancelar?: () => void;
}) {
  return (
    <div
      className="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="confirm-modal">
        <h3 id="confirm-title">{titulo}</h3>
        <p>{mensagem}</p>
        <div className="row">
          {cancelar && (
            <button className="btn" onClick={onCancelar}>
              {cancelar}
            </button>
          )}
          <button
            className={`btn ${perigo ? "danger-btn" : ""}`}
            onClick={onConfirmar}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: CRIAR PERSONAGEM
// ─────────────────────────────────────────────

function CriarPersonagem({
  slot,
  voltar,
  iniciarHistoria,
}: {
  slot: number;
  voltar: () => void;
  iniciarHistoria: (personagem: Personagem) => void;
}) {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<ClasseId>("guerreiro");
  const [personagemCriado, setPersonagemCriado] = useState<Personagem | null>(null);
  const classeAtual = CLASSES[classe];

  function salvar() {
    if (!nome.trim()) return alert("Digite um nome.");
    const personagem: Personagem = {
      nome: nome.trim(),
      classe,
      stats: { ...classeAtual.base },
      vidaAtual: classeAtual.base.vida,
      habilidade: classeAtual.habilidade,
      magiaNome: classeAtual.magiaNome,
      imagem: classeAtual.imagem,
      progresso: { nivel: 1, xp: 0, xpProximo: 20, pontosStatus: 0 },
      inventario: [{ id: "pocao_cura", quantidade: 1 }],
    };
    salvarPersonagem(personagem, slot);
    setPersonagemCriado(personagem);
  }

  return (
    <section className="panel">
      <h2>Criar Personagem</h2>
      <input
        className="field"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <select
        className="field"
        value={classe}
        onChange={(e) => setClasse(e.target.value as ClasseId)}
      >
        <option value="guerreiro">Guerreiro</option>
        <option value="mago">Mago</option>
        <option value="ladino">Ladino</option>
      </select>

      <div className="class-preview">
        <img src={classeAtual.imagem} alt={classeAtual.nome} className="class-img" />
        <h3>{classeAtual.nome}</h3>
        <p>Vida: {classeAtual.base.vida}</p>
        <p>Defesa: {classeAtual.base.defesa}</p>
        <p>Magia: {classeAtual.base.magia}</p>
        <p>Agilidade: {classeAtual.base.agilidade}</p>
        <p>Ataque: {classeAtual.base.ataque}</p>
        <p>Ouro: {classeAtual.base.ouro}</p>
        <p>
          <strong>Habilidade:</strong> {classeAtual.habilidade}
        </p>
        <p>
          <strong>Magia:</strong> {classeAtual.magiaNome}
        </p>
      </div>

      <div className="row">
        <button className="btn" onClick={salvar}>
          Criar
        </button>
        <button className="btn" onClick={voltar}>
          Voltar
        </button>
      </div>

      {personagemCriado && (
        <ModalConfirmacao
          titulo="A jornada começa!"
          mensagem={`${personagemCriado.nome} foi salvo no slot ${slot}. As brumas de Valedorn se abrem diante de você...`}
          confirmar="Iniciar história"
          onConfirmar={() => iniciarHistoria(personagemCriado)}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: TELA SLOTS
// ─────────────────────────────────────────────

function TelaSlots({
  onSelect,
  onBack,
}: {
  onSelect: (slot: number) => void;
  onBack: () => void;
}) {
  return (
    <section className="panel">
      <h2>Escolha um Slot</h2>
      <div className="stack">
        {[1, 2, 3, 4].map((slot) => {
          const p = lerSave(slot);
          return (
            <button key={slot} className="btn" onClick={() => onSelect(slot)}>
              {p
                ? `Slot ${slot}: ${p.nome} | ${CLASSES[p.classe].nome} | Lv.${p.progresso.nivel} | Ouro ${p.stats.ouro}`
                : `Slot ${slot} (vazio)`}
            </button>
          );
        })}
      </div>
      <button className="btn" onClick={onBack}>
        Voltar
      </button>
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: TELA CONTINUAR
// ─────────────────────────────────────────────

function TelaContinuar({
  onBack,
  onFight,
}: {
  onBack: () => void;
  onFight: (personagem: Personagem, slot: number) => void;
}) {
  const [slotExcluir, setSlotExcluir] = useState<number | null>(null);
  const saveExcluir = slotExcluir ? lerSave(slotExcluir) : null;

  function excluirSave() {
    if (!slotExcluir) return;
    localStorage.removeItem(`save${slotExcluir}`);
    setSlotExcluir(null);
  }

  return (
    <section className="panel">
      <h2>Continuar</h2>
      <div className="stack">
        {[1, 2, 3, 4].map((slot) => {
          const p = lerSave(slot);
          return (
            <div key={slot} className="save-row">
              <button
                className="btn save-play"
                disabled={!p}
                onClick={() => p && onFight(p, slot)}
              >
                {p
                  ? `${p.nome} (${CLASSES[p.classe].nome}) - Lv.${p.progresso.nivel} - Lutar`
                  : `Slot ${slot} vazio`}
              </button>
              <button
                className="btn danger-btn"
                disabled={!p}
                onClick={() => setSlotExcluir(slot)}
              >
                Excluir
              </button>
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={onBack}>
        Voltar
      </button>

      {slotExcluir && saveExcluir && (
        <ModalConfirmacao
          titulo="Excluir jogo"
          mensagem={`Tem certeza que deseja excluir ${saveExcluir.nome}? Todo o progresso será perdido.`}
          confirmar="Excluir"
          cancelar="Cancelar"
          perigo
          onConfirmar={excluirSave}
          onCancelar={() => setSlotExcluir(null)}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE: APP (raiz)
// ─────────────────────────────────────────────

export default function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [personagemAtivo, setPersonagemAtivo] = useState<Personagem | null>(null);
  const [slotAtivo, setSlotAtivo] = useState<number | null>(null);

  const temSave = [1, 2, 3, 4].some((i) => !!localStorage.getItem(`save${i}`));

  return (
    <main className="app-shell">
      {tela === "menu" && (
        <section className="menu-screen">
          <img src={telaInicial} alt="Tela inicial" className="menu-image" />
          <div className="menu-buttons">
            <button className="menu-btn" onClick={() => setTela("slots")}>
              Novo Jogo
            </button>
            <button
              className="menu-btn"
              disabled={!temSave}
              onClick={() => setTela("continuar")}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {tela === "slots" && (
        <TelaSlots
          onBack={() => setTela("menu")}
          onSelect={(slot) => {
            setSlotSelecionado(slot);
            setTela("criar");
          }}
        />
      )}

      {tela === "criar" && slotSelecionado !== null && (
        <CriarPersonagem
          slot={slotSelecionado}
          voltar={() => setTela("slots")}
          iniciarHistoria={(personagem) => {
            setPersonagemAtivo(personagem);
            setSlotAtivo(slotSelecionado);
            setTela("historia");
          }}
        />
      )}

      {tela === "continuar" && (
        <TelaContinuar
          onBack={() => setTela("menu")}
          onFight={(p, slot) => {
            setPersonagemAtivo(p);
            setSlotAtivo(slot);
            setTela("combate");
          }}
        />
      )}

      {tela === "historia" && personagemAtivo && slotAtivo !== null && (
        <TelaHistoria
          personagem={personagemAtivo}
          slot={slotAtivo}
          onFinish={(personagemAtualizado) => {
            setPersonagemAtivo(personagemAtualizado);
            setTela("combate");
          }}
        />
      )}

      {tela === "combate" && personagemAtivo && slotAtivo !== null && (
        <TelaCombate
          personagem={personagemAtivo}
          slot={slotAtivo}
          onBack={() => setTela("continuar")}
          onDeath={() => {
            localStorage.removeItem(`save${slotAtivo}`);
            setPersonagemAtivo(null);
            setSlotAtivo(null);
            setTela("menu");
          }}
        />
      )}
    </main>
  );
}
