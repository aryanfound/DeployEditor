import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CodeSpaceInfo } from '../../globaltool';

export default function create_YSocket(ydoc) {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username') || 'anonymous';

  const yprovider = new WebsocketProvider(
    "ws://localhost:5003",
    CodeSpaceInfo.currCodeSpaceId,
    ydoc,
    { params: { token } }
  );

  // Initial awareness
  yprovider.awareness.setLocalState({
    user: {
      name: username,
      isAdmin: false
    },
    disconnectEvery: { disconnect: false }
  });

  // Disconnect monitor
  yprovider.awareness.on('change', ({ added, updated, removed }) => {
    const allStates = Array.from(yprovider.awareness.getStates().values());

    const shouldDisconnect = allStates.some(
      state => state?.disconnectEvery?.disconnect === true
    );

    if (shouldDisconnect) {
      console.log('⛔ Disconnect triggered by awareness');

      // Optional delay before disconnect to ensure UI update
      setTimeout(() => {
        if (yprovider.ws?.readyState === WebSocket.OPEN) {
          yprovider.disconnect();
          console.log('Disconnected from Yjs server');
        }
      }, 1000);
    }
  });

  // Connection success
  yprovider.on('status', ({ status }) => {
    console.log(`📡 Yjs connection status: ${status}`);
  });

  // Confirm sync
  yprovider.on('synced', (isSynced) => {
    if (isSynced && yprovider.ws?.readyState === WebSocket.OPEN) {
      console.log("✅ Synced with Yjs server");
      yprovider.ws.send(JSON.stringify({
        type: 'yjs-loaded',
        docName: CodeSpaceInfo.currCodeSpaceId,
        username
      }));
    }
  });

  return yprovider;
}
