"use client";

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socketEvents";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> => {
  if (!socket) {
    socket = io({
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
      timeout: 10_000,
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

