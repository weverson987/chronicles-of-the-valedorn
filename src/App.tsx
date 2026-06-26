import { useCallback, useEffect, useMemo, useState } from "react";
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
import { GOBLINS, GOBLIN_GUERREIRO, chanceEncontroGoblin } from "../entidades/monstros/goblin";
import { FANTASMA, chanceEncontroFantasma } from "../entidades/monstros/fantasma";
import { ESQUELETO, chanceEncontroEsqueleto } from "../entidades/monstros/esqueleto";
import type { Inimigo } from "../entidades/monstros/tipos";
import "./App.css";


type Tela = "menu" | "slots" | "criar" | "continuar" | "historia" | "combate";
type ClasseId = "guerreiro" | "mago" | "ladino";
type AcaoCombate = "ataque" | "magia" | "habilidade" | "item" | "fugir";
type AtributoDistribuivel = "vida" | "defesa" | "magia" | "agilidade" | "ataque";

type Stats = { vida: number; defesa: number; magia: number; agilidade: number; ataque: number; ouro: number };
type ClasseConfig = { nome: string; base: Stats; habilidade: string; magiaNome: string; imagem: string };
type Progresso = { nivel: number; xp: number; xpProximo: number; pontosStatus: number };
type ItemInventario = { id: string; quantidade: number };
type Personagem = { nome: string; classe: ClasseId; stats: Stats; habilidade: string; magiaNome: string; imagem: string; progresso: Progresso; inventario: ItemInventario[] };

const CLASSES: Record<ClasseId, ClasseConfig> = {
  guerreiro: { nome: "Guerreiro", base: { vida: 15, defesa: 5, magia: 0, agilidade: 5, ataque: 15, ouro: 30 }, habilidade: "Incansável", magiaNome: "Golpe Arcano", imagem: guerreiroImg },
  mago: { nome: "Mago", base: { vida: 11, defesa: 3, magia: 15, agilidade: 5, ataque: 5, ouro: 30 }, habilidade: "Fireball", magiaNome: "Fireball", imagem: magoImg },
  ladino: { nome: "Ladino", base: { vida: 10, defesa: 3, magia: 5, agilidade: 10, ataque: 8, ouro: 30 }, habilidade: "Dark Poison", magiaNome: "Dark Poison", imagem: ladinaImg },
};

const PROGRESSAO_NIVEL = [
  { nivel: 1, xpProximo: 20, pontosStatus: 0 },
  { nivel: 2, xpProximo: 55, pontosStatus: 7 },
  { nivel: 3, xpProximo: 90, pontosStatus: 7 },
  { nivel: 4, xpProximo: 150, pontosStatus: 7 },
  { nivel: 5, xpProximo: 240, pontosStatus: 7 },
  { nivel: 6, xpProximo: 320, pontosStatus: 7 },
  { nivel: 7, xpProximo: 470, pontosStatus: 7 },
  { nivel: 8, xpProximo: 540, pontosStatus: 7 },
  { nivel: 9, xpProximo: 590, pontosStatus: 7 },
  { nivel: 10, xpProximo: 670, pontosStatus: 7 },
];

const ATRIBUTOS_DISTRIBUIVEIS: AtributoDistribuivel[] = ["vida", "defesa", "magia", "agilidade", "ataque"];

const ITENS_COMBATE = [
  { id: "pocao_cura", nome: "Poção pequena", descricao: "Restaura 5 de vida.", cura: 5 },
  { id: "pocao_media", nome: "Poção média", descricao: "Restaura 10 de vida.", cura: 10 },
  { id: "cristal_congelante", nome: "Cristal congelante", descricao: "Causa 5 de dano e paralisa o inimigo por 2 turnos.", cura: 0 },
] as const;

const CHANCE_FUGA_BASE = 90;

const calcDano = (base: number, defesa: number) => Math.max(1, Math.floor(base - defesa * 0.4));

const rolarPorcentagem = () => Math.random() * 100;

const sortearInteiro = (minimo: number, maximo: number) => Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;

function criarFantasma(nivelJogador: number): Inimigo {
  return {
    ...FANTASMA,
    nivel: nivelJogador,
    vidaMaxima: sortearInteiro(40, 54),
    ouroDrop: sortearInteiro(7, 15),
    xpDrop: sortearInteiro(5, 15),
  };
}

function criarEsqueleto(nivelJogador: number): Inimigo {
  return {
    ...ESQUELETO,
    nivel: nivelJogador,
    vidaMaxima: sortearInteiro(55, 75),
    ouroDrop: sortearInteiro(15, 24),
    xpDrop: sortearInteiro(20, 30),
  };
}

function criarGoblin(nivelJogador: number): Inimigo {
  const goblin = GOBLINS[Math.floor(Math.random() * GOBLINS.length)];
  const xpDrop = goblin.id === "goblin_xama" ? sortearInteiro(3, 5) : sortearInteiro(4, 5);
  return { ...goblin, nivel: nivelJogador, xpDrop };
}

function criarEncontroMonstro(nivelJogador: number): Inimigo {
  const chanceFantasma = chanceEncontroFantasma(nivelJogador);
  const chanceEsqueleto = chanceEncontroEsqueleto(nivelJogador);
  const chanceGoblin = chanceEncontroGoblin(nivelJogador);
  const rolagem = rolarPorcentagem();

  if (rolagem < chanceFantasma) return criarFantasma(nivelJogador);
  if (rolagem < chanceFantasma + chanceEsqueleto) return criarEsqueleto(nivelJogador);
  if (rolagem < chanceFantasma + chanceEsqueleto + chanceGoblin) return criarGoblin(nivelJogador);
  return chanceGoblin > 0 ? criarGoblin(nivelJogador) : criarFantasma(nivelJogador);
}

function normalizarProgresso(progresso?: Progresso): Progresso {
  if (!progresso) return { nivel: 1, xp: 0, xpProximo: 20, pontosStatus: 0 };
  const regra = PROGRESSAO_NIVEL.find((item) => item.nivel === progresso.nivel);
  return { ...progresso, xpProximo: regra?.xpProximo ?? progresso.xpProximo };
}

function normalizarPersonagem(p: Personagem): Personagem {
  const classe = CLASSES[p.classe];
  return {
    ...p,
    habilidade: p.habilidade || classe.habilidade,
    magiaNome: p.magiaNome || classe.magiaNome,
    imagem: p.imagem || classe.imagem,
    progresso: normalizarProgresso(p.progresso),
    stats: { ...classe.base, ...p.stats },
    inventario: p.inventario ?? [{ id: "pocao_cura", quantidade: 1 }],
  };
}

