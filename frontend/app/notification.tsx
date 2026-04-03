import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import BottomNav from '../components/BottomNav';

interface Notification {
  id: number;
  title: string;
  body: string;
}

export default function NotificationsPage() {

  const [readNotifications, setReadNotifications] = useState<number[]>([]);

  const todayNotifications: Notification[] = [
    {
      id: 1,
      title: 'We found a match!',
      body: 'Hey!!! Just a quick reminder about our session later today at 5 PM',
    },
    {
      id: 2,
      title: 'You booked a session',
      body: 'We have received your online booking scheduled for September 30, 2025',
    },
    {
      id: 3,
      title: 'Welcome to TagakTuro!',
      body: 'Welcome to TagakTuro! an online tutoring application that caters your needs and schedule',
    },
  ];

  const pastNotifications: Notification[] = [
    {
      id: 4,
      title: 'We found a match!',
      body: 'Hey!!! Just a quick reminder about our session later today at 5 PM',
    },
    {
      id: 5,
      title: 'You booked a session',
      body: 'We have received your online booking scheduled for September 30, 2025',
    },
    {
      id: 6,
      title: 'Welcome to TagakTuro!',
      body: 'Welcome to TagakTuro! an online tutoring application that caters your needs and schedule',
    },
  ];

  const markAsRead = (id: number) => {
    if (!readNotifications.includes(id)) {
      setReadNotifications([...readNotifications, id]);
    }
  };

  const renderNotification = (notification: Notification) => {
    const isRead = readNotifications.includes(notification.id);
    return (
      <TouchableOpacity 
        key={notification.id} 
        style={[
          styles.notificationItem,
          !isRead ? styles.notificationItemUnread : styles.notificationItemRead
        ]}
        onPress={() => markAsRead(notification.id)}
      >
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text numberOfLines={2} ellipsizeMode='tail' style={styles.notificationBody}>{notification.body}</Text>
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

        {/* Today Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.notificationContainer}>
            {todayNotifications.map((notification) => renderNotification(notification))}
          </View>
        </View>

        {/* Past Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past</Text>
          <View style={styles.notificationContainer}>
            {pastNotifications.map((notification) => renderNotification(notification))}
          </View>
        </View>

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
    color: '#fff',
    height: 85,
  },
  notificationItemRead: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 85,
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
});