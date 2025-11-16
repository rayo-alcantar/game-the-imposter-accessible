/**
 * Shared game types used across the server, domain logic and client UI.
 * Keeping them together here makes it easy to swap the storage engine later.
 */

export type Role = "IMPOSTOR" | "CIVIL";

export type GamePhase =
  | "LOBBY"
  | "ASSIGNING"
  | "ROUNDS"
  | "VOTING"
  | "RESULTS"
  | "FINISHED";

export type Winner = "CIVILS" | "IMPOSTOR" | "DRAW";

export interface Player {
  id: string;
  name: string;
  role?: Role;
  isHost: boolean;
  connected: boolean;
  joinedAt: number;
}

export type VoteMap = Record<string, string | undefined>;

export interface PlayerStats {
  playerId: string;
  name: string;
  matchesPlayed: number;
  impostorCount: number;
  caughtCount: number;
  correctGuesses: number;
  drawCount: number;
  winsAsImpostor: number;
  winsAsCivil: number;
}

export interface SerializedPlayerStats extends PlayerStats {
  totalTriumphs: number;
}

export interface GameState {
  id: string;
  hostId: string;
  maxPlayers: number;
  password?: string;
  wordCategoryId?: string;
  wordCategoryName: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  currentTurnIndex: number;
  civilWord?: string;
  impostorWord?: string;
  votes: VoteMap;
  impostorGuess?: string;
  winner?: Winner;
  createdAt: number;
  updatedAt: number;
  playerStats: Record<string, PlayerStats>;
}

export const TOTAL_ROUNDS = 3;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

export interface WordPair {
  civil: string;
  impostor: string;
  theme: string;
}

export interface SerializedPlayerSummary {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export interface PlayerPersonalState {
  id: string;
  name: string;
  isHost: boolean;
  role?: Role;
  word?: string;
  vote?: string;
}

export interface SerializedGameState {
  gameId: string;
  phase: GamePhase;
  maxPlayers: number;
  passwordRequired: boolean;
  hostId: string;
  wordCategoryId?: string;
  wordCategoryName: string;
  players: SerializedPlayerSummary[];
  self: PlayerPersonalState;
  currentRound: number;
  totalRounds: number;
  currentTurnPlayerId?: string;
  playerCount: number;
  winner?: Winner;
  impostorGuess?: string;
  impostorName?: string;
  pendingVoters: string[];
  playerStats: SerializedPlayerStats[];
}

export type DomainEvent =
  | { type: "ROUND_STARTED"; round: number }
  | { type: "TURN_STARTED"; playerId: string; playerName: string; round: number }
  | { type: "VOTING_STARTED" }
  | {
      type: "RESULTS_READY";
      winner?: Winner;
      impostorId: string;
      impostorGuessCorrect: boolean;
    };

export interface GameLogicResult {
  game: GameState;
  events: DomainEvent[];
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}
