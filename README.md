# Socket Base Client JS

A simple, Supabase-style WebSocket client library for the Socket Base API.

## Installation

```bash
npm install socket-base-client-js
```

## Quick Start

```javascript
import { createClient } from 'socket-base-client-js';

// Create a client (auto-connects by default)
const client = createClient({
  url: 'wss://api.socket-base.com', // optional, defaults to this
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
  autoReconnect: true, // optional, defaults to true
});

// Listen to events
client.on('open', () => {
  console.log('Connected!');
});

client.on('message', ({ room, payload, from, timestamp }) => {
  console.log('Message received:', { room, payload, from, timestamp });
});

client.on('error', (error) => {
  console.error('Error:', error);
});

// Join a room
await client.join('chat-room');

// Send a message
client.send('chat-room', 'Hello, world!');

// Leave a room
await client.leave('chat-room');

// Broadcast to all clients
client.broadcast('System announcement');

// Close connection
client.close();
```

## API Reference

### `createClient(config)`

Creates a new Socket Base client instance.

**Parameters:**
- `config.url` (string, optional): WebSocket server URL. Default: `'wss://api.socket-base.com'`
- `config.hash` (string, required): Your project hash
- `config.jwt` (string, required): JWT token for authentication
- `config.autoReconnect` (boolean, optional): Enable auto-reconnect. Default: `true`
- `config.autoConnect` (boolean, optional): Auto-connect on creation. Default: `true`
- `config.maxReconnectAttempts` (number, optional): Maximum reconnect attempts. Default: `5`
- `config.reconnectDelay` (number, optional): Reconnect delay in ms. Default: `1000`

**Returns:** `SocketBaseClient` instance

### Client Methods

#### `connect()`

Manually connect to the WebSocket server. Returns a Promise.

```javascript
await client.connect();
```

#### `join(room)`

Join a room to receive messages. Returns a Promise that resolves when joined.

```javascript
await client.join('chat-room');
```

#### `leave(room)`

Leave a room. Returns a Promise that resolves when left.

```javascript
await client.leave('chat-room');
```

#### `send(room, payload)`

Send a message to a room. You must be a member of the room.

```javascript
client.send('chat-room', { text: 'Hello!', user: 'John' });
```

#### `broadcast(payload)`

Broadcast a message to all clients in the project (regardless of room membership).

```javascript
client.broadcast({ type: 'announcement', message: 'Server maintenance in 5 minutes' });
```

#### `on(event, callback)`

Subscribe to events. Returns an unsubscribe function.

**Events:**
- `'open'` - Connection opened
- `'close'` - Connection closed
- `'error'` - Error occurred
- `'message'` - Message received in a room
- `'joined'` - Successfully joined a room
- `'left'` - Successfully left a room
- `'broadcast'` - Broadcast message received

```javascript
const unsubscribe = client.on('message', (data) => {
  console.log('Message:', data);
});

// Later, unsubscribe
unsubscribe();
```

#### `close()`

Close the WebSocket connection and disable auto-reconnect.

```javascript
client.close();
```

#### `getConnectionStatus()`

Get the current connection status.

```javascript
const isConnected = client.getConnectionStatus();
```

## Usage Examples

### Basic Chat Room

```javascript
import { createClient } from 'socket-base-client-js';

const client = createClient({
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
});

// Wait for connection
client.on('open', async () => {
  // Join a room
  await client.join('general');
  
  // Send a message
  client.send('general', 'Hello everyone!');
});

// Listen for messages
client.on('message', ({ room, payload }) => {
  if (room === 'general') {
    console.log('New message:', payload);
  }
});
```

### Multiple Rooms

```javascript
const client = createClient({
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
});

client.on('open', async () => {
  // Join multiple rooms
  await Promise.all([
    client.join('room-1'),
    client.join('room-2'),
    client.join('room-3'),
  ]);
});

client.on('message', ({ room, payload }) => {
  switch (room) {
    case 'room-1':
      // Handle room-1 messages
      break;
    case 'room-2':
      // Handle room-2 messages
      break;
    case 'room-3':
      // Handle room-3 messages
      break;
  }
});
```

### Error Handling

```javascript
const client = createClient({
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
});

client.on('error', (error) => {
  if (error.type === 'connection_error') {
    console.error('Connection failed:', error);
  } else if (error.type === 'server_error') {
    console.error('Server error:', error.message);
  } else if (error.type === 'parse_error') {
    console.error('Failed to parse message:', error);
  }
});

// Handle join errors
try {
  await client.join('chat-room');
} catch (error) {
  console.error('Failed to join room:', error);
}
```

### Manual Connection Control

```javascript
const client = createClient({
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
  autoConnect: false, // Don't auto-connect
});

// Connect manually
await client.connect();

// Later, disconnect
client.close();
```

## License

ISC

