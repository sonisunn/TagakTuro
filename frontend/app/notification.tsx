import { Stack, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Badge,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../src/api/config';
import { useWebSocket } from '../src/hooks/useWebSocket';

interface Notification {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  dateSent: string;
}

export default function NotificationsPage() {
  const { subscribe, unsubscribe, publish } = useWebSocket();
  const [todayNotifications, setTodayNotifications] = useState<Notification[]>([]);
  const [pastNotifications, setPastNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Fetch initial notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return;

      const user = JSON.parse(userDataString);
      setUserId(user.id.toString());

      const response = await axios.get(`${API_BASE_URL}/api/notifications?userId=${user.id}`);
      const data: Notification[] = response.data;

      categorizeNotifications(data);
      
      // Count unread
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Categorize notifications into today and past
   */
  const categorizeNotifications = (data: Notification[]) => {
    const today = new Date();
    const todayArr: Notification[] = [];
    const pastArr: Notification[] = [];

    data.forEach(n => {
      const d = new Date(n.dateSent);
      if (d.toDateString() === today.toDateString()) {
        todayArr.push(n);
      } else {
        pastArr.push(n);
      }
    });

    setTodayNotifications(todayArr);
    setPastNotifications(pastArr);
  };

  /**
   * Handle new notification from WebSocket
   */
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('📬 New notification received:', notification);
    
    const today = new Date();
    const d = new Date(notification.dateSent);

    if (d.toDateString() === today.toDateString()) {
      setTodayNotifications(prev => [notification, ...prev]);
    } else {
      setPastNotifications(prev => [notification, ...prev]);
    }

    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  /**
   * Handle unread count update from WebSocket
   */
  const handleUnreadCountUpdate = useCallback((data: { unreadCount: number }) => {
    console.log('📊 Unread count updated:', data.unreadCount);
    setUnreadCount(data.unreadCount);
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id: number) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`);

      const updateList = (list: Notification[]) =>
        list.map(n => n.id === id ? { ...n, isRead: true } : n);

      setTodayNotifications(updateList(todayNotifications));
      setPastNotifications(updateList(pastNotifications));
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  }, [todayNotifications, pastNotifications]);

  /**
   * Initialize notifications and WebSocket subscriptions
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Subscribe to WebSocket notifications when userId is available
   */
  useEffect(() => {
    if (userId) {
      console.log('🔔 Subscribing to notifications for user:', userId);
      
      // Subscribe to new notifications
      subscribe(
        `/user/${userId}/queue/notifications`,
        handleNewNotification
      );

      // Subscribe to unread count updates
      subscribe(
        `/user/${userId}/queue/notification-count`,
        handleUnreadCountUpdate
      );

      return () => {
        unsubscribe(`/user/${userId}/queue/notifications`);
        unsubscribe(`/user/${userId}/queue/notification-count`);
      };
    }
  }, [userId, subscribe, unsubscribe, handleNewNotification, handleUnreadCountUpdate]);

  const renderNotification = (notification: Notification) => {
    const isRead = notification.isRead;
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !isRead ? styles.notificationItemUnread : styles.notificationItemRead
        ]}
        onPress={() => {
          if (!isRead) markAsRead(notification.id);
        }}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!isRead && <View style={styles.unreadIndicator} />}
          </View>
          <Text numberOfLines={2} ellipsizeMode='tail' style={styles.notificationBody}>
            {notification.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>Hear the latest updates!</Text>
            </View>
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2B74B4" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Today Section */}
            {todayNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today</Text>
                <View style={styles.notificationContainer}>
                  {todayNotifications.map((notification) => renderNotification(notification))}
                </View>
              </View>
            )}

            {/* Past Section */}
            {pastNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past</Text>
                <View style={styles.notificationContainer}>
                  {pastNotifications.map((notification) => renderNotification(notification))}
                </View>
              </View>
            )}

            {todayNotifications.length === 0 && pastNotifications.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
                No notifications yet!
              </Text>
            )}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 15,
    marginLeft: 10,
  },
  notificationContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
    width: '95%',
    padding: 5,
    height: 'auto',
    alignSelf: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    marginBottom: 5,
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  notificationItemUnread: {
    backgroundColor: '#CAE6F9',
  },
  notificationItemRead: {
    backgroundColor: '#F5F5F5',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    flex: 1,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 10,
  },
  notificationBody: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 15,
  },
});