function adicionarItemAoInventario(personagem: Personagem, itemId: string, quantidade = 1): Personagem {
  const itemExistente = personagem.inventario.find((item) => item.id === itemId);
  const inventario = itemExistente
    ? personagem.inventario.map((item) => item.id === itemId ? { ...item, quantidade: item.quantidade + quantidade } : item)
    : [...personagem.inventario, { id: itemId, quantidade }];
  return { ...personagem, inventario };
}

function aplicarXp(personagem: Personagem, xpGanho: number): { personagem: Personagem; niveisGanhos: number } {
  let progresso = { ...personagem.progresso, xp: personagem.progresso.xp + xpGanho };
  const stats = { ...personagem.stats };
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
  return { personagem: { ...personagem, stats, progresso }, niveisGanhos };
}

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
            <button className="menu-btn" onClick={() => setTela("slots")}>Novo Jogo</button>
            <button className="menu-btn" disabled={!temSave} onClick={() => setTela("continuar")}>Continuar</button>
          </div>
        </section>
      )}
      {tela === "slots" && <TelaSlots onBack={() => setTela("menu")} onSelect={(slot) => { setSlotSelecionado(slot); setTela("criar"); }} />}
      {tela === "criar" && slotSelecionado !== null && <CriarPersonagem slot={slotSelecionado} voltar={() => setTela("slots")} iniciarHistoria={(personagem) => { setPersonagemAtivo(personagem); setSlotAtivo(slotSelecionado); setTela("historia"); }} />}
      {tela === "continuar" && <TelaContinuar onBack={() => setTela("menu")} onFight={(p, slot) => { setPersonagemAtivo(p); setSlotAtivo(slot); setTela("combate"); }} />}
      {tela === "historia" && personagemAtivo && slotAtivo !== null && <TelaHistoria personagem={personagemAtivo} slot={slotAtivo} onFinish={(personagemAtualizado) => { setPersonagemAtivo(personagemAtualizado); setTela("combate"); }} />}
      {tela === "combate" && personagemAtivo && slotAtivo !== null && <TelaCombate personagem={personagemAtivo} slot={slotAtivo} onBack={() => setTela("continuar")} onDeath={() => { localStorage.removeItem(`save${slotAtivo}`); setPersonagemAtivo(null); setSlotAtivo(null); setTela("menu"); }} />}    </main>);
}

type MomentoHistoria = {
  fundo?: string;
  texto?: string;
  falante?: string;
  duracaoAutomatica?: number;
  limparAntes?: boolean;
  fecharTela?: boolean;
  escolhas?: { texto: string; resposta: string }[];
  tipo?: "mercado" | "portao" | "combateHistoria";
  inimigoHistoria?: "goblin" | "fantasma" | "esqueleto" | "aleatorio";
  recompensa?: { itemId: string; quantidade: number; mensagem: string };
};

const VELOCIDADE_DIGITACAO = 42;

