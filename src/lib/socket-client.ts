"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns (or creates) the singleton Socket.io client.
 * Call this inside useEffect only.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", {
      path: "/api/socket",
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}
