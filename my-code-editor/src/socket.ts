import { io, Socket } from "socket.io-client";
import { WebsocketProvider } from "y-websocket";

const token = localStorage.getItem("token");

// Socket.IO connection
export const socket: Socket = io(" http://localhost:5173", {
  query: { token },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// Event listeners
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// Yjs WebsocketProvider with token query


export default { socket };
