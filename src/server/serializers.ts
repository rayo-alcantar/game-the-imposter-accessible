import {
  GameState,
  SerializedGameState,
  SerializedPlayerSummary,
  SerializedPlayerStats,
  TOTAL_ROUNDS,
} from "../domain/gameTypes";

export const serializeGameStateForPlayer = (
  game: GameState,
  playerId: string,
): SerializedGameState => {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error("Jugador no encontrado en la partida.");
  }

  const players: SerializedPlayerSummary[] = game.players.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    connected: p.connected,
  }));

  const assignedWord =
    player.role === "IMPOSTOR" ? game.impostorWord : game.civilWord;

  const impostor = game.players.find((p) => p.role === "IMPOSTOR");
  const revealImpostor = game.phase === "RESULTS";

  const pendingVoters =
    game.phase === "VOTING"
      ? game.players
          .filter((p) => p.role !== "IMPOSTOR" && p.connected)
          .filter((p) => !game.votes[p.id])
          .map((p) => p.name)
      : [];

  const playerStats: SerializedPlayerStats[] = game.players.map((currentPlayer) => {
    const stats =
      game.playerStats[currentPlayer.id] ??
      ({
        playerId: currentPlayer.id,
        name: currentPlayer.name,
        matchesPlayed: 0,
        impostorCount: 0,
        caughtCount: 0,
        correctGuesses: 0,
        drawCount: 0,
        winsAsImpostor: 0,
        winsAsCivil: 0,
        totalTriumphs: 0,
      } satisfies SerializedPlayerStats);
    const totalTriumphs = stats.winsAsCivil + stats.winsAsImpostor + stats.drawCount;
    return {
      ...stats,
      name: currentPlayer.name,
      playerId: currentPlayer.id,
      totalTriumphs,
    };
  });

  playerStats.sort((statsA, statsB) => {
    if (statsB.totalTriumphs !== statsA.totalTriumphs) {
      return statsB.totalTriumphs - statsA.totalTriumphs;
    }
    if (statsB.correctGuesses !== statsA.correctGuesses) {
      return statsB.correctGuesses - statsA.correctGuesses;
    }
    if (statsB.matchesPlayed !== statsA.matchesPlayed) {
      return statsB.matchesPlayed - statsA.matchesPlayed;
    }
    return statsA.name.localeCompare(statsB.name);
  });

  return {
    gameId: game.id,
    phase: game.phase,
    maxPlayers: game.maxPlayers,
    passwordRequired: Boolean(game.password),
    hostId: game.hostId,
    wordCategoryId: game.wordCategoryId,
    wordCategoryName: game.wordCategoryName,
    players,
    self: {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      role: player.role,
      word: assignedWord,
      vote: game.votes[player.id],
    },
    currentRound: game.currentRound,
    totalRounds: TOTAL_ROUNDS,
    currentTurnPlayerId:
      game.phase === "ROUNDS"
        ? game.players[game.currentTurnIndex]?.id
        : undefined,
    playerCount: game.players.length,
    winner: game.winner,
    impostorGuess:
      revealImpostor || player.role === "IMPOSTOR" ? game.impostorGuess : undefined,
    impostorName: revealImpostor ? impostor?.name : undefined,
    pendingVoters,
    playerStats,
  };
};
