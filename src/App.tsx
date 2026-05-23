import { useEffect, useMemo, useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import "./App.css";

type Tela = "menu" | "slots" | "criar" | "opcoes" | "continuar";

type Personagem = {
  nome: string;
  classe: string;
  traco: string;
  vida: number;
  ataque: number;
  ouro: number;
};

type MenuButton = {
  id: "novo" | "continuar" | "opcoes" | "sair";
  texto: string;
  classe: string;
  onClick: () => void;
  disabled?: boolean;
};

function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [temSave, setTemSave] = useState(false);
  const [musicaLigada, setMusicaLigada] = useState(true);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    const saves = [1, 2, 3, 4].some((i) => localStorage.getItem(`save${i}`));
    setTemSave(saves);

    const musicaSalva = localStorage.getItem("opcoes_musica");
    const volumeSalvo = localStorage.getItem("opcoes_volume");

    if (musicaSalva) setMusicaLigada(musicaSalva === "ligada");
    if (volumeSalvo) setVolume(Number(volumeSalvo));
  }, []);

  function abrirNovoJogo() {
    setTela("slots");
  }

  function abrirContinuar() {
    if (!temSave) {
      alert("Nenhum save encontrado.");
      return;
    }

    setTela("continuar");
  }

  function abrirOpcoes() {
    setTela("opcoes");
  }

  function sairDoJogo() {
    const confirmou = window.confirm("Deseja sair para uma página em branco?");
    if (confirmou) {
      window.location.href = "about:blank";
    }
  }

  const botoesMenu: MenuButton[] = useMemo(
    () => [
      {
        id: "novo",
        texto: "Novo Jogo",
        classe: "menu-btn menu-btn-novo",
        onClick: abrirNovoJogo
      },
      {
        id: "continuar",
        texto: "Continuar",
        classe: "menu-btn menu-btn-continuar",
        onClick: abrirContinuar,
        disabled: !temSave
      },
      {
        id: "opcoes",
        texto: "Opções",
        classe: "menu-btn menu-btn-opcoes",
        onClick: abrirOpcoes
      },
      {
        id: "sair",
        texto: "Sair",
        classe: "menu-btn menu-btn-sair",
        onClick: sairDoJogo
      }
    ],
    [temSave]
  );

  return (
    <main className="app-shell">
      {tela === "menu" && (
        <section className="menu-screen" aria-label="Tela inicial">
          <img
            src={telaInicial}
            alt="Tela inicial de Chronicles of Valedorn"
            className="menu-image"
          />

          <div className="menu-overlay" aria-hidden="true" />
          <div className="embers" aria-hidden="true" />

          <div className="menu-buttons" aria-label="Ações da tela inicial">
            {botoesMenu.map((botao) => (
              <button
                key={botao.id}
                className={botao.classe}
                onClick={botao.onClick}
                disabled={botao.disabled}
              >
                {botao.texto}
              </button>
            ))}
          </div>
        </section>
      )}

      {tela === "slots" && (
        <section className="panel">
          <h2>Escolha um Slot</h2>

          <div className="stack">
            {[1, 2, 3, 4].map((slot) => {
              const existe = localStorage.getItem(`save${slot}`);

              return (
                <button
                  key={slot}
                  className="btn"
                  onClick={() => {
                    setSlotSelecionado(slot);
                    setTela("criar");
                  }}
                >
                  Slot {slot} {existe ? "(ocupado)" : "(vazio)"}
                </button>
              );
            })}
          </div>

          <button className="btn" onClick={() => setTela("menu")}>
            Voltar
          </button>
        </section>
      )}

      {tela === "continuar" && (
        <section className="panel">
          <h2>Continuar Aventura</h2>
          <div className="stack">
            {[1, 2, 3, 4].map((slot) => {
              const raw = localStorage.getItem(`save${slot}`);
              const personagem = raw ? (JSON.parse(raw) as Personagem) : null;

              return (
                <button
                  key={slot}
                  className="btn"
                  disabled={!personagem}
                  onClick={() => {
                    if (!personagem) return;
                    alert(
                      `Slot ${slot}: ${personagem.nome} (${personagem.classe}) | Vida ${personagem.vida} | Ataque ${personagem.ataque} | Ouro ${personagem.ouro}`
                    );
                  }}
                >
                  {personagem
                    ? `Slot ${slot} - ${personagem.nome} (${personagem.classe})`
                    : `Slot ${slot} vazio`}
                </button>
              );
            })}
          </div>

          <button className="btn" onClick={() => setTela("menu")}>
            Voltar
          </button>
        </section>
      )}

      {tela === "opcoes" && (
        <section className="panel">
          <h2>Opções</h2>

          <div className="stack">
            <label className="option-item" htmlFor="musica">
              Música
              <select
                id="musica"
                className="field"
                value={musicaLigada ? "ligada" : "desligada"}
                onChange={(e) => {
                  const ligado = e.target.value === "ligada";
                  setMusicaLigada(ligado);
                  localStorage.setItem("opcoes_musica", ligado ? "ligada" : "desligada");
                }}
              >
                <option value="ligada">Ligada</option>
                <option value="desligada">Desligada</option>
              </select>
            </label>

            <label className="option-item" htmlFor="volume">
              Volume: {volume}%
              <input
                id="volume"
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => {
                  const novoVolume = Number(e.target.value);
                  setVolume(novoVolume);
                  localStorage.setItem("opcoes_volume", String(novoVolume));
                }}
              />
            </label>
          </div>

          <button className="btn" onClick={() => setTela("menu")}>
            Voltar
          </button>
        </section>
      )}

      {tela === "criar" && slotSelecionado !== null && (
        <CriarPersonagem
          slot={slotSelecionado}
          voltar={() => setTela("slots")}
          voltarMenu={() => {
            setTemSave(true);
            setTela("menu");
          }}
        />
      )}
    </main>
  );
}

