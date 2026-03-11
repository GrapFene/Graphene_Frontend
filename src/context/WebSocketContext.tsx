import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getWsTicket, DirectMessage } from '../services/api';

interface WebSocketContextType {
    connected: boolean;
    error: string | null;
    lastMessage: DirectMessage | null;
    sendMessage: (toDid: string, content: string) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<DirectMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connectingRef = useRef(false);

    const connect = useCallback(async () => {
        if (connectingRef.current) return;
        
        const userStr = localStorage.getItem('graphene_user');
        if (!userStr) {
            setConnected(false);
            return;
        }

        connectingRef.current = true;
        
        try {
            setError(null);
            const { connectUrl } = await getWsTicket();
            
            const ws = new WebSocket(connectUrl);
            
            ws.onopen = () => {
                console.log('Central WebSocket connected');
                setConnected(true);
                setError(null);
                connectingRef.current = false;
                wsRef.current = ws;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'dm') {
                        setLastMessage(data as DirectMessage);
                    } else if (data.type === 'error') {
                        setError(data.reason || 'Unknown WebSocket error');
                    }
                } catch (err) {
                    console.error('Failed to parse WS message:', err);
                }
            };

            ws.onclose = (event) => {
                console.log(`Central WebSocket disconnected [${event.code}]: ${event.reason}`);
                
                // Only handle reconnection if this was the intended active socket
                if (wsRef.current === ws || connectingRef.current) {
                    setConnected(false);
                    wsRef.current = null;
                    connectingRef.current = false;

                    // If it was a purposeful close (1000) for replacement, don't auto-reconnect instantly
                    // If it's another tab kicking us out, we'll reconnect after 5s and kick them back
                    // This is still a Tab fight, but at least it's not a million connections per second.
                    const backoff = (event.code === 1000) ? 10000 : 5000;
                    reconnectTimeoutRef.current = setTimeout(connect, backoff);
                }
            };

            ws.onerror = () => {
                setError('WebSocket connection failed');
                connectingRef.current = false;
            };

        } catch (err: any) {
            console.error('Failed to get WebSocket ticket:', err);
            setError('Failed to authenticate with chat server');
            connectingRef.current = false;
            reconnectTimeoutRef.current = setTimeout(connect, 10000); 
        }
    }, []);

    useEffect(() => {
        // Initial connect
        connect();

        // Listen for auth changes to reconnect
        const handleAuth = () => connect();
        window.addEventListener('authChange', handleAuth);

        return () => {
            window.removeEventListener('authChange', handleAuth);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((toDid: string, content: string): boolean => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to chat server');
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({
                type: 'dm',
                to_did: toDid,
                content: content
            }));
            return true;
        } catch (err) {
            console.error('Failed to send message:', err);
            return false;
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{ connected, error, lastMessage, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
