import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CodeSpaceInfo } from '../../globaltool';
const token = localStorage.getItem('token');

export default function create_YSocket(ydoc) {
  const yprovider = new WebsocketProvider(
    "http://localhost:5003/",
    CodeSpaceInfo.currCodeSpaceId,
    ydoc,
    { params: { token } }
  );

  const awareness = yprovider.awareness;
  const nameuser = localStorage.getItem('username');
  console.log('nameuser', nameuser);

  // Set local user state (you can customize this)
  awareness.setLocalStateField('user', {
    name: nameuser,
    color: '#00bfff',  // Blue
    cursor: { x: 0, y: 0 } // Optional: for shared cursors
  });

  return yprovider;
}