type CriarProps = {
  slot: number;
  voltar: () => void;
  voltarMenu: () => void;
};

function CriarPersonagem({ slot, voltar, voltarMenu }: CriarProps) {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState("guerreiro");
  const [traco, setTraco] = useState("nenhum");

  function criar() {
    if (!nome) {
      alert("Digite um nome!");
      return;
    }

    const personagem: Personagem = {
      nome,
      classe,
      traco,
      vida: 100,
      ataque: 10,
      ouro: 50
    };

    if (classe === "guerreiro") personagem.vida += 20;
    if (classe === "mago") personagem.ataque += 5;
    if (classe === "ladino") personagem.ouro += 20;

    if (traco === "corajoso") personagem.ataque += 3;
    if (traco === "resistente") personagem.vida += 15;

    localStorage.setItem(`save${slot}`, JSON.stringify(personagem));
    alert("Personagem criado com sucesso!");
    voltarMenu();
  }

  return (
    <section className="panel">
      <h2>Criar Personagem (Slot {slot})</h2>

      <input
        placeholder="Nome do personagem"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="field"
      />

      <h3>Classe</h3>
      <select
        value={classe}
        onChange={(e) => setClasse(e.target.value)}
        className="field"
      >
        <option value="guerreiro">Guerreiro (+vida)</option>
        <option value="mago">Mago (+ataque)</option>
        <option value="ladino">Ladino (+ouro)</option>
      </select>

      <h3>Traço</h3>
      <select
        value={traco}
        onChange={(e) => setTraco(e.target.value)}
        className="field"
      >
        <option value="nenhum">Nenhum</option>
        <option value="corajoso">Corajoso (+ataque)</option>
        <option value="resistente">Resistente (+vida)</option>
      </select>

      <div className="row">
        <button className="btn" onClick={criar}>
          Criar Personagem
        </button>

        <button className="btn" onClick={voltar}>
          Voltar
        </button>
      </div>
    </section>
  );
}

export default App;