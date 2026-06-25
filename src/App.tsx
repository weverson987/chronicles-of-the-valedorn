import { useEffect, useMemo, useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import guerreiroImg from "../entidades/player/guerreiro.png";
import magoImg from "../entidades/player/mago.png";
import ladinaImg from "../entidades/player/ladina.png";
import { GOBLINS, GOBLIN_GUERREIRO } from "../entidades/monstros/goblin";
import { FANTASMA, chanceEncontroFantasma } from "../entidades/monstros/fantasma";
import type { Inimigo } from "../entidades/monstros/tipos";
import "./App.css";


type Tela = "menu" | "slots" | "criar" | "continuar" | "combate";
type ClasseId = "guerreiro" | "mago" | "ladino";
type AcaoCombate = "ataque" | "magia" | "habilidade" | "item" | "fugir";
type AtributoDistribuivel = "vida" | "defesa" | "magia" | "agilidade" | "ataque";

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

const ATRIBUTOS_DISTRIBUIVEIS: AtributoDistribuivel[] = ["vida", "defesa", "magia", "agilidade", "ataque"];

const ITENS_COMBATE = [
  { id: "pocao_cura", nome: "Poção de cura", descricao: "Restaura 5 de vida.", cura: 5 },
  { id: "tonico_menor", nome: "Tônico menor", descricao: "Restaura 3 de vida em emergências.", cura: 3 },
];

const CHANCE_FUGA_BASE = 90;

const calcDano = (base: number, defesa: number) => Math.max(1, Math.floor(base - defesa * 0.4));

const rolarPorcentagem = () => Math.random() * 100;

const sortearInteiro = (minimo: number, maximo: number) => Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;

function criarEncontroMonstro(nivelJogador: number): Inimigo {
  const chanceFantasma = chanceEncontroFantasma(nivelJogador);
  if (rolarPorcentagem() < chanceFantasma) {
    return {
      ...FANTASMA,
      nivel: nivelJogador,
      vidaMaxima: sortearInteiro(40, 54),
      ouroDrop: sortearInteiro(7, 15),
      xpDrop: sortearInteiro(5, 15),
    };
  }

  return GOBLINS[Math.floor(Math.random() * GOBLINS.length)];
}

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

function aplicarXp(personagem: Personagem, xpGanho: number): { personagem: Personagem; niveisGanhos: number } {
  let progresso = { ...personagem.progresso, xp: personagem.progresso.xp + xpGanho };
  const stats = { ...personagem.stats };
  let niveisGanhos = 0;
  while (progresso.xp >= progresso.xpProximo) {
    const proxNivel = progresso.nivel + 1;
    const regra = PROGRESSAO_NIVEL.find((item) => item.nivel === proxNivel);
    progresso = {
      nivel: proxNivel,
      xp: progresso.xp - progresso.xpProximo,
      xpProximo: regra?.xpProximo ?? Math.floor(progresso.xpProximo * 1.45),
      pontosStatus: progresso.pontosStatus + (regra?.pontosStatus ?? 3),
    };
    niveisGanhos += 1;
  }
  return { personagem: { ...personagem, stats, progresso }, niveisGanhos };
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
      {tela === "combate" && personagemAtivo && <TelaCombate personagem={personagemAtivo} onBack={() => setTela("continuar")} />}
    </main>);
}

