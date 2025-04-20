import { io } from 'socket.io-client'
const token=localStorage.getItem('token')
export const clientSocket = io('http://localhost:5001', {
  autoConnect: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  query: {
    token: token, // this becomes ?token=your-token
  },
});
clientSocket.on('connect',()=>{
  console.log('connected to server')
})


clientSocket.on('notify',(data)=>{
  console.log(data)
})


export default clientSocket