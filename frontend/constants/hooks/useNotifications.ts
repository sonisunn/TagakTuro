import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../src/api/config';
import axios from 'axios';
import { showAlertNotification } from '../../src/meetingForegroundService';

const BASE_WS_URL = API_BASE_URL.replace('http', 'ws') + '/ws-native';

export interface NotificationItem {
    id: number;
    userId: number;
    title: string;
    body: string;
    read: boolean;
    dateSent: string;
}

function buildFrame(command: string, headers: Record<string, string> = {}, body = ''): ArrayBuffer {
    let frame = command + '\n';
    for (const [k, v] of Object.entries(headers)) {
        frame += `${k}:${v}\n`;
    }
    frame += '\n' + body + '\u0000';
    const encoder = new TextEncoder();
    return encoder.encode(frame).buffer;
}

function parseFrame(raw: string): { command: string; headers: Record<string, string>; body: string } | null {
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

/**
 * Hook that provides real-time notification updates via WebSocket.
 * Subscribes to:
 *   /topic/notifications/{userId}       -> new notifications
 *   /topic/notifications/{userId}/count  -> unread count updates
 *
 * Also fetches the initial notification list and unread count via REST on mount.
 */
export const useNotifications = (userId: number | null) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch initial data via REST
    const fetchInitial = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notifications?userId=${userId}`);
            const data: NotificationItem[] = res.data;
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (e) {
            console.warn('[Notif] Failed to fetch initial notifications', e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchInitial();
    }, [fetchInitial]);

    // WebSocket subscription for real-time updates
    useEffect(() => {
        if (!userId) return;

        let isCancelled = false;
        const notifSubId = `notif-sub-${++subIdCounter}`;
        const countSubId = `count-sub-${++subIdCounter}`;

        function connect() {
            if (isCancelled) return;

            const ws = new WebSocket(BASE_WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                const connectFrame = buildFrame('CONNECT', {
                    'accept-version': '1.2,1.1,1.0',
                    'heart-beat': '10000,10000',
                });
                ws.send(connectFrame);
            };

            ws.onmessage = (event) => {
                const raw = typeof event.data === 'string' ? event.data : '';
                if (raw === '\n' || raw === '\r\n' || raw === '\u0000') return;

                const frame = parseFrame(raw);
                if (!frame) return;

                switch (frame.command) {
                    case 'CONNECTED':
                        // Subscribe to new notifications
                        ws.send(buildFrame('SUBSCRIBE', {
                            id: notifSubId,
                            destination: `/topic/notifications/${userId}`,
                        }));

                        // Subscribe to unread count updates
                        ws.send(buildFrame('SUBSCRIBE', {
                            id: countSubId,
                            destination: `/topic/notifications/${userId}/count`,
                        }));

                        // Start heartbeat
                        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
                        heartbeatTimer.current = setInterval(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(new Uint8Array([10]));
                            }
                        }, 10000);
                        break;

                    case 'MESSAGE': {
                        try {
                            const payload = JSON.parse(frame.body);
                            const dest = frame.headers.destination || '';

                            if (dest.endsWith('/count')) {
                                // Unread count update
                                setUnreadCount(payload.unreadCount ?? 0);
                            } else {
                                // New notification — prepend to list
                                const newNotif: NotificationItem = {
                                    id: payload.id,
                                    userId: payload.userId,
                                    title: payload.title,
                                    body: payload.body,
                                    read: payload.read,
                                    dateSent: payload.dateSent,
                                };
                                let isNew = false;
                                setNotifications(prev => {
                                    if (prev.some(n => n.id === newNotif.id)) return prev;
                                    isNew = true;
                                    return [newNotif, ...prev];
                                });
                                // Surface in the system tray for novel notifications only,
                                // so duplicate WS frames don't fire a second buzz.
                                if (isNew) {
                                    showAlertNotification(
                                        newNotif.title || 'TagakTuro',
                                        newNotif.body || '',
                                        `notif-${newNotif.id}`,
                                    );
                                }
                            }
                        } catch (e) {
                            console.error('[Notif] Failed to parse message:', e);
                        }
                        break;
                    }

                    case 'ERROR':
                        console.error('[Notif] STOMP ERROR:', frame.headers.message);
                        break;
                }
            };

            ws.onerror = () => {};

            ws.onclose = () => {
                if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
                if (!isCancelled) {
                    reconnectTimer.current = setTimeout(connect, 5000);
                }
            };
        }

        connect();

        return () => {
            isCancelled = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [userId]);

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`);
            // Optimistic local update (server will also push via WS)
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('[Notif] Failed to mark as read', e);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;
        try {
            await axios.patch(`${API_BASE_URL}/api/notifications/readAll?userId=${userId}`);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('[Notif] Failed to mark all as read', e);
        }
    }, [userId]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refetch: fetchInitial,
    };
};
