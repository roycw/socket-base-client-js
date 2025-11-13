/**
 * Socket Base Client TypeScript Definitions
 */

export interface SocketBaseClientConfig {
  /** WebSocket server URL (default: 'wss://api.socket-base.com') */
  url?: string;
  /** Project hash (required) */
  hash: string;
  /** JWT token (required) */
  jwt: string;
  /** Enable auto-reconnect (default: true) */
  autoReconnect?: boolean;
  /** Auto-connect on client creation (default: true) */
  autoConnect?: boolean;
  /** Maximum reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Reconnect delay in milliseconds (default: 1000) */
  reconnectDelay?: number;
}

export interface JoinResult {
  success: boolean;
  room: string;
}

export interface LeaveResult {
  success: boolean;
  room: string;
}

export interface MessageEvent {
  room: string;
  payload: any;
  from?: string;
  timestamp?: number;
}

export interface BroadcastEvent {
  payload: any;
  from?: string;
}

export interface ErrorEvent {
  type: string;
  message?: string;
  error?: Error;
  raw?: string;
}

export type EventType = 'open' | 'close' | 'error' | 'message' | 'joined' | 'left' | 'broadcast';
export type EventCallback<T = any> = (data: T) => void;
export type UnsubscribeFunction = () => void;

export class SocketBaseClient {
  constructor(config: SocketBaseClientConfig);

  /** Connect to the WebSocket server */
  connect(): Promise<void>;

  /** Join a room */
  join(room: string): Promise<JoinResult>;

  /** Leave a room */
  leave(room: string): Promise<LeaveResult>;

  /** Send a message to a room */
  send(room: string, payload: any): void;

  /** Broadcast a message to all clients */
  broadcast(payload: any): void;

  /** Subscribe to events */
  on(event: 'open', callback: EventCallback<Event>): UnsubscribeFunction;
  on(event: 'close', callback: EventCallback<CloseEvent>): UnsubscribeFunction;
  on(event: 'error', callback: EventCallback<ErrorEvent>): UnsubscribeFunction;
  on(event: 'message', callback: EventCallback<MessageEvent>): UnsubscribeFunction;
  on(event: 'joined', callback: EventCallback<{ room: string }>): UnsubscribeFunction;
  on(event: 'left', callback: EventCallback<{ room: string }>): UnsubscribeFunction;
  on(event: 'broadcast', callback: EventCallback<BroadcastEvent>): UnsubscribeFunction;
  on(event: EventType, callback: EventCallback): UnsubscribeFunction;

  /** Close the WebSocket connection */
  close(): void;

  /** Get connection status */
  getConnectionStatus(): boolean;
}

/**
 * Create a Socket Base client
 */
export function createClient(config: SocketBaseClientConfig): SocketBaseClient;

export default { createClient };

