import type { SerializedGameState, Winner } from "../domain/gameTypes";

export interface AckPayload {
  ok: boolean;
  gameId?: string;
  error?: string;
}

export type AckResponse = (payload: AckPayload) => void;

export interface ClientToServerEvents {
  createGame: (
    payload: {
      hostName: string;
      maxPlayers: number;
      password?: string;
      wordCategoryId?: string;
    },
    ack?: AckResponse,
  ) => void;
  joinGame: (
    payload: { gameId: string; playerName: string; password?: string },
    ack?: AckResponse,
  ) => void;
  startGame: (payload: { gameId: string }) => void;
  playerReadyForRound: (payload: { gameId: string }) => void;
  castVote: (
    payload: { gameId: string; votedPlayerId: string },
    ack?: AckResponse,
  ) => void;
  impostorGuess: (
    payload: { gameId: string; guess: string },
    ack?: AckResponse,
  ) => void;
  requestRestart: (payload: { gameId: string; wordCategoryId?: string }) => void;
  reshuffleGame: (payload: { gameId: string }, ack?: AckResponse) => void;
  leaveGame: (payload: { gameId: string }) => void;
  requestState: (payload: { gameId: string }) => void;
}

export interface ServerToClientEvents {
  gameCreated: (payload: { gameId: string }) => void;
  gameUpdated: (state: SerializedGameState) => void;
  roundStarted: (payload: { round: number }) => void;
  nextPlayerTurn: (payload: {
    playerId: string;
    playerName: string;
    round: number;
  }) => void;
  votingStarted: () => void;
  resultAnnounced: (payload: {
    winner?: Winner;
    impostorId: string;
    impostorGuessCorrect: boolean;
  }) => void;
  error: (payload: { message: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  gameId?: string;
}