function montarHistoria(nome: string): MomentoHistoria[] {
  return [
    { texto: `Olá aventureiro(a) ${nome}! …\n\nVocê está no continente de Valedorn. Onde diversas criaturas e seres mágicos andam sobre o alvorecer do dia, como os humanos, elfos e anões, além de monstros que estão sempre à espreita nos locais mais diversos desse vasto continente…` },
    { limparAntes: true, texto: "Sua história começa aqui, no centro do reino de Kaestral, cercado por muralhas gigantescas, sua paisagem é repleta de casas simples e modestas com um castelo na parte mais alta do reino, onde vive o rei dos humanos, Rei Emanoel II…\n\nPor muito tempo você foi um andarilho, mas, um fenômeno estranho chamou a atenção de todos os reinos de Valedorn… Vilarejos inteiros começaram a desaparecer, florestas foram queimadas e minas de metais preciosos foram subitamente fechadas." },
    { limparAntes: true, texto: "A guilda de aventureiros então começa a buscar novos candidatos para buscarem pistas do que estava acontecendo a pedido do rei…\n\nVocê então parte para se registrar na guilda de aventureiros." },
    { fundo: guildaImg, duracaoAutomatica: 3000 },
    { texto: "Ao entrar você se depara com um senhor, curando as feridas dos outros aventureiros ali no local." },
    { fundo: melquiorImg, falante: "Melquior", texto: "Finalmente! Estávamos esperando por alguém disposto a aceitar essa missão!" },
    { fundo: melquiorImg, falante: "Melquior", texto: `Pois bem, você deve ser ${nome}. Por quê demorou tanto? O rei estava impaciente de encontrar a pessoa que se candidatou para essa missão…` },
    { fundo: melquiorImg, falante: "Melquior", texto: "Meu nome é Melquior. Sou um dos magos da corte." },
    { fundo: melquiorImg, falante: "Melquior", texto: "Como já deve ter ouvido nos boatos, muitos estão desaparecendo!!", escolhas: [
      { texto: "Devem ser só uns ladrões.", resposta: "Melquior:\nLadrões é… eu não tenho certeza disso, mas sei que logo dará tudo certo." },
      { texto: "Leve-me logo ao Rei, quanto mais cedo resolvemos melhor para todos.", resposta: "Melquior:\nIguais a você já vinheram aos montes aqui, se está nessa missão pelo dinheiro, então boa sorte tentando não se matar. Precisamos muito de novas pessoas para nos ajudar." },
    ] },
    { fecharTela: true, texto: "…\n\nMelquior:\nChegamos!" },
    { fundo: casteloImg, falante: nome, texto: "Saudações meu Rei, vim aqui auxiliar na missão de busca de pistas da guilda." },
    { fundo: casteloImg, falante: "Rei", texto: "Há dois meses, eu perdi soldados…" },
    { fundo: casteloImg, falante: "Rei", texto: "Depois perdi capitães…" },
    { fundo: casteloImg, falante: "Rei", texto: "E agora um vilarejo inteiro desaparece!" },
    { fundo: casteloImg, falante: "Rei", texto: "Eu já venci guerras, derrotei rebeliões, e pela primeira vez, não sei contra quem estou lutando.\n\nO rei olha para Melquior.\n\nMelquior abaixa a cabeça." },
    { fundo: casteloImg, falante: "Rei", texto: "Muito bem! Como já se sabe, não só o reino de Kaestral está sofrendo com fenômenos estranhos, mas também Yingdad o reino dos elfos e Kotof reino escondido dos anões." },
    { fundo: casteloImg, falante: "Rei", texto: "Quero que você se dirija ao vilarejo ao norte da cidade, onde aconteceu o primeiro desaparecimento e verifique se conseguimos achar alguma pista do que pode estar ocorrendo." },
    { fundo: casteloImg, falante: "Rei", texto: "Melquior te ajudará com isso, é meu súdito mais leal." },
    { texto: "Você recebeu 1 poção de cura média de Melquior.", escolhas: [
      { texto: "Ir ao mercado", resposta: "Ir ao mercado" },
      { texto: "Ir para a entrada da cidade", resposta: "Ir para a entrada da cidade" },
    ] },
    { fundo: mercadoImg, tipo: "mercado", texto: "Mercado" },
    { fundo: saidaMuralhaImg, tipo: "portao", texto: "A muralha de Kaestral fica para trás, e a estrada aponta para o campo aberto." },
    { fundo: vilaImg, falante: nome, texto: "Estranho…\nEles não tentaram roubar nada" },
    { fundo: vilaImg, texto: "Três goblins surgem entre as casas destruídas, farejando o ar e cercando você." },
    { fundo: vilaImg, tipo: "combateHistoria", inimigoHistoria: "goblin", texto: "Goblin 1" },
    { fundo: vilaImg, falante: "Goblin", texto: "Krrr… " },
    { fundo: vilaImg, tipo: "combateHistoria", inimigoHistoria: "goblin", texto: "Goblin 2" },
    { fundo: vilaImg, falante: "Goblin", texto: "Cheiro forte… humano perto!" },
    { fundo: vilaImg, tipo: "combateHistoria", inimigoHistoria: "goblin", texto: "Goblin 3" },
    { fundo: vilaImg, falante: "Goblin", texto: "Krss" },
    { fundo: vilaImg, falante: nome, texto: "Parece que estavam seguindo o cheiro de sangue.." },
        { fundo: vilaImg, tipo: "combateHistoria", inimigoHistoria: "goblin", texto: "Mais um goblin aparece atraído pelo combate." },
    { fundo: vilaImg, falante: nome, texto: "Meu Deus! O que houve aqui…" },
    { limparAntes: true, fundo: vilaImg, texto: `As portas estavam abertas.\n\nNinguém andava nas ruas, nem mesmo os animais.\n\nTinham roupas espalhadas no chão, e várias marcas de pegadas fundas na areia fofa.\n\nComo se estivessem correndo de algo.\n\n${nome} sente uma estranha energia vindo da vila.` },
    { fundo: vilaImg, falante: nome, texto: "Não sobrou ninguém, parece até uma cidade fantasma..", escolhas: [
      { texto: "Investigar casas", resposta: "Você se prepara para investigar as casas abandonadas." },
      { texto: "Investigar rastros de sangue", resposta: "Você segue os rastros de sangue com cuidado." },
    ] },
        { fundo: forjaImg, texto: "Você entra na casa que parece estar um pouco menos desgastada do que as demais, a casa também parece maior do que as outras e lá é o que parece ser uma espécie de forja.", escolhas: [
      { texto: "Olhar ao redor", resposta: "Olhar ao redor" },
      { texto: "Adentrar mais fundo na forja", resposta: "Adentrar mais fundo na forja" },
    ] },
    { fundo: forjaImg, falante: nome, texto: "olha ao redor e sente uma energia estranha no local." },
    { limparAntes: true, fundo: forjaImg, texto: "É a mesma sensação que ele sentiu quando chegou na vila.." },
    { limparAntes: true, fundo: forjaImg, falante: nome, texto: "sente um calafrio percorrendo sua espinha." },
    { limparAntes: true, fundo: forjaImg, texto: "Uma névoa começa a se formar dentro da forja.." },
    { fundo: forjaImg, tipo: "combateHistoria", inimigoHistoria: "fantasma", texto: "Um fantasma surge da névoa." },
    { fundo: forjaImg, falante: "fantasma", texto: "Por favor…" },
    { fundo: forjaImg, texto: "A forja volta a ficar silenciosa.", escolhas: [
      { texto: "Adentrar mais fundo na forja", resposta: "Adentrar mais fundo na forja" },
    ] },
    { fundo: forjaImg, texto: "Você se depara com uma porta. Gostaria de abri-la?", escolhas: [
      { texto: "Abrir porta", resposta: "Você segura a maçaneta fria e se prepara para abrir a porta." },
      { texto: "Voltar e investigar os rastros de sangue", resposta: "Você decide voltar para seguir os rastros de sangue." },
    ] },
        { limparAntes: true, fundo: forjaImg, texto: "Você se depara com uma escadaria que leva ao subsolo." },
    { limparAntes: true, fundo: forjaImg, texto: `Enquanto ${nome} desce as escadas, ele ouve uma voz meio ofegante ecoando nas paredes daquela escadaria.` },
    { limparAntes: true, fundo: forjaImg, texto: `Com cautela, porém apreensivo, ${nome} continua a descer as escadas e se depara com um ser meio diferente: era baixo, com um bigode grande, além de algumas poucas mechas brancas na cabeça.`, retrato: taylorMachucadoImg },
    { fundo: forjaImg, falante: "Taylor", texto: "*suspiro…" },
    { fundo: forjaImg, falante: nome, texto: "O que aconteceu aqui ?!?" },
    { fundo: forjaImg, falante: "Taylor", texto: "Por fa..vor, *cof cof*" },
    { limparAntes: true, fundo: forjaImg, falante: "Taylor", texto: "Eles levaram.. todos.. eu não consegui proteger ninguém, eu prometo protegê los" },
    { limparAntes: true, fundo: forjaImg, falante: "Taylor", texto: "Eu sabia… aquele homem não é *cof cof* confiável." },
    { limparAntes: true, fundo: forjaImg, falante: nome, texto: "Que homem?? Me diga por favor!" },
    { fundo: forjaImg, falante: "Taylor", texto: "A floresta *cof cof* levaram todos… depressa", escolhas: [
      { texto: "Entregar uma poção ao anão", resposta: "Entregar poção" },
      { texto: "Voltar e seguir os rastros de sangue para a floresta", resposta: "Voltar e seguir os rastros de sangue" },
    ] },
    { limparAntes: true, fundo: forjaImg, texto: `${nome} ajuda o anão com uma poção.` },
    { limparAntes: true, fundo: forjaImg, falante: "Taylor", texto: "Obrigado aventureiro, mas já não sou o mesmo de antes. Peço que você ajude as pessoas dessa vila.", escolhas: [
      { texto: "Voltar e seguir os rastros de sangue para a floresta", resposta: "Voltar e seguir os rastros de sangue" },
    ] },
    { limparAntes: true, fundo: vilaImg, texto: "Você segue andando pela estrada principal que cruza toda a vila e nota várias marcas de sangue. Por onde passa, vê marcas de sangue e destruição. É quase como se não houvesse um tempo de reação." },
    { limparAntes: true, fundo: florestaSombriaImg, texto: "Os rastros de sangue levam até a orla da floresta sombria, onde sombras se movem entre os troncos." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "Um inimigo surge dos rastros." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "Outro inimigo bloqueia o caminho." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "Mais uma criatura sai das ruínas da estrada." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "Você é cercado novamente." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "A emboscada continua." },
    { fundo: florestaSombriaImg, tipo: "combateHistoria", inimigoHistoria: "aleatorio", texto: "Uma presença extra surge da névoa." },
    { limparAntes: true, fundo: florestaSombriaImg, texto: "Com os inimigos derrotados, o caminho pela floresta fica aberto por enquanto." },
  ];
}

