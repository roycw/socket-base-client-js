/**
 * Example usage of Socket Base Client
 * 
 * This is a demonstration file showing how to use the client library.
 * In a real application, you would import from the npm package.
 */

import { createClient } from './index.js';

// Example 1: Basic usage
const client = createClient({
  url: 'wss://api.socket-base.com',
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
});

// Listen for connection
client.on('open', () => {
  console.log('✅ Connected to Socket Base');
});

// Listen for messages
client.on('message', ({ room, payload, from, timestamp }) => {
  console.log(`📨 Message in ${room} from ${from}:`, payload);
});

// Listen for errors
client.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Example 2: Join a room and send messages
async function chatExample() {
  try {
    // Wait for connection
    await client.connect();
    
    // Join a room
    await client.join('general');
    console.log('✅ Joined room: general');
    
    // Send a message
    client.send('general', { text: 'Hello, world!', user: 'John' });
    
    // Leave the room after 10 seconds
    setTimeout(async () => {
      await client.leave('general');
      console.log('👋 Left room: general');
    }, 10000);
  } catch (error) {
    console.error('Failed to join room:', error);
  }
}

// Example 3: Broadcast to all clients
client.on('open', () => {
  client.broadcast({ type: 'announcement', message: 'Server is online' });
});

// Example 4: Handle multiple rooms
async function multiRoomExample() {
  await client.connect();
  
  // Join multiple rooms
  await Promise.all([
    client.join('room-1'),
    client.join('room-2'),
    client.join('room-3'),
  ]);
  
  // Listen for messages from specific rooms
  client.on('message', ({ room, payload }) => {
    switch (room) {
      case 'room-1':
        console.log('Room 1 message:', payload);
        break;
      case 'room-2':
        console.log('Room 2 message:', payload);
        break;
      case 'room-3':
        console.log('Room 3 message:', payload);
        break;
    }
  });
}

// Example 5: Manual connection control
const manualClient = createClient({
  hash: 'your-project-hash',
  jwt: 'your-jwt-token',
  autoConnect: false, // Don't auto-connect
});

// Connect manually when ready
setTimeout(async () => {
  await manualClient.connect();
  await manualClient.join('my-room');
}, 5000);

// Clean up
process.on('SIGINT', () => {
  client.close();
  manualClient.close();
  process.exit(0);
});

