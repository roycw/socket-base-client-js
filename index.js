/**
 * Socket Base Client - A simple WebSocket client for Socket Base API
 * Similar to Supabase's client pattern
 */

class SocketBaseClient {
  constructor(config) {
    this.url = config.url || 'wss://api.socket-base.com';
    this.hash = config.hash;
    this.jwt = config.jwt;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 1000;
    this.autoReconnect = config.autoReconnect !== false; // default true
    this.isConnecting = false;
    this.isConnected = false;
    this.pendingMessages = [];
    this.joinPromises = new Map();
    this.leavePromises = new Map();
  }

  /**
   * Connect to the WebSocket server
   * @returns {Promise<void>}
   */
  connect() {
    if (this.isConnecting || this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      const wsUrl = `${this.url}/ws/${this.hash}?jwt=${encodeURIComponent(this.jwt)}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = (event) => {
          this.isConnecting = false;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('open', event);
          
          // Send any pending messages
          while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift();
            this.ws.send(JSON.stringify(msg));
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.emit('error', { type: 'parse_error', error, raw: event.data });
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          this.emit('error', { type: 'connection_error', error });
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.isConnected = false;
          this.emit('close', event);

          // Auto-reconnect if enabled
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connect().catch(() => {
                // Reconnection failed, will retry on next attempt
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  handleMessage(message) {
    const { type, room, payload, message: errorMessage } = message;

    switch (type) {
      case 'joined':
        this.resolvePromise(this.joinPromises, room, { success: true, room });
        this.emit('joined', { room });
        break;

      case 'left':
        this.resolvePromise(this.leavePromises, room, { success: true, room });
        this.emit('left', { room });
        break;

      case 'message':
        this.emit('message', { room, payload, from: message.from, timestamp: message.timestamp });
        break;

      case 'broadcast':
        this.emit('broadcast', { payload, from: message.from });
        break;

      case 'error':
        // Resolve any pending promises with error
        this.rejectAllPromises(this.joinPromises, new Error(errorMessage || 'Unknown error'));
        this.rejectAllPromises(this.leavePromises, new Error(errorMessage || 'Unknown error'));
        this.emit('error', { type: 'server_error', message: errorMessage });
        break;

      default:
        this.emit('message', message);
    }
  }

  /**
   * Resolve a promise from a map
   * @private
   */
  resolvePromise(promiseMap, key, value) {
    const promise = promiseMap.get(key);
    if (promise) {
      promise.resolve(value);
      promiseMap.delete(key);
    }
  }

  /**
   * Reject all promises in a map
   * @private
   */
  rejectAllPromises(promiseMap, error) {
    for (const [key, promise] of promiseMap.entries()) {
      promise.reject(error);
      promiseMap.delete(key);
    }
  }

  /**
   * Send a message through the WebSocket
   * @private
   */
  sendMessage(message) {
    if (!this.isConnected) {
      if (this.autoReconnect) {
        this.pendingMessages.push(message);
        this.connect();
        return;
      }
      throw new Error('WebSocket is not connected. Call connect() first or enable autoReconnect.');
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Join a room
   * @param {string} room - Room name to join
   * @returns {Promise<{success: boolean, room: string}>}
   */
  join(room) {
    if (!room) {
      return Promise.reject(new Error('Room name is required'));
    }

    return new Promise((resolve, reject) => {
      this.joinPromises.set(room, { resolve, reject });
      this.sendMessage({ type: 'join', room });
    });
  }

  /**
   * Leave a room
   * @param {string} room - Room name to leave
   * @returns {Promise<{success: boolean, room: string}>}
   */
  leave(room) {
    if (!room) {
      return Promise.reject(new Error('Room name is required'));
    }

    return new Promise((resolve, reject) => {
      this.leavePromises.set(room, { resolve, reject });
      this.sendMessage({ type: 'leave', room });
    });
  }

  /**
   * Send a message to a room
   * @param {string} room - Room name
   * @param {any} payload - Message payload
   * @returns {void}
   */
  send(room, payload) {
    if (!room) {
      throw new Error('Room name is required');
    }
    if (payload === undefined || payload === null) {
      throw new Error('Payload is required');
    }

    this.sendMessage({ type: 'message', room, payload });
  }

  /**
   * Broadcast a message to all clients
   * @param {any} payload - Message payload
   * @returns {void}
   */
  broadcast(payload) {
    if (payload === undefined || payload === null) {
      throw new Error('Payload is required');
    }

    this.sendMessage({ type: 'broadcast', payload });
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name: 'open', 'close', 'error', 'message', 'joined', 'left', 'broadcast'
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event to all listeners
   * @private
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Close the WebSocket connection
   */
  close() {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners.clear();
    this.joinPromises.clear();
    this.leavePromises.clear();
    this.pendingMessages = [];
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

/**
 * Create a Socket Base client
 * @param {Object} config - Client configuration
 * @param {string} config.url - WebSocket server URL (default: 'wss://api.socket-base.com')
 * @param {string} config.hash - Project hash (required)
 * @param {string} config.jwt - JWT token (required)
 * @param {boolean} config.autoReconnect - Enable auto-reconnect (default: true)
 * @param {number} config.maxReconnectAttempts - Maximum reconnect attempts (default: 5)
 * @param {number} config.reconnectDelay - Reconnect delay in ms (default: 1000)
 * @returns {SocketBaseClient}
 */
export function createClient(config) {
  if (!config.hash) {
    throw new Error('Project hash is required');
  }
  if (!config.jwt) {
    throw new Error('JWT token is required');
  }

  const client = new SocketBaseClient(config);
  
  // Auto-connect by default
  if (config.autoConnect !== false) {
    client.connect().catch(error => {
      console.error('Failed to connect:', error);
    });
  }

  return client;
}

// Default export
export default { createClient };