function TextoDigitado({ texto, ativo, onDone }: { texto: string; ativo: boolean; onDone: () => void }) {
  const [visivel, setVisivel] = useState("");

  useEffect(() => {
    if (!ativo || !texto) {
      if (!texto) onDone();
      return;
    }
    let indice = 0;
    const timer = window.setInterval(() => {
      indice += 1;
      setVisivel(texto.slice(0, indice));
      if (indice >= texto.length) {
        window.clearInterval(timer);
        onDone();
      }
    }, VELOCIDADE_DIGITACAO);
    return () => window.clearInterval(timer);
  }, [texto, ativo, onDone]);

  return <p className="typewriter-text">{visivel}<span className="typing-caret" aria-hidden="true" /></p>;
}

const ITENS_MERCADO = [
  { id: "pocao_cura", nome: "Poção pequena", descricao: "Restaura 5 de vida.", custo: 20 },
  { id: "pocao_media", nome: "Poção média", descricao: "Restaura 10 de vida.", custo: 35 },
  { id: "cristal_congelante", nome: "Cristal congelante", descricao: "Causa 5 dano e paralisa seu inimigo por 2 turnos.", custo: 50 },
] as const;

function MercadoHistoria({ personagem, onComprar, onSair }: { personagem: Personagem; onComprar: (itemId: string, custo: number) => void; onSair: () => void }) {
  return (
    <div className="story-market" onClick={(e) => e.stopPropagation()}>
      <p>Ouro: <strong>{personagem.stats.ouro}</strong></p>
      <div className="story-market-items">
        {ITENS_MERCADO.map((item) => (
          <button key={item.id} className="market-item-button" disabled={personagem.stats.ouro < item.custo} onClick={() => onComprar(item.id, item.custo)}>
            <strong>{item.nome}</strong>
            <span>{item.descricao}</span>
            <span>Custo: {item.custo} gold.</span>
          </button>
        ))}
      </div>
      <button className="btn" onClick={onSair}>Ir embora</button>
    </div>
  );
}

function TelaHistoria({ personagem, slot, onFinish }: { personagem: Personagem; slot: number; onFinish: (personagemAtualizado: Personagem) => void }) {
  const [personagemHistoria, setPersonagemHistoria] = useState(() => adicionarItemAoInventario(personagem, "pocao_media"));
  const momentos = useMemo(() => montarHistoria(personagemHistoria.nome), [personagemHistoria.nome]);
  const [indice, setIndice] = useState(0);
  const [digitacaoCompleta, setDigitacaoCompleta] = useState(false);
  const [respostaEscolha, setRespostaEscolha] = useState<string | null>(null);
  const momento = momentos[indice];
    useEffect(() => {
    salvarPersonagemAtualizado(personagemHistoria, slot);
  }, [personagemHistoria, slot]);
  const textoAtual = respostaEscolha ?? momento.texto ?? "";
  const historiaTerminou = indice >= momentos.length - 1 && digitacaoCompleta;
  const concluirDigitacao = useCallback(() => setDigitacaoCompleta(true), []);

  const irParaMomento = useCallback((proximoIndice: number) => {
    setDigitacaoCompleta(false);
    setRespostaEscolha(null);
    setIndice(proximoIndice);
  }, []);

  useEffect(() => {
    if (!momento.duracaoAutomatica) return;
    const timer = window.setTimeout(() => irParaMomento(Math.min(indice + 1, momentos.length - 1)), momento.duracaoAutomatica);
    return () => window.clearTimeout(timer);
  }, [indice, irParaMomento, momento.duracaoAutomatica, momentos.length]);

  const avancar = () => {
    if (!digitacaoCompleta || momento.duracaoAutomatica || momento.tipo || (momento.escolhas && !respostaEscolha)) return;
    if (historiaTerminou) onFinish(personagemHistoria);
    else if (respostaEscolha === "Ir para a entrada da cidade") irParaMomento(Math.min(indice + 2, momentos.length - 1));
    else irParaMomento(Math.min(indice + 1, momentos.length - 1));
  };

    const selecionarEscolha = (resposta: string) => {
    if (resposta === "Investigar casas" || resposta === "Olhar ao redor") {
      irParaMomento(indice + 1);
      return;
    }
    if (resposta === "Adentrar mais fundo na forja") {
        irParaMomento(indice + 1);
      return;
    }
    if (resposta === "Voltar e seguir os rastros de sangue") {
      const indiceRastros = momentos.findIndex((item) => item.texto?.startsWith("Você segue andando pela estrada principal"));
      irParaMomento(indiceRastros >= 0 ? indiceRastros : indice + 1);
      return;
    }
    if (resposta === "Entregar poção") {
      setPersonagemHistoria((atual) => {
        const itemParaEntregar = atual.inventario.find((item) => item.id === "pocao_media" || item.id === "pocao_cura");
        if (!itemParaEntregar) return atual;
        return {
          ...atual,
          inventario: atual.inventario
            .map((item) => item.id === itemParaEntregar.id ? { ...item, quantidade: item.quantidade - 1 } : item)
            .filter((item) => item.quantidade > 0),
        };
      });
      irParaMomento(indice + 1);
      return;
    }
    setDigitacaoCompleta(false);
    setRespostaEscolha(resposta);
  };

  const comprarItem = (itemId: string, custo: number) => {
    setPersonagemHistoria((atual) => {
      if (atual.stats.ouro < custo) return atual;
      return adicionarItemAoInventario({ ...atual, stats: { ...atual.stats, ouro: atual.stats.ouro - custo } }, itemId);
    });
  };
  return (
    <section className={`story-screen ${momento.fecharTela ? "story-blackout" : ""} ${momento.fundo && momento.tipo !== "combateHistoria" ? "story-has-background" : ""} ${momento.tipo === "combateHistoria" ? "story-combat-screen" : ""}`} style={momento.fundo && momento.tipo !== "combateHistoria" ? { backgroundImage: `url(${momento.fundo})` } : undefined}>      <div className="story-vignette" />
      {textoAtual && <div className="story-dialog" onClick={avancar}>
        {momento.retrato && <img src={momento.retrato} alt="Taylor machucado" className="story-portrait" />}
        {momento.falante && !respostaEscolha && <strong className="story-speaker">{momento.falante}:</strong>}
        <TextoDigitado key={`${indice}-${respostaEscolha ?? "base"}`} texto={textoAtual} ativo onDone={concluirDigitacao} />        {digitacaoCompleta && momento.escolhas && !respostaEscolha && <div className="story-choices">{momento.escolhas.map((escolha) => <button key={escolha.texto} className="btn" onClick={(e) => { e.stopPropagation(); selecionarEscolha(escolha.resposta); }}>{escolha.texto}</button>)}</div>}
        {digitacaoCompleta && momento.tipo === "mercado" && <MercadoHistoria personagem={personagemHistoria} onComprar={comprarItem} onSair={() => irParaMomento(indice + 1)} />}
        {digitacaoCompleta && momento.tipo === "portao" && <div className="story-choices"><button className="btn" onClick={(e) => { e.stopPropagation(); irParaMomento(indice + 1); }}>Seguir em frente</button></div>}
        {digitacaoCompleta && momento.tipo === "combateHistoria" && <CombateHistoria personagem={personagemHistoria} inimigoTipo={momento.inimigoHistoria ?? "goblin"} onVencer={(atualizado) => { setPersonagemHistoria(atualizado); irParaMomento(indice + 1); }} onMorrer={() => { localStorage.removeItem(`save${slot}`); window.location.reload(); }} />}        
        {digitacaoCompleta && !momento.tipo && (!momento.escolhas || respostaEscolha) && <span className="story-hint">Clique para continuar</span>}
      </div>}
    </section>
  );
}

