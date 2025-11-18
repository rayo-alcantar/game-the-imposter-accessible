import { nanoid } from "nanoid";
import {
  DomainEvent,
  GameError,
  GameLogicResult,
  GameState,
  PlayerStats,
  VoteMap,
  MIN_PLAYERS,
  MAX_PLAYERS,
  Player,
  TOTAL_ROUNDS,
} from "./gameTypes";
import {
  createGameState,
  deleteGame,
  getGame,
  updateGame,
} from "./gameStore";
import { getCategoryById, getRandomWordPair } from "./wordList";

const GAME_ID_LENGTH = 6;

const logicResult = (game: GameState, events: DomainEvent[] = []): GameLogicResult => {
  updateGame(game);
  return { game, events };
};

const ensureGame = (gameId: string): GameState => {
  const game = getGame(gameId);
  if (!game) {
    throw new GameError("La partida no existe.");
  }
  return game;
};

const normalizeName = (name: string): string => name.trim().slice(0, 32);

const normalizePassword = (password?: string): string | undefined => {
  if (!password) return undefined;
  const trimmed = password.trim();
  return trimmed.length ? trimmed : undefined;
};

const createEmptyStats = (player: Player): PlayerStats => ({
  playerId: player.id,
  name: player.name,
  matchesPlayed: 0,
  impostorCount: 0,
  caughtCount: 0,
  correctGuesses: 0,
  drawCount: 0,
  winsAsImpostor: 0,
  winsAsCivil: 0,
});

const ensureStatsForPlayer = (game: GameState, player: Player): PlayerStats => {
  const existing = game.playerStats[player.id];
  if (existing) {
    if (existing.name !== player.name) {
      existing.name = player.name;
    }
    return existing;
  }
  const created = createEmptyStats(player);
  game.playerStats[player.id] = created;
  return created;
};

const DEFAULT_CATEGORY_NAME = "Aleatorio (todas)";

const getConnectedPlayers = (game: GameState): Player[] =>
  game.players.filter((player) => player.connected);

const swapPlayerId = (game: GameState, oldId: string, newId: string): void => {
  if (oldId === newId) return;
  const newVotes: VoteMap = {};
  Object.entries(game.votes).forEach(([voter, target]) => {
    const mappedVoter = voter === oldId ? newId : voter;
    const mappedTarget = target === oldId ? newId : target;
    newVotes[mappedVoter] = mappedTarget;
  });
  game.votes = newVotes;

  const existingStats = game.playerStats[oldId];
  if (existingStats) {
    game.playerStats[newId] = { ...existingStats, playerId: newId };
    delete game.playerStats[oldId];
  }

  if (game.hostId === oldId) {
    game.hostId = newId;
  }
};

const resolveCategorySelection = (
  categoryId?: string,
): { id?: string; name: string } => {
  if (!categoryId || categoryId === "any") {
    return { id: undefined, name: DEFAULT_CATEGORY_NAME };
  }
  const category = getCategoryById(categoryId);
  if (!category) {
    throw new GameError("La categoría seleccionada no existe.");
  }
  return { id: category.id, name: category.name };
};

const assignRolesAndWords = (game: GameState): void => {
  const pair = getRandomWordPair(game.wordCategoryId);
  game.players.forEach((player) => {
    player.role = undefined;
  });
  const connectedPlayers = getConnectedPlayers(game);
  if (!connectedPlayers.length) {
    throw new GameError("No hay jugadores conectados para asignar roles.");
  }
  const impostorIndex = Math.floor(Math.random() * connectedPlayers.length);
  connectedPlayers.forEach((player, index) => {
    player.role = index === impostorIndex ? "IMPOSTOR" : "CIVIL";
  });
  game.civilWord = pair.civil;
  game.impostorWord = pair.impostor;
};

const shufflePlayers = (game: GameState): void => {
  for (let index = game.players.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [game.players[index], game.players[swapIndex]] = [
      game.players[swapIndex],
      game.players[index],
    ];
  }
};

