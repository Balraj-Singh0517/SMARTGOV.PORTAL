import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketMessage, WebSocketEventType, WebSocketContextValue } from '../types';

const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  connectionStatus: 'disconnected',
  onlineCount: 1,
  lastMessage: null,
  sendMessage: () => {},
  subscribe: () => () => {},
  reconnect: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
  onMessage?: (message: WebSocketMessage) => void;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, onMessage }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isManuallyClosedRef = useRef<boolean>(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const subscribersRef = useRef<Map<string, Set<(message: WebSocketMessage) => void>>>(new Map());

  const subscribe = useCallback((eventType: WebSocketEventType | string, callback: (message: WebSocketMessage) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    return () => {
      const set = subscribersRef.current.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          subscribersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Heartbeat ping every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', payload: { time: Date.now() }, timestamp: Date.now() }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          if (message.type === 'presence:update') {
            if (message.payload && typeof message.payload.onlineCount === 'number') {
              setOnlineCount(message.payload.onlineCount);
            }
          } else if (message.type === 'init:sync') {
            if (message.payload && typeof message.payload.onlineCount === 'number') {
              setOnlineCount(message.payload.onlineCount);
            }
          }

          if (onMessageRef.current) {
            onMessageRef.current(message);
          }

          // Notify subscribed components
          const specific = subscribersRef.current.get(message.type);
          if (specific) {
            specific.forEach((cb) => {
              try {
                cb(message);
              } catch (err) {
                // Protect loop
              }
            });
          }
          const wildcard = subscribersRef.current.get('*');
          if (wildcard) {
            wildcard.forEach((cb) => {
              try {
                cb(message);
              } catch (err) {
                // Protect loop
              }
            });
          }
        } catch (err) {
          // Ignore non-JSON or invalid messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Auto reconnect unless manually closed
        if (!isManuallyClosedRef.current) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Handled in onclose
      };
    } catch (e) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectionStatus,
        onlineCount,
        lastMessage,
        sendMessage,
        subscribe,
        reconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