function CombateHistoria({ personagem, inimigoTipo, onVencer, onMorrer }: { personagem: Personagem; inimigoTipo: "goblin" | "fantasma" | "aleatorio"; onVencer: (personagemAtualizado: Personagem) => void; onMorrer: () => void }) {
  const inimigo = useMemo(() => {
    if (inimigoTipo === "fantasma") return criarFantasma(personagem.progresso.nivel);
    if (inimigoTipo === "aleatorio") return criarEncontroMonstro(personagem.progresso.nivel);
    return criarGoblin(personagem.progresso.nivel);
  }, [inimigoTipo, personagem.progresso.nivel]);
  const [vidaInimigo, setVidaInimigo] = useState(inimigo.vidaMaxima);
  const [vidaPlayer, setVidaPlayer] = useState(personagem.stats.vida);
  const [log, setLog] = useState<string[]>([`Um ${inimigo.nome} apareceu!`]);
  const [travado, setTravado] = useState(false);

  function atacar(acao: Exclude<AcaoCombate, "item" | "fugir">) {
    if (travado || vidaPlayer <= 0 || vidaInimigo <= 0) return;
    const nomeAcao = acao === "magia" ? personagem.magiaNome : acao === "habilidade" ? personagem.habilidade : "Ataque básico";
    const bruto = acao === "ataque" ? personagem.stats.ataque : acao === "magia" ? personagem.stats.magia + 4 : personagem.stats.ataque + personagem.stats.magia * 0.6;
    const dano = calcDano(bruto, inimigo.defesa);
    const novaVidaInimigo = Math.max(0, vidaInimigo - dano);
    setVidaInimigo(novaVidaInimigo);
    setLog((atual) => [`Você usou ${nomeAcao} e causou ${dano} de dano.`, ...atual]);

    if (novaVidaInimigo <= 0) {
      setTravado(true);
      const resultadoXp = aplicarXp({ ...personagem, stats: { ...personagem.stats, ouro: personagem.stats.ouro + inimigo.ouroDrop } }, inimigo.xpDrop);
      setLog((atual) => [`${inimigo.nome} foi derrotado! +${inimigo.xpDrop} XP, +${inimigo.ouroDrop} ouro.`, ...atual]);
      window.setTimeout(() => onVencer(resultadoXp.personagem), 900);
      return;
    }

    const golpe = inimigo.golpes[log.length % inimigo.golpes.length];
    const danoRecebido = calcDano(golpe.dano + (golpe.tipo === "magia" ? inimigo.magia : inimigo.ataque), personagem.stats.defesa);
    const novaVidaPlayer = Math.max(0, vidaPlayer - danoRecebido);
    setVidaPlayer(novaVidaPlayer);
    setLog((atual) => [`${inimigo.nome} usou ${golpe.nome} e causou ${danoRecebido} de dano.`, ...atual]);
    if (novaVidaPlayer <= 0) {
      setTravado(true);
      window.setTimeout(onMorrer, 900);
    }
  }

  return (
    <div className="story-combat" onClick={(e) => e.stopPropagation()}>
      <div className="story-combatants">
        <div><strong>{personagem.nome}</strong><span>Vida: {vidaPlayer}/{personagem.stats.vida}</span></div>
        <div><img src={inimigo.imagem} alt={inimigo.nome} /><strong>{inimigo.nome}</strong><span>Vida: {vidaInimigo}/{inimigo.vidaMaxima}</span></div>
      </div>
      <div className="story-choices combat-actions">
        <button className="btn" disabled={travado} onClick={() => atacar("ataque")}>Ataque</button>
        <button className="btn" disabled={travado} onClick={() => atacar("magia")}>Magia</button>
        <button className="btn" disabled={travado} onClick={() => atacar("habilidade")}>Habilidade</button>
      </div>
      <div className="story-combat-log">{log.slice(0, 4).map((linha, indiceLog) => <p key={indiceLog}>{linha}</p>)}</div>
    </div>
  );
}

function salvarPersonagemAtualizado(personagem: Personagem, slotPreferido?: number) {
  if (slotPreferido) {
    localStorage.setItem(`save${slotPreferido}`, JSON.stringify(personagem));
    return;
  }
  for (let slot = 1; slot <= 4; slot += 1) {
    const salvo = lerSave(slot);
    if (salvo?.nome === personagem.nome && salvo.classe === personagem.classe) {
      localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
      return;
    }
  }
}

