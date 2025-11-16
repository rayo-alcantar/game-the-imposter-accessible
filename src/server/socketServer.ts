import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import {
  createGame,
  joinGame,
  startGame,
  markPlayerTurnDone,
  castVote,
  setImpostorGuess,
  restartGame,
  leaveGame,
  reshuffleRolesAndWords,
} from "../domain/gameLogic";
import { getGame, updateGame } from "../domain/gameStore";
import { DomainEvent, GameError } from "../domain/gameTypes";
import { serializeGameStateForPlayer } from "./serializers";
import {
  AckResponse,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socketEvents";

type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

const getRoomName = (gameId: string) => `game:${gameId}`;

const sendError = (socket: GameSocket, error: unknown, ack?: AckResponse) => {
  const message =
    error instanceof GameError
      ? error.message
      : "Ocurrió un error inesperado. Inténtalo nuevamente.";
  socket.emit("error", { message });
  if (ack) {
    ack({ ok: false, error: message });
  }
  if (!(error instanceof GameError)) {
    console.error(error);
  }
};

const emitGameState = (gameId: string) => {
  const game = getGame(gameId);
  if (!game) return;
  game.players.forEach((player) => {
    try {
      const payload = serializeGameStateForPlayer(game, player.id);
      io?.to(player.id).emit("gameUpdated", payload);
    } catch {
      // Ignore serialization issues for disconnected sockets.
    }
  });
};

const dispatchDomainEvents = (gameId: string, events: DomainEvent[]) => {
  if (!events.length) return;
  const room = getRoomName(gameId);
  events.forEach((event) => {
    switch (event.type) {
      case "ROUND_STARTED":
        io?.to(room).emit("roundStarted", { round: event.round });
        break;
      case "TURN_STARTED":
        io?.to(room).emit("nextPlayerTurn", {
          playerId: event.playerId,
          playerName: event.playerName,
          round: event.round,
        });
        break;
      case "VOTING_STARTED":
        io?.to(room).emit("votingStarted");
        break;
      case "RESULTS_READY":
        io?.to(room).emit("resultAnnounced", {
          winner: event.winner,
          impostorId: event.impostorId,
          impostorGuessCorrect: event.impostorGuessCorrect,
        });
        break;
      default:
        break;
    }
  });
};

const ensureSocketInGame = (socket: GameSocket, gameId?: string): string => {
  const activeGameId = socket.data.gameId;
  if (!activeGameId) {
    throw new GameError("Primero debes unirte a una partida.");
  }
  if (gameId && activeGameId !== gameId) {
    throw new GameError("No puedes interactuar con otra partida.");
  }
  return activeGameId;
};

const recordHeartbeat = (socket: GameSocket, gameId?: string): void => {
  const targetGameId = gameId ?? socket.data.gameId;
  if (!targetGameId) return;
  const game = getGame(targetGameId);
  if (!game) return;
  const player = game.players.find((current) => current.id === socket.id);
  if (!player) return;
  player.connected = true;
  updateGame(game);
};

const handleLeave = (socket: GameSocket, specifiedGameId?: string) => {
  const gameId = specifiedGameId ?? socket.data.gameId;
  if (!gameId) return;
  socket.leave(getRoomName(gameId));
  socket.data.gameId = undefined;
  const result = leaveGame(gameId, socket.id);
  if (result?.game) {
    emitGameState(gameId);
  }
};

export const initSocket = (server: HTTPServer) => {
  if (io) {
    return io;
  }
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: "*",
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 5 * 60_000,
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket: GameSocket) => {
    socket.on("createGame", (payload, ack) => {
      try {
        const result = createGame(
          socket.id,
          payload.hostName,
          payload.maxPlayers,
          payload.password,
          payload.wordCategoryId,
        );
        const gameId = result.game.id;
        socket.join(getRoomName(gameId));
        socket.data.gameId = gameId;
        socket.emit("gameCreated", { gameId });
        ack?.({ ok: true, gameId });
        emitGameState(gameId);
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("joinGame", (payload, ack) => {
      try {
        const result = joinGame(
          payload.gameId,
          socket.id,
          payload.playerName,
          payload.password,
        );
        socket.join(getRoomName(result.game.id));
        socket.data.gameId = result.game.id;
        ack?.({ ok: true, gameId: result.game.id });
        emitGameState(result.game.id);
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("requestState", (payload) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        emitGameState(gameId);
      } catch (error) {
        sendError(socket, error);
      }
    });

    socket.on("heartbeat", (payload, ack) => {
      try {
        const gameId = payload?.gameId ?? socket.data.gameId;
        recordHeartbeat(socket, gameId);
        ack?.({ ok: true, gameId });
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("startGame", (payload) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = startGame(gameId, socket.id);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
      } catch (error) {
        sendError(socket, error);
      }
    });

    socket.on("playerReadyForRound", (payload) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = markPlayerTurnDone(gameId, socket.id);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
      } catch (error) {
        sendError(socket, error);
      }
    });

    socket.on("castVote", (payload, ack) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = castVote(gameId, socket.id, payload.votedPlayerId);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
        ack?.({ ok: true, gameId });
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("impostorGuess", (payload, ack) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = setImpostorGuess(gameId, socket.id, payload.guess);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
        ack?.({ ok: true, gameId });
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("requestRestart", (payload) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = restartGame(gameId, socket.id, payload.wordCategoryId);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
      } catch (error) {
        sendError(socket, error);
      }
    });

    socket.on("reshuffleGame", (payload, ack) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        const result = reshuffleRolesAndWords(gameId, socket.id);
        dispatchDomainEvents(gameId, result.events);
        emitGameState(gameId);
        ack?.({ ok: true, gameId });
      } catch (error) {
        sendError(socket, error, ack);
      }
    });

    socket.on("leaveGame", (payload) => {
      try {
        const gameId = ensureSocketInGame(socket, payload.gameId);
        handleLeave(socket, gameId);
      } catch (error) {
        sendError(socket, error);
      }
    });

    socket.on("disconnect", () => {
      const gameId = socket.data.gameId;
      if (!gameId) return;
      socket.leave(getRoomName(gameId));
      socket.data.gameId = undefined;
      const result = leaveGame(gameId, socket.id, { disconnectOnly: true });
      if (result?.game) {
        emitGameState(gameId);
      }
    });
  });

  return io;
};
