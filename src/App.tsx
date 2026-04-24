import { useEffect, useState } from "react";
import telaInicial from "../fotos/tela_inicial.png";
import "./App.css";

type Tela = "menu" | "slots" | "criar";

type Personagem = {
  nome: string;
  classe: string;
  traco: string;
  vida: number;
  ataque: number;
  ouro: number;
};

function App() {
  const [tela, setTela] = useState<Tela>("menu");
  const [slotSelecionado, setSlotSelecionado] = useState<number | null>(null);
  const [temSave, setTemSave] = useState(false);

  useEffect(() => {
    const saves = [1, 2, 3, 4].some((i) => localStorage.getItem(`save${i}`));
    setTemSave(saves);
  }, []);

  function continuar() {
    alert("Sistema de continuar ainda será implementado");
  }

  return (
 <main className="app-shell">
      {tela === "menu" && (
         <section className="menu-screen" aria-label="Tela inicial">
          <img
            src={telaInicial}
            alt="Tela inicial de Chronicles of Valedorn"
            className="menu-image"
          />

          <div className="menu-hotspots" aria-label="Ações da tela inicial">
            {temSave && (
              <button className="hotspot hotspot-continuar" onClick={continuar}>
                Continuar
              </button>
            )}

            <button
              className={`hotspot ${temSave ? "hotspot-novo-com-save" : "hotspot-novo"}`}
              onClick={() => setTela("slots")}
            >
              Novo Jogo
            </button>
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

    // bônus por classe
    if (classe === "guerreiro") personagem.vida += 20;
    if (classe === "mago") personagem.ataque += 5;
    if (classe === "ladino") personagem.ouro += 20;

    // bônus por traço
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