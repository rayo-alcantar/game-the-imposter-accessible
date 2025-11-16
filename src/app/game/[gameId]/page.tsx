"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MIN_PLAYERS } from "@/domain/gameTypes";
import type {
  GamePhase,
  SerializedGameState,
  SerializedPlayerStats,
} from "@/domain/gameTypes";
import { getSocket } from "@/lib/socketClient";
import { WORD_CATEGORY_SUMMARY } from "@/domain/wordList";

const PHASE_LABELS: Record<GamePhase, string> = {
  LOBBY: "En sala de espera",
  ASSIGNING: "Asignando roles",
  ROUNDS: "Rondas en progreso",
  VOTING: "Votación abierta",
  RESULTS: "Resultados",
  FINISHED: "Partida finalizada",
};

const phaseDescription = (game: SerializedGameState | null) => {
  if (!game) return "Conéctate para recibir actualizaciones.";
  switch (game.phase) {
    case "ROUNDS":
      return `Ronda ${game.currentRound} de ${game.totalRounds}`;
    case "VOTING":
      return "Momento de votar al impostor.";
    case "RESULTS":
      return "Resultados listos.";
    case "LOBBY":
      return `Esperando a ${game.maxPlayers - game.playerCount} jugador(es).`;
    default:
      return PHASE_LABELS[game.phase];
  }
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameIdParam = Array.isArray(params?.gameId)
    ? params?.gameId[0]
    : (params?.gameId as string | undefined);
  const [game, setGame] = useState<SerializedGameState | null>(null);
  const [selectedVote, setSelectedVote] = useState("");
  const [guess, setGuess] = useState("");
  const [liveMessage, setLiveMessage] = useState(
    "Esperando actualizaciones de la partida...",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [voteStatus, setVoteStatus] = useState("");
  const [guessStatus, setGuessStatus] = useState("");
  const [voteSending, setVoteSending] = useState(false);
  const [guessSending, setGuessSending] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [reshuffling, setReshuffling] = useState(false);
  const [restartCategoryId, setRestartCategoryId] = useState("any");

  useEffect(() => {
    const socket = getSocket();

    const handleGameUpdated = (state: SerializedGameState) => {
      if (!gameIdParam || state.gameId !== gameIdParam) return;
      setGame(state);
      setErrorMessage("");
      setJoinError("");
      setJoinLoading(false);
      setReshuffling(false);
      if (state.phase !== "VOTING") {
        setSelectedVote("");
        setVoteStatus("");
        setGuess("");
        setGuessStatus("");
        setVoteSending(false);
        setGuessSending(false);
      } else if (state.self.vote) {
        setSelectedVote(state.self.vote);
        setVoteStatus("Voto registrado. Espera al resto de personas.");
      }
      if (state.self.role === "IMPOSTOR" && state.impostorGuess) {
        setGuessStatus("Conjetura enviada.");
      } else if (state.self.role !== "IMPOSTOR") {
        setGuess("");
        setGuessStatus("");
      }
    };

    const setStatus = (message: string) => {
      setLiveMessage(message);
    };

    socket.on("gameUpdated", handleGameUpdated);
    socket.on("roundStarted", ({ round }) =>
      setStatus(`Comienza la ronda ${round}.`),
    );
    socket.on("nextPlayerTurn", ({ playerName }) =>
      setStatus(`Turno de ${playerName}.`),
    );
    socket.on("votingStarted", () =>
      setStatus("Comienza la votación, comparte tu sospecha."),
    );
    socket.on("resultAnnounced", () => {
      setStatus("La partida terminó. Revisa la sección de resultados.");
    });
    socket.on("error", ({ message }) => {
      setErrorMessage(message);
      setStatus(message);
    });

    if (gameIdParam) {
      socket.emit("requestState", { gameId: gameIdParam });
    }

    return () => {
      socket.off("gameUpdated", handleGameUpdated);
      socket.off("roundStarted");
      socket.off("nextPlayerTurn");
      socket.off("votingStarted");
      socket.off("resultAnnounced");
      socket.off("error");
    };
  }, [gameIdParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedName = window.localStorage.getItem("impostor:lastName");
    if (storedName) {
      setJoinName(storedName);
    }
  }, []);

  useEffect(() => {
    const nextCategory = game?.wordCategoryId ?? "any";
    setRestartCategoryId(nextCategory);
  }, [game?.wordCategoryId]);

  const gameId = game?.gameId ?? gameIdParam ?? "";

  const shareLink = useMemo(() => {
    if (typeof window === "undefined" || !gameId) return "";
    return `${window.location.origin}/game/${gameId}`;
  }, [gameId]);

  const categoryOptions = useMemo(
    () => [
      {
        id: "any",
        name: "Aleatorio (todas)",
        count: WORD_CATEGORY_SUMMARY.reduce((sum, cat) => sum + cat.count, 0),
      },
      ...WORD_CATEGORY_SUMMARY,
    ],
    [],
  );

  const statsRows = useMemo(() => {
    if (!game?.playerStats) return [];
    return [...game.playerStats]
      .map((stat) => {
        const triumphs =
          stat.totalTriumphs ??
          stat.winsAsCivil + stat.winsAsImpostor + stat.drawCount;
        const victories = stat.winsAsCivil + stat.winsAsImpostor;
        return { ...stat, triumphs, victories };
      })
      .sort((a, b) => {
        if (b.triumphs !== a.triumphs) return b.triumphs - a.triumphs;
        if (b.victories !== a.victories) return b.victories - a.victories;
        if (b.correctGuesses !== a.correctGuesses) {
          return b.correctGuesses - a.correctGuesses;
        }
        if (b.matchesPlayed !== a.matchesPlayed) {
          return b.matchesPlayed - a.matchesPlayed;
        }
        return a.name.localeCompare(b.name);
      });
  }, [game?.playerStats]);

  const handleStart = () => {
    if (!gameId) return;
    getSocket().emit("startGame", { gameId });
  };

  const handleReady = () => {
    if (!gameId) return;
    getSocket().emit("playerReadyForRound", { gameId });
  };

  const handleVoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gameId || !selectedVote) return;
    setVoteSending(true);
    setVoteStatus("");
    getSocket().emit(
      "castVote",
      { gameId, votedPlayerId: selectedVote },
      (response) => {
        setVoteSending(false);
        if (!response?.ok) {
          setVoteStatus(response?.error ?? "No pudimos registrar el voto.");
          return;
        }
        setVoteStatus("Voto registrado. Espera al resto de personas.");
      },
    );
  };

  const handleGuessSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gameId || !guess.trim()) return;
    setGuessSending(true);
    setGuessStatus("");
    getSocket().emit(
      "impostorGuess",
      { gameId, guess: guess.trim() },
      (response) => {
        setGuessSending(false);
        if (!response?.ok) {
          setGuessStatus(response?.error ?? "No pudimos guardar tu conjetura.");
          return;
        }
        setGuess("");
        setGuessStatus("Conjetura enviada. Cruza los dedos.");
      },
    );
  };

  const handleRestart = () => {
    if (!gameId) return;
    getSocket().emit("requestRestart", {
      gameId,
      wordCategoryId: restartCategoryId,
    });
  };

  const handleReshuffle = () => {
    if (!gameId) return;
    setReshuffling(true);
    setErrorMessage("");
    getSocket().emit("reshuffleGame", { gameId }, (response) => {
      setReshuffling(false);
      if (!response?.ok) {
        setErrorMessage(
          response?.error ??
            "No pudimos reasignar roles y palabras. Intenta de nuevo.",
        );
        return;
      }
      setLiveMessage("Nuevos roles y palabras asignados.");
    });
  };

  const handleInlineJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gameId) {
      setJoinError("El enlace no es válido.");
      return;
    }
    if (!joinName.trim()) {
      setJoinError("Necesitas escribir tu nombre.");
      return;
    }
    setJoinError("");
    setJoinLoading(true);
    const socket = getSocket();
    const trimmedName = joinName.trim();
    socket.emit(
      "joinGame",
      {
        gameId,
        playerName: trimmedName,
        password: joinPassword.trim() || undefined,
      },
      (response) => {
        setJoinLoading(false);
        if (!response?.ok) {
          setJoinError(response?.error ?? "No pudimos unirte a la partida.");
          return;
        }
        if (typeof window !== "undefined") {
          window.localStorage.setItem("impostor:lastName", trimmedName);
        }
      },
    );
  };

  const handleLeave = () => {
    if (!gameId) return router.push("/");
    getSocket().emit("leaveGame", { gameId });
    router.push("/");
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareLink;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) {
          throw new Error("Copy failed");
        }
      }
      setErrorMessage("");
      setLiveMessage("Enlace copiado al portapapeles.");
    } catch {
      setErrorMessage("No pudimos copiar el enlace automaticamente. Copia el enlace manualmente.");
    }
  };

  const currentTurnId =
    game?.phase === "ROUNDS" ? game.currentTurnPlayerId : undefined;

  const showReadyButton =
    game?.phase === "ROUNDS" && currentTurnId === game?.self.id;

  const showVotingForm =
    game?.phase === "VOTING" && game.self.role !== "IMPOSTOR";
  const showGuessForm =
    game?.phase === "VOTING" && game.self.role === "IMPOSTOR";
  const showRestart = game?.phase === "RESULTS" && game.self.isHost;
  const showReshuffle =
    game?.self.isHost && game?.phase !== "LOBBY" && game?.phase !== "FINISHED";
  const hasEnoughPlayersForNewMatch =
    game ? game.playerCount >= MIN_PLAYERS : false;
  const restartDisabled = showRestart && !hasEnoughPlayersForNewMatch;
  const reshuffleDisabled = showReshuffle && !hasEnoughPlayersForNewMatch;
  const showMinPlayersWarning =
    (restartDisabled || reshuffleDisabled) && Boolean(game?.self.isHost);

  const impostorName = game?.impostorName ?? "el impostor";
  const resultMessage =
    game?.phase === "RESULTS"
      ? game.winner === "CIVILS"
        ? `¡Las personas civiles atraparon al impostor! Era ${impostorName}.`
        : game.winner === "IMPOSTOR"
          ? `El impostor (${impostorName}) no fue descubierto.`
          : `Empate: atraparon a ${impostorName}, pero adivinó la palabra.`
      : "";
  const personalResult =
    game?.phase === "RESULTS"
      ? game.self.role === "IMPOSTOR"
        ? game.winner === "IMPOSTOR"
          ? "Ganaste como impostor."
          : game.winner === "DRAW"
            ? "Empate: lograste adivinar la palabra."
            : "Perdiste, la tripulación te descubrió."
        : game.winner === "CIVILS"
          ? "Ganaste como civil."
          : game.winner === "DRAW"
            ? "Empate: atraparon al impostor pero adivinó la palabra."
            : "Perdiste, el impostor se salió con la suya."
      : "";

  return (
    <main className="page-shell" aria-live="polite">
      <header className="panel">
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="status-stack">
            <span className="pill pill--accent">Código</span>
            <p
              style={{
                fontSize: "1.8rem",
                margin: 0,
                fontWeight: 700,
                letterSpacing: "0.2em",
              }}
            >
              {gameId || "????"}
            </p>
            <p style={{ margin: 0, fontWeight: 500 }}>
              Categoria: <strong>{game?.wordCategoryName ?? "Cargando..."}</strong>
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={handleCopyLink}
            disabled={!shareLink}
          >
            Copiar enlace
          </button>
          <button type="button" className="secondary-button" onClick={handleLeave}>
            Salir de la partida
          </button>
        </div>
        <p role="status" aria-live="polite" className="live-region">
          {phaseDescription(game)}
        </p>
        <p aria-live="polite" className="live-region">
          {liveMessage}
        </p>
        {errorMessage ? (
          <p role="alert" aria-live="assertive" className="live-region">
            {errorMessage}
          </p>
        ) : null}
      </header>

      {game ? (
        <>
          <section className="panel" aria-label="Tu información secreta">
            <h2>Tu rol</h2>
            <p>
              <strong>{game.self.role ?? "Sin asignar"}</strong>
            </p>
            {game.self.word ? (
              <p>
                Tu palabra es:{" "}
                <strong aria-label="Tu palabra secreta">{game.self.word}</strong>
              </p>
            ) : (
              <p>Aún no tienes palabra asignada.</p>
            )}
            {showReadyButton ? (
              <button type="button" className="primary-button" onClick={handleReady}>
                Ya dije mi palabra
              </button>
            ) : null}
            {game.self.isHost && game.phase === "LOBBY" ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleStart}
                disabled={game.playerCount !== game.maxPlayers}
                aria-disabled={game.playerCount !== game.maxPlayers}
              >
                Iniciar partida
              </button>
            ) : null}
            {showRestart ? (
              <>
                <div className="field">
                  <label htmlFor="restartCategory">Categoria para la siguiente partida</label>
                  <select
                    id="restartCategory"
                    value={restartCategoryId}
                    onChange={(event) => setRestartCategoryId(event.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.count})
                      </option>
                    ))}
                  </select>
                  <p className="helper-text">
                    Se usara al reiniciar y arranca con las mismas personas conectadas.
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleRestart}
                  disabled={restartDisabled}
                  aria-disabled={restartDisabled}
                >
                  Reiniciar partida
                </button>
              </>
            ) : null}
            {showReshuffle ? (
              <button
                type="button"
                className="secondary-button"
                onClick={handleReshuffle}
                disabled={reshuffleDisabled || reshuffling}
                aria-disabled={reshuffleDisabled || reshuffling}
                aria-busy={reshuffling}
              >
                {reshuffling ? "Repartiendo..." : "Nuevos roles y palabras"}
              </button>
            ) : null}
            {showMinPlayersWarning ? (
              <p role="status" aria-live="polite">
                Necesitas al menos {MIN_PLAYERS} personas conectadas.
              </p>
            ) : null}
          </section>

          <section className="panel" aria-label="Personas conectadas">
            <h2>Jugadores conectados</h2>
            <ul className="player-list">
              {game.players.map((player) => (
                <li key={player.id} className="player-row">
                  <div>
                    <strong>{player.name}</strong>{" "}
                    {player.isHost ? (
                      <span className="pill pill--accent">Host</span>
                    ) : null}
                  </div>
                  {currentTurnId === player.id && game.phase === "ROUNDS" ? (
                    <span className="pill">Turno</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {showVotingForm ? (
            <section className="panel" aria-label="Votación">
              <h2>Vota quién crees que es el impostor</h2>
              {game.pendingVoters.length ? (
                <p role="status" aria-live="polite">
                  Faltan {game.pendingVoters.length} persona(s) por votar:{" "}
                  {game.pendingVoters.join(", ")}
                </p>
              ) : (
                <p role="status" aria-live="polite">
                  Todas las personas ya enviaron su voto. Espera el resultado.
                </p>
              )}
              <form onSubmit={handleVoteSubmit}>
                <fieldset>
                  <legend>Selecciona un jugador</legend>
                  {game.players
                    .filter((player) => player.id !== game.self.id)
                    .map((player) => (
                      <label key={player.id} style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                          type="radio"
                          name="vote"
                          value={player.id}
                          checked={selectedVote === player.id}
                          onChange={(event) => setSelectedVote(event.target.value)}
                        />{" "}
                        {player.name}
                      </label>
                    ))}
                </fieldset>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!selectedVote || voteSending}
                  aria-busy={voteSending}
                >
                  {voteSending ? "Enviando voto..." : "Enviar voto"}
                </button>
              </form>
              {voteStatus ? (
                <p role="status" aria-live="polite">
                  {voteStatus}
                </p>
              ) : null}
            </section>
          ) : null}

          {showGuessForm ? (
            <section className="panel" aria-label="Adivinanza del impostor">
              <h2>¿Cuál crees que es la palabra de los civiles?</h2>
              <form onSubmit={handleGuessSubmit}>
                <div className="field">
                  <label htmlFor="guessInput">Tu conjetura</label>
                  <input
                    id="guessInput"
                    type="text"
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="secondary-button"
                  disabled={!guess.trim() || guessSending}
                  aria-busy={guessSending}
                >
                  {guessSending ? "Enviando..." : "Enviar conjetura"}
                </button>
              </form>
              {guessStatus ? (
                <p role="status" aria-live="polite">
                  {guessStatus}
                </p>
              ) : null}
            </section>
          ) : null}

          {game.phase === "RESULTS" ? (
            <section className="panel" aria-label="Resultados de la partida">
              <h2>Resultados</h2>
              <p aria-live="polite">{resultMessage}</p>
              {personalResult ? <p>{personalResult}</p> : null}
              {game.impostorGuess ? (
                <p>
                  {impostorName} escribio: <strong>{game.impostorGuess}</strong>
                </p>
              ) : null}
            </section>
          ) : null}

          {statsRows.length ? (
            <section className="panel" aria-label="Resultados acumulados">
              <details className="collapsible">
                <summary className="collapsible__summary">Ver resultados</summary>
                <p className="helper-text" style={{ marginTop: "0.5rem" }}>
                  Tabla ordenada por triunfos. Triunfos = victorias como civil o impostor mas empates.
                </p>
                <div className="table-wrapper">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Triunfos</th>
                        <th>Veces impostor</th>
                        <th>Lo descubrieron</th>
                        <th>Adivino palabra</th>
                        <th>Empates</th>
                        <th>Victorias civ.</th>
                        <th>Victorias imp.</th>
                        <th>Partidas jugadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsRows.map((stat) => (
                        <tr key={stat.playerId}>
                          <td>{stat.name}</td>
                          <td>{stat.triumphs}</td>
                          <td>{stat.impostorCount}</td>
                          <td>{stat.caughtCount}</td>
                          <td>{stat.correctGuesses}</td>
                          <td>{stat.drawCount}</td>
                          <td>{stat.winsAsCivil}</td>
                          <td>{stat.winsAsImpostor}</td>
                          <td>{stat.matchesPlayed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : null}
        </>
      ) : (
        <section className="panel">
          <h2>Únete a esta partida</h2>
          <p>
            Si abriste el enlace directamente, ingresa tu nombre para enlazarte
            con la sala. Si tiene contraseña, escríbela también.
          </p>
          <form onSubmit={handleInlineJoin}>
            <div className="field">
              <label htmlFor="inlineName">Tu nombre</label>
              <input
                id="inlineName"
                type="text"
                value={joinName}
                maxLength={32}
                onChange={(event) => setJoinName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="inlinePassword">Contraseña (si aplica)</label>
              <input
                id="inlinePassword"
                type="password"
                value={joinPassword}
                maxLength={32}
                onChange={(event) => setJoinPassword(event.target.value)}
              />
            </div>
            {joinError ? (
              <p role="alert" aria-live="assertive">
                {joinError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                type="submit"
                className="primary-button"
                disabled={joinLoading}
                aria-busy={joinLoading}
              >
                {joinLoading ? "Conectando..." : "Unirme ahora"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => router.push("/")}
              >
                Volver al inicio
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

