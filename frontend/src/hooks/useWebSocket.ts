import { useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketConfig {
  userId: string | null;
  token: string | null;
  reconnectDelay: number;
  maxReconnectAttempts: number;
}

interface WebSocketSubscription {
  destination: string;
  callback: (message: any) => void;
}

/**
 * Custom React hook for managing WebSocket connections with STOMP protocol.
 * Automatically connects on login and disconnects on logout.
 * Handles JWT authentication and automatic reconnection.
 * 
 * Usage:
 * const { subscribe, unsubscribe, publish, isConnected } = useWebSocket();
 */
export const useWebSocket = () => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, WebSocketSubscription>>(new Map());
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.34:8080';
  const WS_URL = API_BASE_URL.replace('http', 'ws') + '/ws';

  /**
   * Connect to WebSocket server with JWT authentication
   */
  const connect = useCallback(async () => {
    try {
      // Get user data and token from AsyncStorage
      const [userDataString, tokenString] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('jwtToken')
      ]);

      if (!userDataString || !tokenString) {
        console.warn('useWebSocket: No user data or token found');
        return;
      }

      const userData = JSON.parse(userDataString);
      const token = tokenString;

      // Create STOMP client
      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          login: userData.email,
          passcode: token,
        },
        debug: (msg) => console.log('[STOMP]', msg),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: IFrame) => {
          console.log('✅ WebSocket connected:', frame);
          reconnectCountRef.current = 0;

          // Re-subscribe to all previous subscriptions
          subscriptionsRef.current.forEach((sub) => {
            subscribeToDestination(client, sub.destination, sub.callback);
          });
        },
        onStompError: (frame: IFrame) => {
          console.error('❌ STOMP error:', frame);
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
        onWebSocketError: (error) => {
          console.error('❌ WebSocket error:', error);
        },
        onWebSocketClose: () => {
          console.log('WebSocket closed');
          handleReconnect();
        },
      });

      // Attach SockJS fallback
      client.webSocketFactory = () => {
        return new SockJS(WS_URL);
      };

      clientRef.current = client;
      client.activate();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [WS_URL]);

  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = useCallback(() => {
    const MAX_RECONNECT_ATTEMPTS = 5;
    const INITIAL_DELAY = 3000;

    if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
      const delay = INITIAL_DELAY * Math.pow(2, reconnectCountRef.current);
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectCountRef.current += 1;
        connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      Alert.alert(
        'Connection Error',
        'Failed to maintain WebSocket connection. Please refresh the app.'
      );
    }
  }, [connect]);

  /**
   * Subscribe to a destination with a callback
   */
  const subscribeToDestination = (
    client: Client,
    destination: string,
    callback: (message: any) => void
  ) => {
    if (!client.active) {
      console.warn(`Client not active, cannot subscribe to ${destination}`);
      return;
    }

    try {
      client.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          console.error(`Failed to parse message from ${destination}:`, e);
        }
      });
      console.log(`✅ Subscribed to ${destination}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${destination}:`, error);
    }
  };

  /**
   * Subscribe to a destination
   * Stores subscription for re-connection
   */
  const subscribe = useCallback(
    (destination: string, callback: (message: any) => void) => {
      // Store subscription
      subscriptionsRef.current.set(destination, { destination, callback });

      // Subscribe if already connected
      if (clientRef.current?.active) {
        subscribeToDestination(clientRef.current, destination, callback);
      } else {
        console.warn(`Cannot subscribe to ${destination}: WebSocket not connected yet`);
      }
    },
    []
  );

  /**
   * Unsubscribe from a destination
   */
  const unsubscribe = useCallback((destination: string) => {
    subscriptionsRef.current.delete(destination);
    console.log(`Unsubscribed from ${destination}`);
  }, []);

  /**
   * Publish a message to a destination
   */
  const publish = useCallback(
    (destination: string, body: any) => {
      if (!clientRef.current?.active) {
        console.error('WebSocket not connected, cannot publish');
        return;
      }

      try {
        clientRef.current.publish({
          destination,
          body: JSON.stringify(body),
        });
        console.log(`📤 Published to ${destination}:`, body);
      } catch (error) {
        console.error(`Failed to publish to ${destination}:`, error);
      }
    },
    []
  );

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (clientRef.current?.active) {
      clientRef.current.deactivate();
      console.log('WebSocket disconnected');
    }
  }, []);

  /**
   * Check if WebSocket is connected
   */
  const isConnected = useCallback(() => {
    return clientRef.current?.active ?? false;
  }, []);

  /**
   * Initialize connection on component mount (listen for login)
   */
  useEffect(() => {
    const checkAndConnect = async () => {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        connect();
      }
    };

    checkAndConnect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    subscribe,
    unsubscribe,
    publish,
    disconnect,
    isConnected,
    connect,
  };
};

export default useWebSocket;
