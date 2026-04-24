import { useState, useEffect } from "react";

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
    const saves = [1, 2, 3, 4].some((i) =>
      localStorage.getItem(`save${i}`)
    );
    setTemSave(saves);
  }, []);

  function continuar() {
    alert("Sistema de continuar ainda será implementado");
  }

  return (
    <div style={styles.container}>
      {tela === "menu" && (
        <>
          <h1 style={styles.titulo}>Chronicles of Valedorn</h1>

          {temSave && (
            <button style={styles.botao} onClick={continuar}>
              ▶ Continuar
            </button>
          )}

          <button style={styles.botao} onClick={() => setTela("slots")}>
            ▶ Novo Jogo
          </button>
        </>
      )}

      {tela === "slots" && (
        <div>
          <h2>Escolha um Slot</h2>

          {[1, 2, 3, 4].map((slot) => {
            const existe = localStorage.getItem(`save${slot}`);

            return (
              <button
                key={slot}
                style={styles.botao}
                onClick={() => {
                  setSlotSelecionado(slot);
                  setTela("criar");
                }}
              >
                Slot {slot} {existe ? "(ocupado)" : "(vazio)"}
              </button>
            );
          })}

          <button style={styles.botao} onClick={() => setTela("menu")}>
            Voltar
          </button>
        </div>
      )}

      {tela === "criar" && slotSelecionado !== null && (
        <CriarPersonagem
          slot={slotSelecionado}
          voltar={() => setTela("slots")}
          voltarMenu={() => setTela("menu")}
        />
      )}
    </div>
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

    let personagem: Personagem = {
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
    <div>
      <h2>Criar Personagem (Slot {slot})</h2>

      <input
        placeholder="Nome do personagem"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={styles.input}
      />

      <h3>Classe</h3>
      <select
        value={classe}
        onChange={(e) => setClasse(e.target.value)}
        style={styles.select}
      >
        <option value="guerreiro">Guerreiro (+vida)</option>
        <option value="mago">Mago (+ataque)</option>
        <option value="ladino">Ladino (+ouro)</option>
      </select>

      <h3>Traço</h3>
      <select
        value={traco}
        onChange={(e) => setTraco(e.target.value)}
        style={styles.select}
      >
        <option value="nenhum">Nenhum</option>
        <option value="corajoso">Corajoso (+ataque)</option>
        <option value="resistente">Resistente (+vida)</option>
      </select>

      <br /><br />

      <button style={styles.botao} onClick={criar}>
        Criar Personagem
      </button>

      <button style={styles.botao} onClick={voltar}>
        Voltar
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(#0b0b0b, #1a1a1a)",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    color: "#e6d3a3",
    fontFamily: "serif"
  },
  titulo: {
    fontSize: "48px",
    marginBottom: "40px",
    textShadow: "2px 2px 5px black"
  },
  botao: {
    padding: "12px 30px",
    fontSize: "18px",
    background: "#2c1f0f",
    color: "#e6d3a3",
    border: "2px solid #a67c52",
    cursor: "pointer",
    margin: "10px"
  },
  input: {
    padding: "10px",
    margin: "10px",
    background: "#222",
    color: "white",
    border: "1px solid #555"
  },
  select: {
    padding: "10px",
    margin: "10px",
    background: "#222",
    color: "white",
    border: "1px solid #555"
  }
};

export default App;