const transferHostToNextPlayer = (game: GameState, previousHostId: string): void => {
  const sortedByJoin = [...game.players]
    .filter((player) => player.id !== previousHostId)
    .sort((playerA, playerB) => playerA.joinedAt - playerB.joinedAt);

  const nextHost = sortedByJoin.find((player) => player.connected) ?? sortedByJoin[0];
  if (!nextHost) return;

  game.hostId = nextHost.id;
  game.players.forEach((player) => {
    player.isHost = player.id === nextHost.id;
  });
};

const findFirstConnectedIndex = (game: GameState): number | null => {
  for (let index = 0; index < game.players.length; index += 1) {
    if (game.players[index].connected) return index;
  }
  return null;
};

const findNextConnectedIndex = (
  game: GameState,
  afterIndex: number,
): number | null => {
  for (let index = afterIndex + 1; index < game.players.length; index += 1) {
    if (game.players[index].connected) return index;
  }
  return null;
};

const findConnectedFromIndex = (game: GameState, startIndex: number): number | null => {
  for (let index = startIndex; index < game.players.length; index += 1) {
    if (game.players[index].connected) return index;
  }
  return findFirstConnectedIndex(game);
};

const prepareNewMatch = (game: GameState): DomainEvent[] => {
  assignRolesAndWords(game);
  shufflePlayers(game);
  game.phase = "ROUNDS";
  game.currentRound = 1;
  const firstConnectedIndex = findFirstConnectedIndex(game);
  game.currentTurnIndex = firstConnectedIndex ?? 0;
  game.votes = {};
  game.impostorGuess = undefined;
  game.winner = undefined;

  const firstPlayer = firstConnectedIndex !== null ? game.players[firstConnectedIndex] : null;
  const events: DomainEvent[] = [{ type: "ROUND_STARTED", round: 1 }];
  if (firstPlayer) {
    events.push({
      type: "TURN_STARTED",
      playerId: firstPlayer.id,
      playerName: firstPlayer.name,
      round: 1,
    });
  }

  return events;
};

const normalizeWord = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const createGame = (
  hostSocketId: string,
  hostName: string,
  maxPlayers: number,
  password?: string,
  wordCategoryId?: string,
): GameLogicResult => {
  if (!hostName || !hostName.trim()) {
    throw new GameError("El nombre del host es obligatorio.");
  }
  if (!Number.isInteger(maxPlayers)) {
    throw new GameError("El número de jugadores debe ser entero.");
  }
  if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
    throw new GameError(
      `El número de jugadores debe estar entre ${MIN_PLAYERS} y ${MAX_PLAYERS}.`,
    );
  }

  const id = nanoid(GAME_ID_LENGTH).toUpperCase();
  const now = Date.now();
  const categorySelection = resolveCategorySelection(wordCategoryId);
  const host: Player = {
    id: hostSocketId,
    name: normalizeName(hostName),
    role: undefined,
    isHost: true,
    connected: true,
    joinedAt: now,
  };

  const game: GameState = {
    id,
    hostId: hostSocketId,
    maxPlayers,
    password: normalizePassword(password),
    wordCategoryId: categorySelection.id,
    wordCategoryName: categorySelection.name,
    phase: "LOBBY",
    players: [host],
    currentRound: 0,
    currentTurnIndex: 0,
    votes: {},
    createdAt: now,
    updatedAt: now,
    playerStats: { [host.id]: createEmptyStats(host) },
  };

  createGameState(game);
  return { game, events: [] };
};

