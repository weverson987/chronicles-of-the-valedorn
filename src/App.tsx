import { useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import guerreiroImg from "../entidades/player/guerreiro.png";
import magoImg from "../entidades/player/mago.png";
import ladinaImg from "../entidades/player/ladina.png";
import { GOBLINS } from "../entidades/monstros/goblin";
import "./App.css";

type Inimigo = (typeof GOBLINS)[number];

type Tela = "menu" | "slots" | "criar" | "continuar" | "combate";
type ClasseId = "guerreiro" | "mago" | "ladino";
type AcaoCombate = "ataque" | "magia" | "habilidade" | "item" | "fugir";

type Stats = { vida: number; defesa: number; magia: number; agilidade: number; ataque: number; ouro: number };
type ClasseConfig = { nome: string; base: Stats; habilidade: string; magiaNome: string; imagem: string };
type Progresso = { nivel: number; xp: number; xpProximo: number; pontosStatus: number };
type Personagem = { nome: string; classe: ClasseId; stats: Stats; habilidade: string; magiaNome: string; imagem: string; progresso: Progresso };

const CLASSES: Record<ClasseId, ClasseConfig> = {
  guerreiro: { nome: "Guerreiro", base: { vida: 15, defesa: 5, magia: 0, agilidade: 5, ataque: 15, ouro: 30 }, habilidade: "Incansável", magiaNome: "Golpe Arcano", imagem: guerreiroImg },
  mago: { nome: "Mago", base: { vida: 11, defesa: 3, magia: 15, agilidade: 5, ataque: 5, ouro: 30 }, habilidade: "Fireball", magiaNome: "Fireball", imagem: magoImg },
  ladino: { nome: "Ladino", base: { vida: 10, defesa: 3, magia: 5, agilidade: 10, ataque: 8, ouro: 30 }, habilidade: "Dark Poison", magiaNome: "Dark Poison", imagem: ladinaImg },
};

const PROGRESSAO_NIVEL = [
  { nivel: 1, xpProximo: 100, pontosStatus: 0 },
  { nivel: 2, xpProximo: 320, pontosStatus: 2 },
  { nivel: 3, xpProximo: 700, pontosStatus: 2 },
  { nivel: 4, xpProximo: 1250, pontosStatus: 3 },
  { nivel: 5, xpProximo: 2000, pontosStatus: 3 },
];

const calcDano = (base: number, defesa: number) => Math.max(1, Math.floor(base - defesa * 0.4));

function normalizarPersonagem(p: Personagem): Personagem {
  const classe = CLASSES[p.classe];
  return {
    ...p,
    habilidade: p.habilidade || classe.habilidade,
    magiaNome: p.magiaNome || classe.magiaNome,
    imagem: p.imagem || classe.imagem,
    progresso: p.progresso || { nivel: 1, xp: 0, xpProximo: 100, pontosStatus: 0 },
  };
}

function aplicarXp(personagem: Personagem, xpGanho: number): Personagem {
  let progresso = { ...personagem.progresso, xp: personagem.progresso.xp + xpGanho };
  let stats = { ...personagem.stats };
  while (progresso.xp >= progresso.xpProximo) {
    const proxNivel = progresso.nivel + 1;
    const regra = PROGRESSAO_NIVEL.find((item) => item.nivel === proxNivel);
    progresso = {
      nivel: proxNivel,
      xp: progresso.xp - progresso.xpProximo,
      xpProximo: regra?.xpProximo ?? Math.floor(progresso.xpProximo * 1.45),
      pontosStatus: progresso.pontosStatus + (regra?.pontosStatus ?? 3),
    };
    stats = { ...stats, vida: stats.vida + 2, ataque: stats.ataque + 1, defesa: stats.defesa + 1 };
  }
  return { ...personagem, stats, progresso };
}

export default function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [personagemAtivo, setPersonagemAtivo] = useState<Personagem | null>(null);

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
      {tela === "criar" && slotSelecionado !== null && <CriarPersonagem slot={slotSelecionado} voltar={() => setTela("slots")} voltarMenu={() => setTela("menu")} />}
      {tela === "continuar" && <TelaContinuar onBack={() => setTela("menu")} onFight={(p) => { setPersonagemAtivo(p); setTela("combate"); }} />}
      {tela === "combate" && personagemAtivo && <TelaCombate personagem={personagemAtivo} inimigoBase={GOBLINS[0]} onBack={() => setTela("continuar")} />}
    </main>
  );
}

