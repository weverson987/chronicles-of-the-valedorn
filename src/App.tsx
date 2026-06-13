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

const ESCALONAMENTO_GLOBAL: EscalonamentoCombate = { manaInicial: 7, bonusManaPorMagia: "+2 pontos de mana a cada 5 pontos de magia", bonusDanoFisicoPorAtaque: "+3 de dano físico na arma a cada 5 pontos de ataque", bonusAgilidade: "+7% de esquiva e +3% velocidade de ataque a cada 5 pontos de agilidade" };
const CLASSES: Record<ClasseId, ClasseConfig> = { guerreiro: { nome: "Guerreiro", base: { vida: 15, defesa: 5, magia: 0, agilidade: 5, ataque: 15, ouro: 30 }, buff: ["+5 vida", "+3 ataque", "+2 defesa"], habilidade: "Incansável: -15% dano físico recebido e +10% ataque por 5 turnos", custo: "2 mana", cooldown: "3 usos por combate", efeitoColateral: "Não pode esquivar durante o efeito", itens: [{ nome: "Peitoral de bronze", bonus: "+5 defesa" }, { nome: "Lâmina carmesim", bonus: "11 dano físico + sangramento" }, { nome: "Botas de couro", bonus: "+2 agilidade e +1% esquiva" }] }, mago: { nome: "Mago", base: { vida: 11, defesa: 3, magia: 15, agilidade: 5, ataque: 5, ouro: 30 }, buff: ["+7 magia", "+2 vida"], habilidade: "Fireball: +13 dano mágico", custo: "5 mana", itens: [{ nome: "Robe sombrio", bonus: "+2 defesa e +3 vida" }, { nome: "Cajado de bronze", bonus: "+5 dano mágico" }, { nome: "Poção de mana", bonus: "+10 mana" }] }, ladino: { nome: "Ladino", base: { vida: 10, defesa: 3, magia: 5, agilidade: 10, ataque: 8, ouro: 30 }, buff: ["+4 agilidade", "+3 ataque"], habilidade: "Dark Poison: veneno por 5 turnos", custo: "3 mana", itens: [{ nome: "Adagas gêmeas", bonus: "+7 dano físico" }, { nome: "Capuz dos lobos", bonus: "+3% esquiva" }, { nome: "Poção de cura", bonus: "+10 vida" }] } };

const calcDano = (base: number, defesa: number) => Math.max(1, Math.floor(base - defesa * 0.45));

export default function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [temSave, setTemSave] = useState(false);
  const [musicaLigada, setMusicaLigada] = useState(true);
  const [volume, setVolume] = useState(70);
  const [personagemAtivo, setPersonagemAtivo] = useState<Personagem | null>(null);

  useEffect(() => { verificarSaves(); const musicaSalva = localStorage.getItem("opcoes_musica"); const volumeSalvo = localStorage.getItem("opcoes_volume"); if (musicaSalva) setMusicaLigada(musicaSalva === "ligada"); if (volumeSalvo) setVolume(Number(volumeSalvo)); }, []);
  function verificarSaves() { setTemSave([1, 2, 3, 4].some((i) => localStorage.getItem(`save${i}`))); }};

  const botoesMenu: MenuButton[] = useMemo(() => [{ id: "novo", texto: "Novo Jogo", classe: "menu-btn menu-btn-novo", onClick: () => setTela("slots") }, { id: "continuar", texto: "Continuar", classe: "menu-btn menu-btn-continuar", disabled: !temSave, onClick: () => { if (!temSave) return alert("Nenhum save encontrado."); setTela("continuar"); } }, { id: "opcoes", texto: "Opções", classe: "menu-btn menu-btn-opcoes", onClick: () => setTela("opcoes") }, { id: "sair", texto: "Sair", classe: "menu-btn menu-btn-sair", onClick: () => window.confirm("Deseja sair?") && (window.location.href = "about:blank") }], [temSave]);
 return <main className="app-shell">{tela === "menu" && <MenuInicial botoes={botoesMenu} />}{tela === "slots" && <TelaSlots onBack={() => setTela("menu")} onSelect={(slot) => { setSlotSelecionado(slot); setTela("criar"); }} />}{tela === "continuar" && <TelaContinuar onBack={() => setTela("menu")} onFight={(personagem) => { setPersonagemAtivo(personagem); setTela("combate"); }} />}{tela === "combate" && personagemAtivo && <TelaCombate personagem={personagemAtivo} inimigoBase={GOBLIN_NOVATO} onBack={() => setTela("continuar")} />}{tela === "opcoes" && <TelaOpcoes musicaLigada={musicaLigada} volume={volume} onBack={() => setTela("menu")} onMusica={(valor) => { setMusicaLigada(valor); localStorage.setItem("opcoes_musica", valor ? "ligada" : "desligada"); }} onVolume={(valor) => { setVolume(valor); localStorage.setItem("opcoes_volume", String(valor)); }} />}{tela === "criar" && slotSelecionado !== null && <CriarPersonagem slot={slotSelecionado} voltar={() => setTela("slots")} voltarMenu={() => { verificarSaves(); setTela("menu"); }} />}</main>;
}