export const joinGame = (
  gameId: string,
  playerId: string,
  rawName: string,
  password?: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  const name = normalizeName(rawName);
  if (!name) {
    throw new GameError("El nombre es obligatorio.");
  }
  const existingByName = game.players.find(
    (player) => player.name.toLowerCase() === name.toLowerCase(),
  );
  const isReconnect = existingByName ? !existingByName.connected : false;

  if (game.phase !== "LOBBY" && !isReconnect) {
    throw new GameError("La partida ya inició.");
  }
  if (game.players.find((player) => player.id === playerId && player.connected)) {
    throw new GameError("Ya estás en esta partida.");
  }
  if (game.password && game.password !== normalizePassword(password)) {
    throw new GameError("La contraseña no coincide.");
  }
  const duplicateName = game.players.some(
    (player) =>
      player.name.toLowerCase() === name.toLowerCase() && player.connected,
  );
  if (duplicateName && !isReconnect) {
    throw new GameError("Ese nombre ya está en uso dentro de la partida.");
  }
  if (game.players.length >= game.maxPlayers && !isReconnect) {
    throw new GameError("La partida está llena.");
  }

  if (isReconnect && existingByName) {
    const previousId = existingByName.id;
    existingByName.id = playerId;
    existingByName.connected = true;
    swapPlayerId(game, previousId, playerId);
    ensureStatsForPlayer(game, existingByName);
    return logicResult(game);
  }

  const player: Player = {
    id: playerId,
    name,
    role: undefined,
    isHost: false,
    connected: true,
    joinedAt: Date.now(),
  };

  game.players.push(player);
  ensureStatsForPlayer(game, player);
  return logicResult(game);
};

export const startGame = (gameId: string, requesterId: string): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.hostId !== requesterId) {
    throw new GameError("Solo la persona anfitriona puede iniciar la partida.");
  }
  if (game.phase !== "LOBBY") {
    throw new GameError("La partida ya comenzo.");
  }
  if (game.players.length !== game.maxPlayers) {
    throw new GameError("Aun faltan jugadores para comenzar.");
  }
  const connectedPlayers = getConnectedPlayers(game);
  if (connectedPlayers.length < MIN_PLAYERS) {
    throw new GameError("Se necesitan al menos 3 jugadores conectados para iniciar.");
  }

  game.phase = "ASSIGNING";
  const events = prepareNewMatch(game);
  return logicResult(game, events);
};

export const markPlayerTurnDone = (
  gameId: string,
  playerId: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.phase !== "ROUNDS") {
    throw new GameError("No estamos en la fase de rondas.");
  }
  const connectedPlayers = getConnectedPlayers(game);
  if (connectedPlayers.length < MIN_PLAYERS) {
    game.phase = "FINISHED";
    game.winner = undefined;
    return logicResult(game);
  }

  const currentIndex = findConnectedFromIndex(game, game.currentTurnIndex);
  if (currentIndex === null) {
    game.phase = "FINISHED";
    game.winner = undefined;
    return logicResult(game);
  }
  game.currentTurnIndex = currentIndex;
  const currentPlayer = game.players[currentIndex];
  if (!currentPlayer || !currentPlayer.connected || currentPlayer.id !== playerId) {
    throw new GameError("No es tu turno en este momento.");
  }

  const events: DomainEvent[] = [];
  const nextConnectedIndex = findNextConnectedIndex(game, currentIndex);
  const isLastPlayer = nextConnectedIndex === null;

  if (isLastPlayer) {
    if (game.currentRound >= TOTAL_ROUNDS) {
      game.phase = "VOTING";
      game.currentTurnIndex = 0;
      events.push({ type: "VOTING_STARTED" });
    } else {
      game.currentRound += 1;
      const nextFirstIndex = findFirstConnectedIndex(game);
      game.currentTurnIndex = nextFirstIndex ?? 0;
      events.push({ type: "ROUND_STARTED", round: game.currentRound });
      const nextPlayer = nextFirstIndex !== null ? game.players[nextFirstIndex] : null;
      if (nextPlayer) {
        events.push({
          type: "TURN_STARTED",
          playerId: nextPlayer.id,
          playerName: nextPlayer.name,
          round: game.currentRound,
        });
      }
    }
  } else {
    game.currentTurnIndex = nextConnectedIndex;
    const nextPlayer = nextConnectedIndex !== null ? game.players[nextConnectedIndex] : null;
    if (nextPlayer) {
      events.push({
        type: "TURN_STARTED",
        playerId: nextPlayer.id,
        playerName: nextPlayer.name,
        round: game.currentRound,
      });
    }
  }

  return logicResult(game, events);
};

