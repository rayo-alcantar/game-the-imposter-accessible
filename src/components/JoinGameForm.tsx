"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSocket } from "../lib/socketClient";

const rememberPlayerName = (name: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("impostor:lastName", name);
};

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
    socket.emit(
      "joinGame",
      {
        gameId: parsedCode,
        playerName: trimmedName,
        password: password.trim() || undefined,
      },
      (response) => {
        setLoading(false);
        if (!response?.ok || !response.gameId) {
          setError(response?.error ?? "No fue posible unirse.");
          return;
        }
        rememberPlayerName(trimmedName);
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
