import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../src/api/config';

const BASE_WS_URL = API_BASE_URL.replace('http', 'ws') + '/ws-native';

export interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
}


function buildFrame(command: string, headers: Record<string, string> = {}, body = ''): ArrayBuffer {
    let frame = command + '\n';
    for (const [k, v] of Object.entries(headers)) {
        frame += `${k}:${v}\n`;
    }
    frame += '\n' + body + '\u0000';

    // Encode to binary so React Native doesn't strip the NULL byte
    const encoder = new TextEncoder();
    return encoder.encode(frame).buffer;
}

interface StompFrame {
    command: string;
    headers: Record<string, string>;
    body: string;
}

function parseFrame(raw: string): StompFrame | null {
    // Remove trailing NULL
    const data = raw.replace(/\0$/, '');
    const divider = data.indexOf('\n\n');
    if (divider === -1) return null;

    const headerBlock = data.substring(0, divider);
    const body = data.substring(divider + 2);
    const lines = headerBlock.split('\n');
    const command = lines[0];
    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
        const colon = lines[i].indexOf(':');
        if (colon > 0) {
            headers[lines[i].substring(0, colon)] = lines[i].substring(colon + 1);
        }
    }
    return { command, headers, body };
}

let subIdCounter = 0;

export const useChat = (conversationId: number | null, userId: number | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!conversationId) {
            console.log('[Chat] No conversationId, skip connect');
            return;
        }

        let isCancelled = false;
        const subId = `sub-${++subIdCounter}`;

        function connect() {
            if (isCancelled) return;
            console.log(`[Chat] Connecting to ${BASE_WS_URL} for conversation ${conversationId}`);

            const ws = new WebSocket(BASE_WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[Chat] WebSocket open, sending STOMP CONNECT');
                const connectFrame = buildFrame('CONNECT', {
                    'accept-version': '1.2,1.1,1.0',
                    'heart-beat': '10000,10000',
                });
                console.log('[Chat] Raw CONNECT frame bytes:', [...new Uint8Array(connectFrame)]);
                ws.send(connectFrame);
            };

            ws.onmessage = (event) => {
                const raw = typeof event.data === 'string' ? event.data : '';
                console.log('[Chat] Received raw:', raw.substring(0, 200));

                // Handle heartbeat (empty line)
                if (raw === '\n' || raw === '\r\n' || raw === '\u0000') {
                    return;
                }

                const frame = parseFrame(raw);
                if (!frame) {
                    console.warn('[Chat] Could not parse frame');
                    return;
                }

                console.log(`[Chat] Frame: ${frame.command}`, frame.headers);

                switch (frame.command) {
                    case 'CONNECTED':
                        console.log('[Chat] ✅ STOMP CONNECTED!');
                        setConnected(true);

                        // Subscribe to conversation topic
                        const subscribeFrame = buildFrame('SUBSCRIBE', {
                            id: subId,
                            destination: `/topic/conversation/${conversationId}`,
                        });
                        ws.send(subscribeFrame);
                        console.log(`[Chat] Subscribed to /topic/conversation/${conversationId} (${subId})`);

                        // Start heartbeat
                        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
                        heartbeatTimer.current = setInterval(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(new Uint8Array([10]));
                            }
                        }, 10000);
                        break;

                    case 'MESSAGE':
                        try {
                            const msg = JSON.parse(frame.body);
                            console.log('[Chat] Message received:', msg.id, msg.content?.substring(0, 50));
                            setMessages((prev) => {
                                if (prev.some(m => m.id === msg.id)) return prev;
                                return [...prev, msg];
                            });
                        } catch (e) {
                            console.error('[Chat] Failed to parse message body:', e);
                        }
                        break;

                    case 'ERROR':
                        console.error('[Chat] STOMP ERROR:', frame.headers.message, frame.body);
                        break;

                    default:
                        console.log('[Chat] Unhandled frame:', frame.command);
                }
            };

            ws.onerror = (event) => {
                console.error('[Chat] WebSocket error:', event);
            };

            ws.onclose = (event) => {
                console.log(`[Chat] WebSocket closed: code=${event.code} reason="${event.reason}" clean=${event.wasClean}`);
                setConnected(false);
                if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

                // Auto-reconnect after 5s
                if (!isCancelled) {
                    console.log('[Chat] Will reconnect in 5s...');
                    reconnectTimer.current = setTimeout(connect, 5000);
                }
            };
        }

        connect();

        return () => {
            console.log('[Chat] Cleanup: closing connection');
            isCancelled = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setConnected(false);
        };
    }, [conversationId]);

    const sendMessage = useCallback((content: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !conversationId || !userId) {
            console.warn('[Chat] Cannot send: ws not open or missing ids');
            return;
        }
        const payload = JSON.stringify({
            content,
            messageType: 'TEXT',
            conversationId,
            senderId: userId,
        });
        const frame = buildFrame('SEND', {
            destination: `/app/chat/${conversationId}`,
            'content-type': 'application/json',
        }, payload);
        wsRef.current.send(frame);
        console.log('[Chat] Sent message:', content.substring(0, 50));
    }, [conversationId, userId]);

    return { messages, setMessages, connected, sendMessage };
};