export const castVote = (
  gameId: string,
  voterId: string,
  votedPlayerId: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.phase !== "VOTING") {
    throw new GameError("Aún no estamos votando.");
  }
  const voter = game.players.find((player) => player.id === voterId);
  if (!voter) {
    throw new GameError("No formas parte de esta partida.");
  }
  if (voter.role === "IMPOSTOR") {
    throw new GameError("El impostor no vota, debe escribir su conjetura.");
  }
  const candidate = game.players.find((player) => player.id === votedPlayerId);
  if (!candidate) {
    throw new GameError("Jugador objetivo inválido.");
  }
  if (candidate.id === voter.id) {
    throw new GameError("No puedes votar por ti mismo.");
  }

  game.votes[voterId] = votedPlayerId;
  const events: DomainEvent[] = [];
  const resultEvent = maybeResolveResults(game);
  if (resultEvent) {
    events.push(resultEvent);
  }

  return logicResult(game, events);
};

export const setImpostorGuess = (
  gameId: string,
  playerId: string,
  guess: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.phase !== "VOTING") {
    throw new GameError("Aún no puedes adivinar.");
  }

  const player = game.players.find((p) => p.id === playerId);
  if (!player || player.role !== "IMPOSTOR") {
    throw new GameError("Solo el impostor puede adivinar.");
  }
  const cleanGuess = guess.trim();
  if (!cleanGuess) {
    throw new GameError("Debes escribir una palabra.");
  }
  game.impostorGuess = cleanGuess;

  const events: DomainEvent[] = [];
  const resultEvent = maybeResolveResults(game);
  if (resultEvent) {
    events.push(resultEvent);
  }

  return logicResult(game, events);
};

export const restartGame = (
  gameId: string,
  requesterId: string,
  wordCategoryId?: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.hostId !== requesterId) {
    throw new GameError("Solo el host puede reiniciar.");
  }
  if (game.phase !== "RESULTS") {
    throw new GameError("Primero deben terminar la partida actual.");
  }
  const connectedPlayers = getConnectedPlayers(game);
  if (connectedPlayers.length < MIN_PLAYERS) {
    throw new GameError("Se necesitan al menos 3 jugadores conectados para reiniciar.");
  }

  const categorySelection = resolveCategorySelection(
    wordCategoryId ?? game.wordCategoryId ?? undefined,
  );
  game.wordCategoryId = categorySelection.id;
  game.wordCategoryName = categorySelection.name;

  const events = prepareNewMatch(game);
  return logicResult(game, events);
};

export const reshuffleRolesAndWords = (
  gameId: string,
  requesterId: string,
): GameLogicResult => {
  const game = ensureGame(gameId);
  if (game.hostId !== requesterId) {
    throw new GameError("Solo el host puede reasignar roles y palabras.");
  }
  if (game.phase === "LOBBY") {
    throw new GameError("Necesitas iniciar la partida primero.");
  }
  const connectedPlayers = getConnectedPlayers(game);
  if (connectedPlayers.length < MIN_PLAYERS) {
    throw new GameError("Se necesitan al menos 3 jugadores conectados.");
  }

  const events = prepareNewMatch(game);
  return logicResult(game, events);
};