function lerSave(slot: number) {
  const raw = localStorage.getItem(`save${slot}`);
  return raw ? normalizarPersonagem(JSON.parse(raw) as Personagem) : null;
}

function TelaSlots({ onSelect, onBack }: { onSelect: (slot: number) => void; onBack: () => void }) {
  return <section className="panel"><h2>Escolha um Slot</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const p = lerSave(slot); return <button key={slot} className="btn" onClick={() => onSelect(slot)}>{p ? `Slot ${slot}: ${p.nome} | ${CLASSES[p.classe].nome} | Lv.${p.progresso.nivel} | Ouro ${p.stats.ouro}` : `Slot ${slot} (vazio)`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

function TelaContinuar({ onBack, onFight }: { onBack: () => void; onFight: (personagem: Personagem) => void }) {
  return <section className="panel"><h2>Continuar</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const p = lerSave(slot); return <button key={slot} className="btn" disabled={!p} onClick={() => p && onFight(p)}>{p ? `${p.nome} (${CLASSES[p.classe].nome}) - Lv.${p.progresso.nivel} - Lutar` : `Slot ${slot} vazio`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;}

function barraPct(atual: number, maximo: number) { return Math.max(0, Math.floor((atual / maximo) * 100)); }

function TelaCombate({ personagem, inimigoBase, onBack }: { personagem: Personagem; inimigoBase: Inimigo; onBack: () => void }) {
  const [player, setPlayer] = useState(personagem);
  const [vidaPlayer, setVidaPlayer] = useState(personagem.stats.vida);
  const [vidaInimigo, setVidaInimigo] = useState(inimigoBase.vidaMaxima);
  const [log, setLog] = useState<string[]>([`${personagem.nome} encontrou ${inimigoBase.nome} Lv.${inimigoBase.nivel}.`]);
    function ataqueDoMonstro(vidaAtual: number) {
    const golpe = inimigoBase.golpes[log.length % inimigoBase.golpes.length];
    const dano = calcDano(golpe.dano + (golpe.tipo === "magia" ? inimigoBase.magia : inimigoBase.ataque), player.stats.defesa);
    const novaVida = Math.max(0, vidaAtual - dano);
    setVidaPlayer(novaVida);
    setLog((l) => [`${inimigoBase.nome} usou ${golpe.nome} e causou ${dano} de dano.`, ...l]);
    if (novaVida <= 0) setLog((l) => [`${player.nome} foi derrotado.`, ...l]);
  }
  function executarAcao(acao: AcaoCombate) {
    if (vidaPlayer <= 0 || vidaInimigo <= 0) return;
    if (acao === "fugir") {
      const chanceFuga = player.stats.agilidade + player.progresso.nivel * 2;
      if (chanceFuga >= inimigoBase.agilidade + 4) { setLog((l) => ["Você fugiu com sucesso.", ...l]); onBack();
         return;
     }
      setLog((l) => ["Falhou ao fugir!", ...l]);
      ataqueDoMonstro(vidaPlayer);
      return;
    }
    const nomeAcao = acao === "magia" ? player.magiaNome : acao === "habilidade" ? player.habilidade : acao === "item" ? "Item improvisado" : "Ataque básico";
    const bruto = acao === "ataque" ? player.stats.ataque : acao === "magia" ? player.stats.magia + 4 : acao === "habilidade" ? player.stats.ataque + player.stats.magia * 0.6 : player.stats.ataque * 0.7;
    const dano = calcDano(bruto, inimigoBase.defesa);
    const novaVidaInimigo = Math.max(0, vidaInimigo - dano);
    setVidaInimigo(novaVidaInimigo);
    setLog((l) => [`Você usou ${nomeAcao} e causou ${dano} de dano.`, ...l]);
    if (novaVidaInimigo <= 0) {
      const atualizado = aplicarXp({ ...player, stats: { ...player.stats, ouro: player.stats.ouro + inimigoBase.ouroDrop } }, inimigoBase.xpDrop);
      setPlayer(atualizado);
      setLog((l) => [`${inimigoBase.nome} foi derrotado! +${inimigoBase.xpDrop} XP, +${inimigoBase.ouroDrop} ouro.`, ...l]);
      return;
    }
    ataqueDoMonstro(vidaPlayer);
    
  }

  return (
    <section className="panel combate-panel">
      <h2>Combate</h2>
      <div className="combatants">
        <div className="fighter-card"><img src={player.imagem} alt={player.nome} className="fighter-img" /><strong>{player.nome}</strong><span>{CLASSES[player.classe].nome} Lv.{player.progresso.nivel}</span></div>
        <div className="fighter-card"><img src={inimigoBase.imagem} alt={inimigoBase.nome} className="fighter-img" /><strong>{inimigoBase.nome}</strong><span>Lv.{inimigoBase.nivel}</span></div>
      </div>
      <div className="novo-jogo-info">Ouro: <strong>{player.stats.ouro}</strong> | XP: <strong>{player.progresso.xp}/{player.progresso.xpProximo}</strong> | Pontos: <strong>{player.progresso.pontosStatus}</strong></div>
      <div className="hp-wrap"><span>Sua vida: {vidaPlayer}/{player.stats.vida}</span><div className="hp-bar"><div style={{ width: `${barraPct(vidaPlayer, player.stats.vida)}%` }} /></div></div>
      <div className="hp-wrap"><span>Vida inimigo: {vidaInimigo}/{inimigoBase.vidaMaxima}</span><div className="hp-bar enemy"><div style={{ width: `${barraPct(vidaInimigo, inimigoBase.vidaMaxima)}%` }} /></div></div>
      <div className="row">{(["ataque", "magia", "habilidade", "item", "fugir"] as AcaoCombate[]).map((a) => <button key={a} className="btn" onClick={() => executarAcao(a)}>{a}</button>)}</div>
      <div className="log">{log.slice(0, 8).map((l, i) => <p key={i}>{l}</p>)}</div>  
      <button className="btn" onClick={onBack}>Voltar</button>
    </section>
  );
}

function CriarPersonagem({ slot, voltar, voltarMenu }: { slot: number; voltar: () => void; voltarMenu: () => void }) {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<ClasseId>("guerreiro");
  const classeAtual = CLASSES[classe];

  function salvar() {
    if (!nome.trim()) return alert("Digite um nome.");
    const personagem: Personagem = { nome, classe, stats: { ...classeAtual.base }, habilidade: classeAtual.habilidade, magiaNome: classeAtual.magiaNome, imagem: classeAtual.imagem, progresso: { nivel: 1, xp: 0, xpProximo: 100, pontosStatus: 0 } };    localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
    alert("Personagem criado!");

    voltarMenu();
  }

  return <section className="panel"><h2>Criar Personagem</h2><input className="field" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} /><select className="field" value={classe} onChange={(e) => setClasse(e.target.value as ClasseId)}><option value="guerreiro">Guerreiro</option><option value="mago">Mago</option><option value="ladino">Ladino</option></select><div className="class-preview"><img src={classeAtual.imagem} alt={classeAtual.nome} className="class-img" /><h3>{classeAtual.nome}</h3><p>Vida: {classeAtual.base.vida}</p><p>Defesa: {classeAtual.base.defesa}</p><p>Magia: {classeAtual.base.magia}</p><p>Agilidade: {classeAtual.base.agilidade}</p><p>Ataque: {classeAtual.base.ataque}</p><p>Ouro: {classeAtual.base.ouro}</p><p><strong>Habilidade:</strong> {classeAtual.habilidade}</p><p><strong>Magia:</strong> {classeAtual.magiaNome}</p></div><div className="row"><button className="btn" onClick={salvar}>Criar</button><button className="btn" onClick={voltar}>Voltar</button></div></section>;}