function lerSave(slot: number) {
  const raw = localStorage.getItem(`save${slot}`);
  return raw ? normalizarPersonagem(JSON.parse(raw) as Personagem) : null;
}

function TelaSlots({ onSelect, onBack }: { onSelect: (slot: number) => void; onBack: () => void }) {
  return <section className="panel"><h2>Escolha um Slot</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const p = lerSave(slot); return <button key={slot} className="btn" onClick={() => onSelect(slot)}>{p ? `Slot ${slot}: ${p.nome} | ${CLASSES[p.classe].nome} | Lv.${p.progresso.nivel} | Ouro ${p.stats.ouro}` : `Slot ${slot} (vazio)`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

function TelaContinuar({ onBack, onFight }: { onBack: () => void; onFight: (personagem: Personagem, slot: number) => void }) {
  const [slotExcluir, setSlotExcluir] = useState<number | null>(null);
  const saveExcluir = slotExcluir ? lerSave(slotExcluir) : null;

  function excluirSave() {
    if (!slotExcluir) return;
    localStorage.removeItem(`save${slotExcluir}`);
    setSlotExcluir(null);
  }

  return <section className="panel"><h2>Continuar</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const p = lerSave(slot); return <div key={slot} className="save-row"><button className="btn save-play" disabled={!p} onClick={() => p && onFight(p, slot)}>{p ? `${p.nome} (${CLASSES[p.classe].nome}) - Lv.${p.progresso.nivel} - Lutar` : `Slot ${slot} vazio`}</button><button className="btn danger-btn" disabled={!p} onClick={() => setSlotExcluir(slot)}>Excluir</button></div>; })}</div><button className="btn" onClick={onBack}>Voltar</button>{slotExcluir && saveExcluir && <ModalConfirmacao titulo="Excluir jogo" mensagem={`Tem certeza que deseja excluir ${saveExcluir.nome}? Todo o progresso será perdido.`} confirmar="Excluir" cancelar="Cancelar" perigo onConfirmar={excluirSave} onCancelar={() => setSlotExcluir(null)} />}</section>;}
function barraPct(atual: number, maximo: number) { return Math.max(0, Math.floor((atual / maximo) * 100)); }

type InimigoEmCombate = {
  inimigo: Inimigo;
  vida: number;
};

function criarInimigoEmCombate(inimigo: Inimigo): InimigoEmCombate {
  return { inimigo: { ...inimigo }, vida: inimigo.vidaMaxima };
}

