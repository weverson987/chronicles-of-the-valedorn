import { useMemo, useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import { GOBLIN_NOVATO, type Inimigo } from "../entidades/monstros/goblin";
import "./App.css";

type Tela = "menu" | "slots" | "criar" | "continuar" | "combate";
type ClasseId = "guerreiro" | "mago" | "ladino";
type AcaoCombate = "ataque" | "magia" | "habilidade" | "item" | "fugir";

type Stats = { vida: number; defesa: number; magia: number; agilidade: number; ataque: number; ouro: number };
type ClasseConfig = { nome: string; base: Stats; habilidade: string };
type Personagem = { nome: string; classe: ClasseId; stats: Stats; habilidade: string };

const CLASSES: Record<ClasseId, ClasseConfig> = {
  guerreiro: { nome: "Guerreiro", base: { vida: 15, defesa: 5, magia: 0, agilidade: 5, ataque: 15, ouro: 30 }, habilidade: "Incansável" },
  mago: { nome: "Mago", base: { vida: 11, defesa: 3, magia: 15, agilidade: 5, ataque: 5, ouro: 30 }, habilidade: "Fireball" },
  ladino: { nome: "Ladino", base: { vida: 10, defesa: 3, magia: 5, agilidade: 10, ataque: 8, ouro: 30 }, habilidade: "Dark Poison" },
};
const calcDano = (base: number, defesa: number) => Math.max(1, Math.floor(base - defesa * 0.4));

export default function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [personagemAtivo, setPersonagemAtivo] = useState<Personagem | null>(null);

  const temSave = useMemo(() => [1, 2, 3, 4].some((i) => !!localStorage.getItem(`save${i}`)), [tela]);

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
      {tela === "combate" && personagemAtivo && <TelaCombate personagem={personagemAtivo} inimigoBase={GOBLIN_NOVATO} onBack={() => setTela("continuar")} />}
    </main>
  );
}

function TelaSlots({ onSelect, onBack }: { onSelect: (slot: number) => void; onBack: () => void }) {
 return <section className="panel"><h2>Escolha um Slot</h2><div className="stack">{[1,2,3,4].map((slot)=>{const raw=localStorage.getItem(`save${slot}`);const p=raw?(JSON.parse(raw) as Personagem):null;return <button key={slot} className="btn" onClick={()=>onSelect(slot)}>{p?`Slot ${slot}: ${p.nome} | ${CLASSES[p.classe].nome} | Ouro ${p.stats.ouro}`:`Slot ${slot} (vazio)`}</button>;})}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

function TelaContinuar({ onBack, onFight }: { onBack: () => void; onFight: (personagem: Personagem) => void }) {
  return <section className="panel"><h2>Continuar</h2><div className="stack">{[1,2,3,4].map((slot)=>{const raw=localStorage.getItem(`save${slot}`);const p=raw?(JSON.parse(raw) as Personagem):null;return <button key={slot} className="btn" disabled={!p} onClick={()=>p&&onFight(p)}>{p?`${p.nome} (${CLASSES[p.classe].nome}) - Lutar`:`Slot ${slot} vazio`}</button>;})}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

  function barraPct(atual: number, maximo: number) { return Math.max(0, Math.floor((atual / maximo) * 100)); }
  function TelaCombate({ personagem, inimigoBase, onBack }: { personagem: Personagem; inimigoBase: Inimigo; onBack: () => void }) {
  const [vidaPlayer, setVidaPlayer] = useState(personagem.stats.vida);
  const [vidaInimigo, setVidaInimigo] = useState(inimigoBase.vidaMaxima);
  const [log, setLog] = useState<string[]>([`${personagem.nome} encontrou ${inimigoBase.nome} Lv.${inimigoBase.nivel}.`]);
  function executarAcao(acao: AcaoCombate) {
    if (vidaPlayer <= 0 || vidaInimigo <= 0) return;
    if (acao === "fugir") {
      if (Math.random() <= 0.89) { setLog((l) => ["Você fugiu com sucesso (89%).", ...l]); onBack(); return; }
      setLog((l) => ["Falhou ao fugir!", ...l]);
    } else {
      const bruto = acao === "ataque" ? personagem.stats.ataque : acao === "magia" ? personagem.stats.magia + 4 : acao === "habilidade" ? personagem.stats.ataque + personagem.stats.magia * 0.6 : personagem.stats.ataque * 0.7;
      const dano = calcDano(bruto, inimigoBase.defesa);
      const novaVida = Math.max(0, vidaInimigo - dano);
      setVidaInimigo(novaVida);
      setLog((l) => [`Você usou ${acao} e causou ${dano}.`, ...l]);
      if (novaVida <= 0) { setLog((l) => [`${inimigoBase.nome} foi derrotado!`, ...l]); return; }
    }

      const novaVida = Math.max(0, vidaInimigo - dano);
      setVidaInimigo(novaVida);
      setLog((l) => [`Você usou ${acao} e causou ${dano}.`, ...l]);
      if (novaVida <= 0) { setLog((l) => [`${inimigoBase.nome} foi derrotado!`, ...l]); return; }
    }


  return (
    <section className="panel combate-panel">
      <h2>Combate</h2>
      <div className="novo-jogo-info">Nome: <strong>{personagem.nome}</strong> | Classe: <strong>{CLASSES[personagem.classe].nome}</strong> | Ouro: <strong>{personagem.stats.ouro}</strong></div>
      <div className="hp-wrap"><span>Sua vida: {vidaPlayer}/{personagem.stats.vida}</span><div className="hp-bar"><div style={{ width: `${barraPct(vidaPlayer, personagem.stats.vida)}%` }} /></div></div>
      <div className="enemy-card"><img src={inimigoBase.imagem} alt={inimigoBase.nome} className="enemy-img" /><div><strong>{inimigoBase.nome}</strong> (Lv.{inimigoBase.nivel})<div className="hp-wrap"><span>Vida inimigo: {vidaInimigo}/{inimigoBase.vidaMaxima}</span><div className="hp-bar enemy"><div style={{ width: `${barraPct(vidaInimigo, inimigoBase.vidaMaxima)}%` }} /></div></div></div></div>
      <div className="row">{(["ataque","magia","habilidade","item","fugir"] as AcaoCombate[]).map((a)=><button key={a} className="btn" onClick={()=>executarAcao(a)}>{a}</button>)}</div>
      <div className="log">{log.slice(0,6).map((l,i)=><p key={i}>{l}</p>)}</div>
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
    const personagem: Personagem = { nome, classe, stats: { ...classeAtual.base }, habilidade: classeAtual.habilidade };
    localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
    alert("Personagem criado!");

    voltarMenu();
  }

  return <section className="panel"><h2>Criar Personagem</h2><input className="field" placeholder="Nome" value={nome} onChange={(e)=>setNome(e.target.value)} /><select className="field" value={classe} onChange={(e)=>setClasse(e.target.value as ClasseId)}><option value="guerreiro">Guerreiro</option><option value="mago">Mago</option><option value="ladino">Ladino</option></select><div className="class-preview"><h3>{classeAtual.nome}</h3><p>Vida: {classeAtual.base.vida}</p><p>Defesa: {classeAtual.base.defesa}</p><p>Magia: {classeAtual.base.magia}</p><p>Agilidade: {classeAtual.base.agilidade}</p><p>Ataque: {classeAtual.base.ataque}</p><p>Ouro: {classeAtual.base.ouro}</p><p><strong>Habilidade:</strong> {classeAtual.habilidade}</p></div><div className="row"><button className="btn" onClick={salvar}>Criar</button><button className="btn" onClick={voltar}>Voltar</button></div></section>;
}
