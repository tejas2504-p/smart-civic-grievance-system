import { io } from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const SERVER_URL = getSocketUrl();

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
