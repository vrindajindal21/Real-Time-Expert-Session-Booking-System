import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      const SOCKET_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? window.location.origin
        : 'http://localhost:5001';

      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        jsonp: false,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('slot-booked', (data) => {
        this.emit('slot-booked', data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinExpertRoom(expertId) {
    if (this.socket) {
      this.socket.emit('join-expert-room', expertId);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

export default new SocketService();
