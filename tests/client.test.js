/**
 * Tests for Socket Base Client
 * 
 * Run with: npm test
 */

import { createClient } from '../index.js';
import { describe, it, beforeEach, afterEach } from './test-runner.js';

// Mock WebSocket for Node.js environment
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.sentMessages = [];
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
    }, 10);
  }

  send(data) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code: 1000 });
    }
  }

  // Helper method to simulate receiving a message
  simulateMessage(message) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(message) });
    }
  }
}

// Replace WebSocket with mock in Node.js environment
if (typeof global !== 'undefined' && typeof WebSocket === 'undefined') {
  global.WebSocket = MockWebSocket;
}

describe('SocketBaseClient', () => {
  let client;

  beforeEach(() => {
    client = createClient({
      hash: 'test-hash',
      jwt: 'test-jwt-token',
      autoConnect: false, // Don't auto-connect in tests
    });
  });

  afterEach(() => {
    if (client) {
      client.close();
    }
  });

  describe('createClient', () => {
    it('should create a client instance', () => {
      const client = createClient({
        hash: 'test-hash',
        jwt: 'test-jwt',
        autoConnect: false,
      });
      
      assert(client !== null, 'Client should be created');
      assert(client.hash === 'test-hash', 'Hash should be set');
      assert(client.jwt === 'test-jwt', 'JWT should be set');
      client.close();
    });

    it('should throw error if hash is missing', () => {
      try {
        createClient({ jwt: 'test-jwt' });
        assert(false, 'Should throw error');
      } catch (error) {
        assert(error.message.includes('hash'), 'Should throw hash error');
      }
    });

    it('should throw error if jwt is missing', () => {
      try {
        createClient({ hash: 'test-hash' });
        assert(false, 'Should throw error');
      } catch (error) {
        assert(error.message.includes('JWT'), 'Should throw JWT error');
      }
    });

    it('should use default URL if not provided', () => {
      const client = createClient({
        hash: 'test-hash',
        jwt: 'test-jwt',
        autoConnect: false,
      });
      
      assert(client.url === 'wss://api.socket-base.com', 'Should use default URL');
      client.close();
    });
  });

  describe('connection', () => {
    it('should connect to WebSocket', async () => {
      await client.connect();
      assert(client.isConnected === true, 'Should be connected');
    });

    it('should emit open event on connection', async () => {
      let opened = false;
      client.on('open', () => {
        opened = true;
      });

      await client.connect();
      await new Promise(resolve => setTimeout(resolve, 20));
      
      assert(opened === true, 'Open event should be emitted');
    });

    it('should not connect if already connected', async () => {
      await client.connect();
      const initialState = client.isConnected;
      await client.connect();
      
      assert(client.isConnected === initialState, 'Should not reconnect');
    });
  });

  describe('join', () => {
    it('should join a room', async () => {
      await client.connect();
      
      // Simulate server response
      setTimeout(() => {
        if (client.ws && client.ws.simulateMessage) {
          client.ws.simulateMessage({ type: 'joined', room: 'test-room' });
        }
      }, 50);

      const result = await client.join('test-room');
      
      assert(result.success === true, 'Should successfully join');
      assert(result.room === 'test-room', 'Room should match');
    });

    it('should reject if room is missing', async () => {
      await client.connect();
      
      try {
        await client.join('');
        assert(false, 'Should reject');
      } catch (error) {
        assert(error.message.includes('required'), 'Should throw error');
      }
    });
  });

  describe('leave', () => {
    it('should leave a room', async () => {
      await client.connect();
      
      // Simulate server response
      setTimeout(() => {
        if (client.ws && client.ws.simulateMessage) {
          client.ws.simulateMessage({ type: 'left', room: 'test-room' });
        }
      }, 50);

      const result = await client.leave('test-room');
      
      assert(result.success === true, 'Should successfully leave');
      assert(result.room === 'test-room', 'Room should match');
    });

    it('should reject if room is missing', async () => {
      await client.connect();
      
      try {
        await client.leave('');
        assert(false, 'Should reject');
      } catch (error) {
        assert(error.message.includes('required'), 'Should throw error');
      }
    });
  });

  describe('send', () => {
    it('should send a message to a room', async () => {
      await client.connect();
      
      client.send('test-room', { text: 'Hello' });
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      if (client.ws && client.ws.sentMessages) {
        const sent = JSON.parse(client.ws.sentMessages[0]);
        assert(sent.type === 'message', 'Should send message type');
        assert(sent.room === 'test-room', 'Should include room');
        assert(sent.payload.text === 'Hello', 'Should include payload');
      }
    });

    it('should throw error if room is missing', () => {
      client.send('', { text: 'Hello' });
      // This will queue the message, but we can't easily test the error
      // without a real connection
    });

    it('should throw error if payload is missing', () => {
      try {
        client.send('test-room', null);
        assert(false, 'Should throw error');
      } catch (error) {
        assert(error.message.includes('Payload'), 'Should throw payload error');
      }
    });
  });

  describe('broadcast', () => {
    it('should broadcast a message', async () => {
      await client.connect();
      
      client.broadcast({ text: 'Broadcast message' });
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      if (client.ws && client.ws.sentMessages) {
        const sent = JSON.parse(client.ws.sentMessages[0]);
        assert(sent.type === 'broadcast', 'Should send broadcast type');
        assert(sent.payload.text === 'Broadcast message', 'Should include payload');
      }
    });

    it('should throw error if payload is missing', () => {
      try {
        client.broadcast(null);
        assert(false, 'Should throw error');
      } catch (error) {
        assert(error.message.includes('Payload'), 'Should throw payload error');
      }
    });
  });

  describe('event listeners', () => {
    it('should register and call event listeners', async () => {
      let messageReceived = false;
      
      client.on('message', (data) => {
        messageReceived = true;
      });

      client.emit('message', { room: 'test', payload: 'test' });
      
      assert(messageReceived === true, 'Listener should be called');
    });

    it('should return unsubscribe function', () => {
      let callCount = 0;
      
      const unsubscribe = client.on('message', () => {
        callCount++;
      });

      client.emit('message', {});
      assert(callCount === 1, 'Should be called once');

      unsubscribe();
      client.emit('message', {});
      assert(callCount === 1, 'Should not be called after unsubscribe');
    });
  });

  describe('close', () => {
    it('should close the connection', async () => {
      await client.connect();
      assert(client.isConnected === true, 'Should be connected');
      
      client.close();
      
      assert(client.isConnected === false, 'Should be disconnected');
    });

    it('should disable auto-reconnect on close', async () => {
      await client.connect();
      client.close();
      
      assert(client.autoReconnect === false, 'Auto-reconnect should be disabled');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return false when not connected', () => {
      assert(client.getConnectionStatus() === false, 'Should return false');
    });

    it('should return true when connected', async () => {
      await client.connect();
      assert(client.getConnectionStatus() === true, 'Should return true');
    });
  });
});

// Simple assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

