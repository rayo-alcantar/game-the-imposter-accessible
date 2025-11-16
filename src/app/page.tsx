import { CreateGameForm } from "@/components/CreateGameForm";
import { JoinGameForm } from "@/components/JoinGameForm";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="hero">
        <p className="hero__tag">Juego social</p>
        <h1 className="hero__title">Impostor</h1>
        <p className="hero__description">
          Organiza partidas rápidas y divertidas. Comparte la palabra clave con
          tu voz, controla el turno en la web y deja que el servidor haga la
          magia. Nada de chats, solo risas (y sospechas).
        </p>
      </header>

      <section className="grid-panels" aria-label="Paneles de control">
        <CreateGameForm />
        <JoinGameForm />
      </section>

      <section className="panel" aria-label="Cómo se juega">
        <h2>Cómo se juega</h2>
        <ol>
          <li>
            Crea la sala, comparte el enlace y espera a que se conecten todas
            las personas.
          </li>
          <li>Cuando estén listos, el host inicia la partida.</li>
          <li>
            Cada participante recibe una palabra y su rol (civil o impostor).
          </li>
          <li>
            Hablen por turnos en la vida real y pulsen “Ya dije mi palabra” para
            pasar al siguiente.
          </li>
          <li>
            Tras tres rondas, todos votan. El impostor intenta adivinar la
            palabra de los civiles.
          </li>
          <li>
            Los resultados se muestran automáticamente y pueden reiniciar la
            partida con las mismas personas.
          </li>
        </ol>
      </section>
    </main>
  );
}
