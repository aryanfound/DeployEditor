// roomAwareness.js
const WebSocket = require('ws');

function setupRoomAwarenessHandler(room) {
  console.log('Setting up awareness handler...');

  if (!room || !room.awareness || !room.connections) {
    console.error('❌ Invalid room object provided to awareness handler');
    return;
  }

  console.log(`👀 Setting up awareness for room ${room.name || 'unknown'}`);

  const awarenessHandler = ({ added, updated, removed }) => {
    try {
      const states = Array.from(room.awareness.getStates().values());

      const shouldDisconnect = states.some(
        state => state?.disconnectEvery?.disconnect === true
      );

      if (shouldDisconnect) {
        console.log(`🛑 Admin requested disconnection in room "${room.name}"`);

        // Disconnect all clients
        for (const conn of room.connections.values()) {
          if (conn.readyState === WebSocket.OPEN) {
            conn.close(4000, '🔌 Disconnected by admin awareness update');
          }
        }

        // Clear awareness states for all users
        for (const clientId of room.awareness.getStates().keys()) {
          room.awareness.removeState(clientId);
        }

        // Optionally reset server-side awareness
        room.awareness.setLocalState(null);
      }
    } catch (err) {
      console.error('❌ Awareness handler error:', err);
    }
  };

  room.awareness.on('change', awarenessHandler);

  return () => {
    room.awareness.off('change', awarenessHandler);
  };
}

module.exports = setupRoomAwarenessHandler;
