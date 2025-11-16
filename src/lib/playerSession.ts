"use client";

export interface StoredSession {
  gameId: string;
  playerName: string;
  password?: string;
  playerId?: string;
}

const NAME_KEY = "impostor:lastName";
const SESSION_KEY = "impostor:lastSession";

const safeExecute = (action: () => void) => {
  try {
    if (typeof window === "undefined") return;
    action();
  } catch {
    // Ignore storage failures (e.g. disabled cookies).
  }
};

export const rememberPlayerName = (name: string) =>
  safeExecute(() => window.localStorage.setItem(NAME_KEY, name));

export const loadRememberedName = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
};

export const saveLastSession = (session: StoredSession) =>
  safeExecute(() => window.localStorage.setItem(SESSION_KEY, JSON.stringify(session)));

export const loadLastSession = (): StoredSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed?.gameId || !parsed?.playerName) return null;
    return {
      gameId: parsed.gameId,
      playerName: parsed.playerName,
      password: parsed.password || undefined,
      playerId: parsed.playerId || undefined,
    };
  } catch {
    return null;
  }
};

export const clearLastSession = () =>
  safeExecute(() => window.localStorage.removeItem(SESSION_KEY));
