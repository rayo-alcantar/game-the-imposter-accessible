"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getSocket } from "../lib/socketClient";
import { rememberPlayerName, saveLastSession } from "../lib/playerSession";

const parseGameId = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/([A-Z0-9]{4,})$/i);
  return match ? match[1].toUpperCase() : trimmed.toUpperCase();
};

export function JoinGameForm() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const handleConnectError = () => {
      setLoading(false);
      setError("No pudimos conectar con el servidor. Reintenta en unos segundos.");
    };
    const handleDisconnect = () => {
      setLoading(false);
    };
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const parsedCode = parseGameId(gameCode);
    if (!parsedCode) {
      setError("Necesitas ingresar un código o enlace de partida.");
      return;
    }
    if (!playerName.trim()) {
      setError("Ingresa tu nombre para continuar.");
      return;
    }
    const socket = getSocket();
    setLoading(true);
    const trimmedName = playerName.trim();
    const timeout = window.setTimeout(() => {
      setLoading(false);
      setError("No pudimos conectar con la sala. Intenta de nuevo.");
    }, 12_000);
    socket.emit(
      "joinGame",
      {
        gameId: parsedCode,
        playerName: trimmedName,
        password: password.trim() || undefined,
      },
      (response) => {
        window.clearTimeout(timeout);
        setLoading(false);
        if (!response?.ok || !response.gameId) {
          setError(response?.error ?? "No fue posible unirse.");
          return;
        }
        rememberPlayerName(trimmedName);
        saveLastSession({
          gameId: response.gameId,
          playerName: trimmedName,
          password: password.trim() || undefined,
          playerId: socket.id,
        });
        router.push(`/game/${response.gameId}`);
      },
    );
  };

  return (
    <form
      className="panel"
      onSubmit={handleSubmit}
      aria-label="Unirse a partida existente"
    >
      <h2>Unirse a partida</h2>
      <p>Pega el enlace que te compartieron o escribe el código manual.</p>
      <div className="field">
        <label htmlFor="gameCode">Código o URL</label>
        <input
          id="gameCode"
          name="gameCode"
          type="text"
          required
          value={gameCode}
          onChange={(event) => setGameCode(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="playerName">Tu nombre</label>
        <input
          id="playerName"
          name="playerName"
          type="text"
          required
          maxLength={32}
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="joinPassword">Contraseña (si es necesaria)</label>
        <input
          id="joinPassword"
          name="joinPassword"
          type="password"
          maxLength={32}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="secondary-button"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Conectando..." : "Entrar a la sala"}
      </button>
    </form>
  );
}