function TelaCombate({ personagem, slot, onBack, onDeath }: { personagem: Personagem; slot: number; onBack: () => void; onDeath: () => void }) {  const inimigoInicial = useMemo(() => criarEncontroMonstro(personagem.progresso.nivel), [personagem.progresso.nivel]);
  const [player, setPlayer] = useState(personagem);
  const [inimigosAtivos, setInimigosAtivos] = useState<InimigoEmCombate[]>([criarInimigoEmCombate(inimigoInicial)]);
  const [alvoSelecionado, setAlvoSelecionado] = useState(0);
  const [vidaPlayer, setVidaPlayer] = useState(personagem.stats.vida);
  const [log, setLog] = useState<string[]>([`${personagem.nome} encontrou ${inimigoInicial.nome} Lv.${inimigoInicial.nivel}.`]);
  const [turnosInvencivelInimigo, setTurnosInvencivelInimigo] = useState(0);
  const [turnosSemAtacar, setTurnosSemAtacar] = useState(0);
  const [penalidadeFuga, setPenalidadeFuga] = useState(0);
  const [mostraItens, setMostraItens] = useState(false);
  const [modalNivel, setModalNivel] = useState(false);
  const [niveisPendentes, setNiveisPendentes] = useState(0);

  const alvoAtual = inimigosAtivos[alvoSelecionado] ?? inimigosAtivos[0];
  const combateEncerrado = inimigosAtivos.length === 0;
  const chanceFugaAtual = Math.max(5, CHANCE_FUGA_BASE - penalidadeFuga);

  useEffect(() => {
    salvarPersonagemAtualizado(player, slot);
    }, [player, slot]);

  function iniciarNovoCombate(personagemAtual: Personagem = player) {
    const proximoInimigo = criarEncontroMonstro(personagemAtual.progresso.nivel);
    setInimigosAtivos([criarInimigoEmCombate(proximoInimigo)]);
    setAlvoSelecionado(0);
    setTurnosInvencivelInimigo(0);
    setTurnosSemAtacar(0);
    setPenalidadeFuga(0);
    setMostraItens(false);
    setLog((l) => [`${personagemAtual.nome} encontrou ${proximoInimigo.nome} Lv.${proximoInimigo.nivel}.`, ...l]);
  }

  function ataqueDosMonstros(vidaAtual: number) {
    let vidaRestante = vidaAtual;
    inimigosAtivos.forEach(({ inimigo }, indice) => {
      if (vidaRestante <= 0) return;

      const golpe = inimigo.golpes[(log.length + indice) % inimigo.golpes.length];
      if (golpe.nome === "Invocar Goblin Guerreiro") {
        setInimigosAtivos((lista) => {
          return [...lista, criarInimigoEmCombate({ ...GOBLIN_GUERREIRO, nivel: player.progresso.nivel, xpDrop: sortearInteiro(4, 5) })];
        });
        setLog((l) => [`${inimigo.nome} invocou um ${GOBLIN_GUERREIRO.nome}!`, ...l]);
        return;
      }

      const dano = calcDano(golpe.dano + (golpe.tipo === "magia" ? inimigo.magia : inimigo.ataque), player.stats.defesa);
      vidaRestante = Math.max(0, vidaRestante - dano);
      setLog((l) => [`${inimigo.nome} usou ${golpe.nome} e causou ${dano} de dano.`, ...l]);
      if (golpe.efeito === "invencivel") {
        setTurnosInvencivelInimigo(1);
        setLog((l) => [`${inimigo.nome} ficou invencível por 1 turno.`, ...l]);
      }
      if (golpe.efeito === "sem_atacar") {
        setTurnosSemAtacar(1);
        setLog((l) => [`${player.nome} ficou 1 turno sem atacar.`, ...l]);
      }
    });

    setVidaPlayer(vidaRestante);
      if (vidaRestante <= 0) {
        setLog((l) => [`${player.nome} foi derrotado. Todo o progresso foi perdido.`, ...l]);
        setTimeout(onDeath, 900);
    }
  }

  function executarAcao(acao: AcaoCombate) {
    if (vidaPlayer <= 0 || combateEncerrado || !alvoAtual) return;
    if (turnosSemAtacar > 0 && acao !== "fugir") {
      setTurnosSemAtacar((turnos) => Math.max(0, turnos - 1));
      setLog((l) => ["Você está assustado e perdeu o turno sem atacar.", ...l]);
      ataqueDosMonstros(vidaPlayer);
      return;
    }
    if (acao === "fugir") {
      if (rolarPorcentagem() < chanceFugaAtual) {
        setLog((l) => ["Você fugiu com sucesso.", ...l]);
        onBack();
        return;
      }
      setLog((l) => ["Falhou ao fugir.", ...l]);
      ataqueDosMonstros(vidaPlayer);
      return;
    }

    if (acao === "item") {
      setMostraItens((valor) => !valor);
      return;
    }
    const inimigoBase = alvoAtual.inimigo;
    const nomeAcao = acao === "magia" ? player.magiaNome : acao === "habilidade" ? player.habilidade : "Ataque básico";
    const bruto = acao === "ataque" ? player.stats.ataque : acao === "magia" ? player.stats.magia + 4 : player.stats.ataque + player.stats.magia * 0.6;
    const danoCalculado = calcDano(bruto, inimigoBase.defesa);
    const acaoFisica = acao === "ataque";
    const danoReduzido = acaoFisica && inimigoBase.reducaoDanoFisico ? Math.max(1, Math.floor(danoCalculado * inimigoBase.reducaoDanoFisico)) : danoCalculado;
    const estaInvencivel = turnosInvencivelInimigo > 0;
    const dano = estaInvencivel ? 0 : danoReduzido;
    if (estaInvencivel) setTurnosInvencivelInimigo((turnos) => Math.max(0, turnos - 1));

    const novaVidaAlvo = Math.max(0, alvoAtual.vida - dano);
    setLog((l) => [`Você usou ${nomeAcao} em ${inimigoBase.nome} e causou ${dano} de dano.`, ...l]);

    if (novaVidaAlvo <= 0) {
      const resultadoXp = aplicarXp({ ...player, stats: { ...player.stats, ouro: player.stats.ouro + inimigoBase.ouroDrop } }, inimigoBase.xpDrop);
      setPlayer(resultadoXp.personagem);
      if (resultadoXp.niveisGanhos > 0) {
        const vidaPerdida = Math.max(0, resultadoXp.personagem.stats.vida - vidaPlayer);
        const vidaRestaurada = Math.ceil(vidaPerdida * 0.5);
        const novaVidaPlayer = Math.min(resultadoXp.personagem.stats.vida, vidaPlayer + vidaRestaurada);
        setVidaPlayer(novaVidaPlayer);
        setLog((l) => [`Subiu de nível! ${resultadoXp.personagem.nome} restaurou ${vidaRestaurada} de vida.`, ...l]);
        setNiveisPendentes((valor) => valor + resultadoXp.niveisGanhos);
        setModalNivel(true);
      }
      const falaMorte = inimigoBase.falas?.aoMorrer ? `${inimigoBase.nome}: ${inimigoBase.falas.aoMorrer}` : `${inimigoBase.nome} foi derrotado!`;
           setLog((l) => [`${falaMorte} +${inimigoBase.xpDrop} XP, +${inimigoBase.ouroDrop} ouro.`, ...l]);
      setInimigosAtivos((lista) => {
        const vivos = lista.filter((_, indice) => indice !== alvoSelecionado);
        setAlvoSelecionado(Math.max(0, Math.min(alvoSelecionado, vivos.length - 1)));
        return vivos;
      });
      return;
    }
    setInimigosAtivos((lista) => lista.map((item, indice) => (indice === alvoSelecionado ? { ...item, vida: novaVidaAlvo } : item)));
    ataqueDosMonstros(vidaPlayer);
    
  }

  return (
    <section className="panel combate-panel">
      <h2>Combate</h2>
      <div className="combatants">
        <div className="fighter-card"><img src={player.imagem} alt={player.nome} className="fighter-img" /><strong>{player.nome}</strong><span>{CLASSES[player.classe].nome} Lv.{player.progresso.nivel}</span></div>
        {inimigosAtivos.map(({ inimigo, vida }, indice) => (
          <button
            key={`${inimigo.id}-${indice}`}
            type="button"
            className={`fighter-card enemy-target ${indice === alvoSelecionado ? "selected" : ""}`}
            onClick={() => setAlvoSelecionado(indice)}
          >
            <img src={inimigo.imagem} alt={inimigo.nome} className="fighter-img" />
            <strong>{inimigo.nome}</strong>
            <span>Lv.{inimigo.nivel}</span>
            <span>Vida: {vida}/{inimigo.vidaMaxima}</span>
          </button>
        ))}
      </div>
      <div className="novo-jogo-info">Ouro: <strong>{player.stats.ouro}</strong> | XP: <strong>{player.progresso.xp}/{player.progresso.xpProximo}</strong> | Pontos: <strong>{player.progresso.pontosStatus}</strong></div>      <div className="hp-wrap"><span>Sua vida: {vidaPlayer}/{player.stats.vida}</span><div className="hp-bar"><div style={{ width: `${barraPct(vidaPlayer, player.stats.vida)}%` }} /></div></div>      {alvoAtual && <div className="hp-wrap"><span>Alvo: {alvoAtual.inimigo.nome} ({alvoAtual.vida}/{alvoAtual.inimigo.vidaMaxima})</span><div className="hp-bar enemy"><div style={{ width: `${barraPct(alvoAtual.vida, alvoAtual.inimigo.vidaMaxima)}%` }} /></div></div>}
      <div className="row">{(["ataque", "magia", "habilidade", "item", "fugir"] as AcaoCombate[]).map((a) => <button key={a} className="btn" disabled={vidaPlayer <= 0 || combateEncerrado || modalNivel} onClick={() => executarAcao(a)}>{a}</button>)}</div>
      {mostraItens && <ListaItens itens={player.inventario} vidaAtual={vidaPlayer} vidaMaxima={player.stats.vida} usarItem={(item) => {
        const itemInventario = player.inventario.find((i) => i.id === item.id);
          if (!itemInventario?.quantidade) return;
        const novaVida = Math.min(player.stats.vida, vidaPlayer + item.cura);
        setPlayer((atual) => ({ ...atual, inventario: atual.inventario.map((i) => i.id === item.id ? { ...i, quantidade: i.quantidade - 1 } : i).filter((i) => i.quantidade > 0) }));
        setVidaPlayer(novaVida);
        setMostraItens(false);
        setLog((l) => [`Você usou ${item.nome} e restaurou ${novaVida - vidaPlayer} de vida.`, ...l]);
        ataqueDosMonstros(novaVida);
      }} />}
      <div className="row"><button className="btn" disabled={vidaPlayer <= 0 || !combateEncerrado || modalNivel} onClick={() => iniciarNovoCombate(player)}>Procurar outro inimigo</button></div>
      {modalNivel && <ModalNivel personagem={player} niveisGanhos={niveisPendentes} distribuir={(atributo) => {
        if (player.progresso.pontosStatus <= 0) return;
        setPlayer((atual) => ({ ...atual, stats: { ...atual.stats, [atributo]: atual.stats[atributo] + 1 }, progresso: { ...atual.progresso, pontosStatus: atual.progresso.pontosStatus - 1 } }));
      }} fechar={() => { if (player.progresso.pontosStatus <= 0) { setModalNivel(false); setNiveisPendentes(0); } }} />}      <div className="log">{log.slice(0, 8).map((l, i) => <p key={i}>{l}</p>)}</div>
      <button className="btn" onClick={onBack}>Voltar</button>
    </section>
  );
}

