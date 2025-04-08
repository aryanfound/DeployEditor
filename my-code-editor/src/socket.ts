import { io, Socket } from "socket.io-client";

const token = localStorage.getItem("token");

// Define the socket type for better TypeScript support

export const socket: Socket = io(`http://localhost:5001?`, {
  query: { token }, // Send token with connection
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



export function useFilesListener(setChange) {

    const handleFilesUpdated = (updatedFiles) => {
      setChange(false) // Update state with new files
    };

    socket.on('filesUpdated', handleFilesUpdated);

    return () => {
      socket.off('filesUpdated', handleFilesUpdated);
    };
 
}
export default socket;
