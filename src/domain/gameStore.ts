import { GameState } from "./gameTypes";

const games = new Map<string, GameState>();
let cleanupTimer: NodeJS.Timeout | null = null;

export function createGameState(game: GameState): GameState {
  games.set(game.id, game);
  return game;
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function updateGame(game: GameState): void {
  game.updatedAt = Date.now();
  games.set(game.id, game);
}

export function deleteGame(gameId: string): void {
  games.delete(gameId);
}

export function listGames(): GameState[] {
  return Array.from(games.values());
}

export function cleanupOldGames(maxAgeMinutes = 60): void {
  const threshold = Date.now() - maxAgeMinutes * 60 * 1000;
  for (const [id, game] of games.entries()) {
    const everyoneGone =
      !game.players.length || game.players.every((player) => !player.connected);
    if (everyoneGone || game.updatedAt < threshold) {
      games.delete(id);
    }
  }
}

export function startCleanupLoop({
  intervalMs = 300_000,
  staleMinutes = 60,
} = {}): void {
  if (cleanupTimer) {
    return;
  }
  cleanupOldGames(staleMinutes);
  cleanupTimer = setInterval(() => cleanupOldGames(staleMinutes), intervalMs);
}
