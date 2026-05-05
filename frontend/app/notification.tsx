import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import BottomNav from '../components/BottomNav';
import TutorBottomNav from '../components/TutorBottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../constants/hooks/useNotifications';

interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  dateSent: string;
}

export default function NotificationsPage() {

  const [userId, setUserId] = useState<number | null>(null);
  const [isTutor, setIsTutor] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(userId);

  useEffect(() => {
    loadUser();
    checkUserRole();
  }, []);

  const loadUser = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return;
      const user = JSON.parse(userDataString);
      setUserId(user.id);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const checkUserRole = async () => {
    try {
      const tutorId = await AsyncStorage.getItem('tutorId');
      setIsTutor(!!tutorId);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const today = new Date();
  const todayNotifications = notifications.filter(n => {
    const d = new Date(n.dateSent);
    return d.toDateString() === today.toDateString();
  });
  const pastNotifications = notifications.filter(n => {
    const d = new Date(n.dateSent);
    return d.toDateString() !== today.toDateString();
  });

  const allNotifications = [...todayNotifications, ...pastNotifications];
  const visibleNotifications = showAll ? allNotifications : allNotifications.slice(0, 3);
  const visibleToday = visibleNotifications.filter(n => new Date(n.dateSent).toDateString() === today.toDateString());
  const visiblePast = visibleNotifications.filter(n => new Date(n.dateSent).toDateString() !== today.toDateString());

  const renderNotification = (notification: Notification) => {
    const isRead = notification.read;
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
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody}>{notification.body}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Hear the latest updates!</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2B74B4" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Today Section */}
            {visibleToday.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today</Text>
                <View style={styles.notificationContainer}>
                  {visibleToday.map((notification) => renderNotification(notification))}
                </View>
              </View>
            )}

            {/* Past Section */}
            {visiblePast.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past</Text>
                <View style={styles.notificationContainer}>
                  {visiblePast.map((notification) => renderNotification(notification))}
                </View>
              </View>
            )}

            {allNotifications.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>No notifications yet!</Text>
            )}

            {!showAll && allNotifications.length > 3 && (
              <TouchableOpacity style={styles.viewMoreButton} onPress={() => setShowAll(true)}>
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {isTutor ? <TutorBottomNav /> : <BottomNav />}
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
  },
  notificationItemUnread: {
    backgroundColor: '#CAE6F9',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  notificationItemRead: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  notificationTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 5,
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
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#2B74B4',
    borderRadius: 25,
  },
  viewMoreText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});