export const leaveGame = (
  gameId: string,
  playerId: string,
  options: { disconnectOnly?: boolean } = {},
): GameLogicResult | null => {
  const disconnectOnly = options.disconnectOnly ?? false;
  const game = getGame(gameId);
  if (!game) {
    return null;
  }
  const playerIndex = game.players.findIndex((player) => player.id === playerId);
  if (playerIndex === -1) {
    return logicResult(game);
  }

  const leavingHostId = game.players[playerIndex].id === game.hostId ? game.hostId : null;

  if (disconnectOnly) {
    const canRemoveCompletely = game.players.length - 1 >= MIN_PLAYERS;
    if (canRemoveCompletely) {
      game.players.splice(playerIndex, 1);
      if (playerIndex <= game.currentTurnIndex && game.currentTurnIndex > 0) {
        game.currentTurnIndex -= 1;
      }
    } else {
      game.players[playerIndex].connected = false;
    }
  } else {
    game.players.splice(playerIndex, 1);
    if (playerIndex <= game.currentTurnIndex && game.currentTurnIndex > 0) {
      game.currentTurnIndex -= 1;
    }
  }

  // Remove votes involving this player.
  Object.keys(game.votes).forEach((key) => {
    if (key === playerId || game.votes[key] === playerId) {
      delete game.votes[key];
    }
  });

  if (!game.players.length) {
    deleteGame(gameId);
    return null;
  }

  if (leavingHostId) {
    transferHostToNextPlayer(game, leavingHostId);
  }

  const connectedCount = getConnectedPlayers(game).length;
  if (game.phase !== "LOBBY" && connectedCount < MIN_PLAYERS) {
    game.phase = "FINISHED";
    game.winner = undefined;
  }

  if (game.currentTurnIndex >= game.players.length) {
    game.currentTurnIndex = 0;
  }

  const alignedTurnIndex = findConnectedFromIndex(game, game.currentTurnIndex);
  if (alignedTurnIndex !== null) {
    game.currentTurnIndex = alignedTurnIndex;
  }

  return logicResult(game);
};

const updateStatsAfterResults = (
  game: GameState,
  impostor: Player,
  impostorCaught: boolean,
  guessMatches: boolean,
): void => {
  game.players.forEach((player) => {
    const stats = ensureStatsForPlayer(game, player);
    stats.matchesPlayed += 1;

    if (player.id === impostor.id) {
      stats.impostorCount += 1;
      if (impostorCaught) {
        stats.caughtCount += 1;
      }
      if (guessMatches) {
        stats.correctGuesses += 1;
      }
      if (game.winner === "IMPOSTOR") {
        stats.winsAsImpostor += 1;
      } else if (game.winner === "DRAW") {
        stats.drawCount += 1;
      }
    } else {
      if (game.winner === "CIVILS") {
        stats.winsAsCivil += 1;
      } else if (game.winner === "DRAW") {
        stats.drawCount += 1;
      }
    }
  });
};

const maybeResolveResults = (game: GameState): DomainEvent | undefined => {
  if (game.phase !== "VOTING") {
    return undefined;
  }
  const voters = game.players.filter(
    (player) => player.role !== "IMPOSTOR" && player.connected,
  );
  const completedVotes = voters.filter((player) => Boolean(game.votes[player.id]));
  if (completedVotes.length < voters.length) {
    return undefined;
  }
  const impostor = game.players.find((player) => player.role === "IMPOSTOR");
  if (!impostor) {
    throw new GameError("No se asignó impostor.");
  }

  const voteCounts: Record<string, number> = {};
  Object.values(game.votes).forEach((targetId) => {
    if (!targetId) return;
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  });

  let topVotes = 0;
  let topPlayerId: string | undefined;
  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > topVotes) {
      topVotes = count;
      topPlayerId = playerId;
    }
  });

  const hasMajority = topVotes > voters.length / 2;
  const impostorCaught = hasMajority && topPlayerId === impostor.id;

  const guessMatches =
    typeof game.impostorGuess === "string" &&
    !!game.civilWord &&
    normalizeWord(game.impostorGuess) === normalizeWord(game.civilWord);

  if (impostorCaught && !guessMatches) {
    game.winner = "CIVILS";
  } else if (impostorCaught && guessMatches) {
    game.winner = "DRAW";
  } else {
    game.winner = "IMPOSTOR";
  }

  game.phase = "RESULTS";
  updateStatsAfterResults(game, impostor, impostorCaught, guessMatches);
  return {
    type: "RESULTS_READY",
    winner: game.winner,
    impostorId: impostor.id,
    impostorGuessCorrect: guessMatches,
  };
};
