"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WORD_CATEGORY_SUMMARY } from "@/domain/wordList";
import { getSocket } from "../lib/socketClient";
import { rememberPlayerName, saveLastSession } from "../lib/playerSession";

export function CreateGameForm() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState("");
  const [wordCategoryId, setWordCategoryId] = useState("any");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categoryOptions = useMemo(
    () => [
      {
        id: "any",
        name: "Aleatorio (todas)",
        count: WORD_CATEGORY_SUMMARY.reduce(
          (sum, cat) => sum + cat.count,
          0,
        ),
      },
      ...WORD_CATEGORY_SUMMARY,
    ],
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!hostName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const socket = getSocket();
    setLoading(true);
    const trimmedName = hostName.trim();

    socket.emit(
      "createGame",
      {
        hostName: trimmedName,
        maxPlayers,
        password: password.trim() || undefined,
        wordCategoryId: wordCategoryId === "any" ? undefined : wordCategoryId,
      },
      (response) => {
        setLoading(false);
        if (!response?.ok || !response.gameId) {
          setError(response?.error ?? "No fue posible crear la partida.");
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
    <form className="panel" onSubmit={handleSubmit} aria-label="Crear partida">
      <h2>Crear partida</h2>
      <p>Indica los datos básicos y comparte el enlace con tus amistades.</p>
      <div className="field">
        <label htmlFor="hostName">Tu nombre</label>
        <input
          id="hostName"
          name="hostName"
          type="text"
          required
          maxLength={32}
          value={hostName}
          onChange={(event) => setHostName(event.target.value)}
        />
      </div>
      <p className="helper-text">Admite de 3 a 20 personas.</p>
      <div className="field">
        <label htmlFor="maxPlayers">Número de jugadores</label>
        <input
          id="maxPlayers"
          name="maxPlayers"
          type="number"
          min={3}
          max={20}
          value={maxPlayers}
          onChange={(event) => setMaxPlayers(Number(event.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="roomPassword">Contraseña (opcional)</label>
        <input
          id="roomPassword"
          name="roomPassword"
          type="password"
          maxLength={32}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="wordCategory">Categoría de palabras</label>
        <select
          id="wordCategory"
          name="wordCategory"
          value={wordCategoryId}
          onChange={(event) => setWordCategoryId(event.target.value)}
        >
          {categoryOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} ({option.count})
            </option>
          ))}
        </select>
        <p className="helper-text">
          Escoge un tema o deja aleatorio para mezclarlo todo.
        </p>
      </div>
      {error ? (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="primary-button"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Creando..." : "Crear partida"}
      </button>
    </form>
  );
}
