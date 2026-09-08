import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    const authData = localStorage.getItem('auth');
    let token = null;
    if (authData) {
      try {
        token = JSON.parse(authData).state.user.token;
      } catch (e) {
        try { token = JSON.parse(authData).token; } catch (err) {}
      }
    }

    socket = io(SERVER_URL, {
       transports: ['websocket', 'polling'],
       autoConnect: true,
       reconnection: true,
       reconnectionAttempts: 10,
       reconnectionDelay: 2000,
       timeout: 10000,
       auth: {
         token: token
       }
     });

     socket.on('connect', () => {
       console.log('⚡ [Socket.IO Client] Connected to Real-time backend:', socket.id);
     });

     socket.on('connect_error', () => {
       // Graceful silence for local demo if server is offline
       console.warn('⚠️ [Socket.IO Client] Backend offline or reconnecting...');
     });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO Client] Disconnected:', reason);
    });
  }

  return socket;
}

export default getSocket;