function ListaItens({ itens, vidaAtual, vidaMaxima, usarItem }: { itens: ItemInventario[]; vidaAtual: number; vidaMaxima: number; usarItem: (item: (typeof ITENS_COMBATE)[number]) => void }) {
  const itensDisponiveis = ITENS_COMBATE.filter((item) => itens.some((i) => i.id === item.id && i.quantidade > 0));  return (
    <div className="items-panel">
      <h3>Itens</h3>
      {itensDisponiveis.length === 0 ? <p>Você não tem itens.</p> : <div className="items-list">
        {itensDisponiveis.map((item) => {
          const quantidade = itens.find((i) => i.id === item.id)?.quantidade ?? 0;
          return (
            <button key={item.id} className="item-button" disabled={vidaAtual >= vidaMaxima} onClick={() => usarItem(item)}>
              <strong>{item.nome} x{quantidade}</strong>
              <span>{item.descricao}</span>
            </button>
          );
        })}
      </div>}
    </div>
  );
}

function ModalNivel({ personagem, niveisGanhos, distribuir, fechar }: { personagem: Personagem; niveisGanhos: number; distribuir: (atributo: AtributoDistribuivel) => void; fechar: () => void }) {
  const classeBase = CLASSES[personagem.classe].base;
  const pontos = personagem.progresso.pontosStatus;

  return (
    <div className="level-overlay" role="dialog" aria-modal="true" aria-labelledby="level-title">
      <div className="level-modal">
        <div>
          <p className="level-kicker">Nível aumentado!</p>
          <h3 id="level-title">{personagem.nome} chegou ao nível {personagem.progresso.nivel}</h3>
          <p>Você ganhou {niveisGanhos} nível(is). Distribua os pontos recebidos nos atributos abaixo.</p>
        </div>
        <div className="attributes-grid">
          {ATRIBUTOS_DISTRIBUIVEIS.map((atributo) => (
            <div key={atributo} className="attribute-row">
              <div>
                <strong>{atributo}</strong>
                <span>Inicial: {classeBase[atributo]} | Atual: {personagem.stats[atributo]}</span>
              </div>
              <button className="plus-btn" disabled={pontos <= 0} onClick={() => distribuir(atributo)} aria-label={`Aumentar ${atributo}`}>+</button>
            </div>
          ))}
        </div>
        <div className="level-footer">
          <span>Pontos disponíveis: <strong>{pontos}</strong></span>
          <button className="btn" disabled={pontos > 0} onClick={fechar}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmacao({ titulo, mensagem, confirmar, cancelar, perigo = false, onConfirmar, onCancelar }: { titulo: string; mensagem: string; confirmar: string; cancelar?: string; perigo?: boolean; onConfirmar: () => void; onCancelar?: () => void }) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-modal">
        <h3 id="confirm-title">{titulo}</h3>
        <p>{mensagem}</p>
        <div className="row">
          {cancelar && <button className="btn" onClick={onCancelar}>{cancelar}</button>}
          <button className={`btn ${perigo ? "danger-btn" : ""}`} onClick={onConfirmar}>{confirmar}</button>
        </div>
      </div>
    </div>
  );
}

function CriarPersonagem({ slot, voltar, iniciarHistoria }: { slot: number; voltar: () => void; iniciarHistoria: (personagem: Personagem) => void }) {  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<ClasseId>("guerreiro");
  const classeAtual = CLASSES[classe];
  const [personagemCriado, setPersonagemCriado] = useState<Personagem | null>(null);
  function salvar() {
    if (!nome.trim()) return alert("Digite um nome.");
    const personagem: Personagem = { nome, classe, stats: { ...classeAtual.base }, habilidade: classeAtual.habilidade, magiaNome: classeAtual.magiaNome, imagem: classeAtual.imagem, progresso: { nivel: 1, xp: 0, xpProximo: 20, pontosStatus: 0 }, inventario: [{ id: "pocao_cura", quantidade: 1 }] };    localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
    setPersonagemCriado(personagem);
  }

  return <section className="panel"><h2>Criar Personagem</h2><input className="field" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)}  />
  <select className="field" value={classe} onChange={(e) => setClasse(e.target.value as ClasseId)}>
  <option value="guerreiro">Guerreiro</option><option value="mago">Mago</option>
    <option value="ladino">Ladino</option></select><div className="class-preview">
      <img src={classeAtual.imagem} alt={classeAtual.nome} className="class-img" />
     <h3>{classeAtual.nome}</h3>
     <p>Vida: {classeAtual.base.vida}</p>
     <p>Defesa: {classeAtual.base.defesa}</p>
     <p>Magia: {classeAtual.base.magia}</p>
     <p>Agilidade: {classeAtual.base.agilidade}</p>
     <p>Ataque: {classeAtual.base.ataque}</p>
     <p>Ouro: {classeAtual.base.ouro}</p>
     <p><strong>Habilidade:</strong> {classeAtual.habilidade}</p>
     <p><strong>Magia:</strong> {classeAtual.magiaNome}</p>
     </div><div className="row">
      <button className="btn" onClick={salvar}>Criar</button>
      <button className="btn" onClick={voltar}>Voltar</button>
    </div>{personagemCriado && <ModalConfirmacao titulo="A jornada começa!" mensagem={`${personagemCriado.nome} foi salvo no slot ${slot}. As brumas de Valedorn se abrem diante de você...`} confirmar="Iniciar história" onConfirmar={() => iniciarHistoria(personagemCriado)} />}</section>;}