function salvarPersonagemAtualizado(personagem: Personagem) {
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

function TelaContinuar({ onBack, onFight }: { onBack: () => void; onFight: (personagem: Personagem) => void }) {
  return <section className="panel"><h2>Continuar</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const p = lerSave(slot); return <button key={slot} className="btn" disabled={!p} onClick={() => p && onFight(p)}>{p ? `${p.nome} (${CLASSES[p.classe].nome}) - Lv.${p.progresso.nivel} - Lutar` : `Slot ${slot} vazio`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;}

function barraPct(atual: number, maximo: number) { return Math.max(0, Math.floor((atual / maximo) * 100)); }

type InimigoEmCombate = {
  inimigo: Inimigo;
  vida: number;
};

function criarInimigoEmCombate(inimigo: Inimigo): InimigoEmCombate {
  return { inimigo: { ...inimigo }, vida: inimigo.vidaMaxima };
}

function TelaCombate({ personagem, onBack }: { personagem: Personagem; onBack: () => void }) {
  const inimigoInicial = useMemo(() => criarEncontroMonstro(personagem.progresso.nivel), [personagem.progresso.nivel]);
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
    salvarPersonagemAtualizado(player);
  }, [player]);
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
          const guerreiroJaInvocado = lista.some((item) => item.inimigo.id === GOBLIN_GUERREIRO.id);
          if (guerreiroJaInvocado) return lista;
          return [...lista, criarInimigoEmCombate(GOBLIN_GUERREIRO)];
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
    if (vidaRestante <= 0) setLog((l) => [`${player.nome} foi derrotado.`, ...l]);
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
        setLog((l) => [`Você fugiu com sucesso (${chanceFugaAtual}% de chance).`, ...l]);
        onBack();
        return;
      }
      setLog((l) => [`Falhou ao fugir (${chanceFugaAtual}% de chance).`, ...l]);
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
      <div className="novo-jogo-info">Ouro: <strong>{player.stats.ouro}</strong> | XP: <strong>{player.progresso.xp}/{player.progresso.xpProximo}</strong> | Pontos: <strong>{player.progresso.pontosStatus}</strong> | Fuga: <strong>{chanceFugaAtual}%</strong></div>      <div className="hp-wrap"><span>Sua vida: {vidaPlayer}/{player.stats.vida}</span><div className="hp-bar"><div style={{ width: `${barraPct(vidaPlayer, player.stats.vida)}%` }} /></div></div>
      {alvoAtual && <div className="hp-wrap"><span>Alvo: {alvoAtual.inimigo.nome} ({alvoAtual.vida}/{alvoAtual.inimigo.vidaMaxima})</span><div className="hp-bar enemy"><div style={{ width: `${barraPct(alvoAtual.vida, alvoAtual.inimigo.vidaMaxima)}%` }} /></div></div>}
      <div className="row">{(["ataque", "magia", "habilidade", "item", "fugir"] as AcaoCombate[]).map((a) => <button key={a} className="btn" disabled={vidaPlayer <= 0 || combateEncerrado || modalNivel} onClick={() => executarAcao(a)}>{a}</button>)}</div>
      {mostraItens && <ListaItens vidaAtual={vidaPlayer} vidaMaxima={player.stats.vida} usarItem={(item) => {
        const novaVida = Math.min(player.stats.vida, vidaPlayer + item.cura);
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

function ListaItens({ vidaAtual, vidaMaxima, usarItem }: { vidaAtual: number; vidaMaxima: number; usarItem: (item: (typeof ITENS_COMBATE)[number]) => void }) {
  return (
    <div className="items-panel">
      <h3>Itens</h3>
      <p>Escolha um item para usar neste turno.</p>
      <div className="stack">
        {ITENS_COMBATE.map((item) => (
          <button key={item.id} className="item-button" disabled={vidaAtual >= vidaMaxima} onClick={() => usarItem(item)}>
            <strong>{item.nome}</strong>
            <span>{item.descricao}</span>
          </button>
        ))}
      </div>
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

function CriarPersonagem({ slot, voltar, voltarMenu }: { slot: number; voltar: () => void; voltarMenu: () => void }) {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<ClasseId>("guerreiro");
  const classeAtual = CLASSES[classe];

  function salvar() {
    if (!nome.trim()) return alert("Digite um nome.");
    const personagem: Personagem = { nome, classe, stats: { ...classeAtual.base }, habilidade: classeAtual.habilidade, magiaNome: classeAtual.magiaNome, imagem: classeAtual.imagem, progresso: { nivel: 1, xp: 0, xpProximo: 100, pontosStatus: 0 } };
      localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
    alert("Personagem criado!");

    voltarMenu();
  }

  return <section className="panel"><h2>Criar Personagem</h2><input className="field" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)}  />
  <select className="field" value={classe} onChange={(e) => setClasse(e.target.value as ClasseId)}>
  <option value="guerreiro">Guerreiro</option><option value="mago">Mago</option>
    <option value="ladino">Ladino</option></select><div className="class-preview">
      <img src={classeAtual.imagem} alt={classeAtual.nome} className="class-img" />
      <h3>{classeAtual.nome}</h3><p>Vida: {classeAtual.base.vida}</p><p>Defesa: {classeAtual.base.defesa}</p><p>Magia: {classeAtual.base.magia}</p><p>Agilidade: {classeAtual.base.agilidade}</p><p>Ataque: {classeAtual.base.ataque}</p><p>Ouro: {classeAtual.base.ouro}</p><p><strong>Habilidade:</strong> {classeAtual.habilidade}</p><p><strong>Magia:</strong> {classeAtual.magiaNome}</p></div><div className="row"><button className="btn" onClick={salvar}>Criar</button><button className="btn" onClick={voltar}>Voltar</button></div></section>;}