const MenuInicial = ({ botoes }: { botoes: MenuButton[] }) => <section className="menu-screen"><img src={telaInicial} alt="Tela inicial" className="menu-image" /><div className="menu-buttons">{botoes.map((botao) => <button key={botao.id} className={botao.classe} onClick={botao.onClick} disabled={botao.disabled}>{botao.texto}</button>)}</div></section>;

function TelaSlots({ onSelect, onBack }: { onSelect: (slot: number) => void; onBack: () => void }) {
  return <section className="panel"><h2>Escolha um Slot</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const raw = localStorage.getItem(`save${slot}`); const personagem = raw ? (JSON.parse(raw) as Personagem) : null; return <button key={slot} className="btn" onClick={() => onSelect(slot)}>{personagem ? `Slot ${slot}: ${personagem.nome} | ${CLASSES[personagem.classe].nome} | Ouro ${personagem.stats.ouro}` : `Slot ${slot} (vazio)`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

function TelaContinuar({ onBack, onFight }: { onBack: () => void; onFight: (personagem: Personagem) => void }) {
  return <section className="panel"><h2>Continuar</h2><div className="stack">{[1, 2, 3, 4].map((slot) => { const raw = localStorage.getItem(`save${slot}`); const personagem = raw ? (JSON.parse(raw) as Personagem) : null; return <button key={slot} className="btn" disabled={!personagem} onClick={() => personagem && onFight(personagem)}>{personagem ? `${personagem.nome} (${CLASSES[personagem.classe].nome}) - Iniciar luta` : `Slot ${slot} vazio`}</button>; })}</div><button className="btn" onClick={onBack}>Voltar</button></section>;
}

function TelaCombate({ personagem, inimigoBase, onBack }: { personagem: Personagem; inimigoBase: Inimigo; onBack: () => void }) {
  const [vidaPlayer, setVidaPlayer] = useState(personagem.stats.vida);
  const [vidaInimigo, setVidaInimigo] = useState(inimigoBase.vidaMaxima);
  const [log, setLog] = useState<string[]>([`${personagem.nome} encontrou ${inimigoBase.nome}.`]);

  function acao(acaoEscolhida: AcaoCombate | "fugir") {
    if (vidaPlayer <= 0 || vidaInimigo <= 0) return;
    if (acaoEscolhida === "fugir") {
      if (Math.random() <= 0.89) {
        setLog((l) => ["Você fugiu com sucesso (89%).", ...l]);
        return onBack();
      }
      setLog((l) => ["Falhou ao fugir!", ...l]);
    } else {
      const bruto = acaoEscolhida === "ataque" ? personagem.stats.ataque * 0.9 : acaoEscolhida === "magia" ? personagem.stats.magia * 1.1 + 3 : acaoEscolhida === "habilidade" ? personagem.stats.ataque + personagem.stats.magia * 0.9 + 2 : personagem.stats.ataque * 0.65;
      const dano = calcDano(bruto, inimigoBase.defesa);
      setVidaInimigo((v) => Math.max(0, v - dano));
      setLog((l) => [`Você usou ${acaoEscolhida} e causou ${dano} de dano.`, ...l]);
  onBack
}: {
  onBack: () => void;
}) {
  return (
    <section className="panel">
      <h2>Continuar</h2>

      <div className="stack">
        {[1, 2, 3, 4].map(
          (slot) => {
            const raw =
              localStorage.getItem(
                `save${slot}`
              );

            const personagem =
              raw
                ? (JSON.parse(
                    raw
                  ) as Personagem)
                : null;

            return (
              <button
                key={slot}
                className="btn"
                disabled={!personagem}
              >
                {personagem
                  ? `${personagem.nome} (${CLASSES[personagem.classe].nome})`
                  : `Slot ${slot} vazio`}
              </button>
            );
          }
        )}
      </div>

      <button
        className="btn"
        onClick={onBack}
      >
        Voltar
      </button>
    </section>
  );
}

function TelaOpcoes({
  musicaLigada,
  volume,
  onMusica,
  onVolume,
  onBack
}: {
  musicaLigada: boolean;

  volume: number;

  onMusica: (
    valor: boolean
  ) => void;

  onVolume: (
    valor: number
  ) => void;

  onBack: () => void;
}) {
  return (
    <section className="panel">
      <h2>Opções</h2>

      <div className="stack">
        <label>
          Música
        </label>

        <select
          value={
            musicaLigada
              ? "ligada"
              : "desligada"
          }

          onChange={(e) =>
            onMusica(
              e.target.value ===
                "ligada"
            )
          }
        >
          <option value="ligada">
            Ligada
          </option>

          <option value="desligada">
            Desligada
          </option>
        </select>

        <label>
          Volume: {volume}
        </label>

        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) =>
            onVolume(
              Number(
                e.target.value
              )
            )
          }
        />
      </div>

      <button
        className="btn"
        onClick={onBack}
      >
        Voltar
      </button>
    </section>
  );
}

type CriarProps = {
  slot: number;
  voltar: () => void;
  voltarMenu: () => void;
};

function CriarPersonagem({
  slot,
  voltar,
  voltarMenu
}: CriarProps) {
  const [nome, setNome] =
    useState("");

  const [classe, setClasse] =
    useState<ClasseId>(
      "guerreiro"
    );

  const [usarTraco, setUsarTraco] =
    useState(false);

  const [traco, setTraco] =
    useState("nenhum");

  function salvar() {
    if (!nome.trim()) {
      alert(
        "Digite um nome."
      );

      return;
    }

    const personagem: Personagem =
      {
        nome,
        classe,

        traco: usarTraco
          ? traco
          : null,

        stats: {
          ...CLASSES[classe].base
        },

        habilidade:
          CLASSES[classe]
            .habilidade,

        custoHabilidade:
          CLASSES[classe]
            .custo,

        cooldownHabilidade:
          CLASSES[classe]
            .cooldown,

        efeitoColateralHabilidade:
          CLASSES[classe]
            .efeitoColateral,

        buffClasse: [
          ...CLASSES[classe]
            .buff
        ],

        inventarioInicial: [
          ...CLASSES[classe]
            .itens
        ],

        escalonamentoCombate:
          ESCALONAMENTO_GLOBAL
      };

    localStorage.setItem(
      `save${slot}`,
      JSON.stringify(
        personagem
      )
    );

    alert(
      "Personagem criado!"
    );

    voltarMenu();
  }

  const classeAtual =
    CLASSES[classe];

  return (
    <section className="panel">
      <h2>
        Criar Personagem
      </h2>

      <input
        className="field"
        placeholder="Nome"

        value={nome}

        onChange={(e) =>
          setNome(
            e.target.value
          )
        }
      />

      <select
        className="field"

        value={classe}

        onChange={(e) =>
          setClasse(
            e.target
              .value as ClasseId
          )
        }
      >
        <option value="guerreiro">
          Guerreiro
        </option>

        <option value="mago">
          Mago
        </option>

        <option value="ladino">
          Ladino
        </option>
      </select>

      <label>
        <input
          type="checkbox"

          checked={usarTraco}

          onChange={(e) =>
            setUsarTraco(
              e.target.checked
            )
          }
        />

        Usar traço
      </label>

      {usarTraco && (
        <select
          className="field"

          value={traco}

          onChange={(e) =>
            setTraco(
              e.target.value
            )
          }
        >
          <option value="nenhum">
            Nenhum
          </option>

          <option value="corajoso">
            Corajoso
          </option>

          <option value="resistente">
            Resistente
          </option>
        </select>
      )}

      <div className="class-preview">
        <h3>
          {classeAtual.nome}
        </h3>

        <p>
          Vida:{" "}
          {
            classeAtual.base
              .vida
          }
        </p>

        <p>
          Defesa:{" "}
          {
            classeAtual.base
              .defesa
          }
        </p>

        <p>
          Magia:{" "}
          {
            classeAtual.base
              .magia
          }
        </p>

        <p>
          Agilidade:{" "}
          {
            classeAtual.base
              .agilidade
          }
        </p>

        <p>
          Ataque:{" "}
          {
            classeAtual.base
              .ataque
          }
        </p>

        <p>
          Ouro:{" "}
          {
            classeAtual.base
              .ouro
          }
        </p>

        <p>
          <strong>
            Buffs:
          </strong>{" "}
          {classeAtual.buff.join(
            ", "
          )}
        </p>

        <p>
          <strong>
            Habilidade:
          </strong>{" "}
          {
            classeAtual.habilidade
          }
        </p>
      </div>

      <div className="row">
        <button
          className="btn"
          onClick={salvar}
        >
          Criar
        </button>

        <button
          className="btn"
          onClick={voltar}
        >
          Voltar
        </button>
      </div>
    </section>
  );
}

export default App;