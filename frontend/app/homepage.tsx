import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';

export default function TagakTuroHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingClasses = [
    {
      id: 1,
      tutor: 'Juan Dela Cruz',
      subject: 'Quantum Mechanics',
      location: 'Online Modality',
      dateTime: 'September 25, 2025 | 8:00 am',
      status: 'ON GOING',
    },
    {
      id: 2,
      tutor: 'Jose Rizal',
      subject: 'Quantum Mechanics',
      location: 'UMak HPSB Library',
      dateTime: 'September 25, 2025 | 8:00 am',
      status: 'UPCOMING',
    },
    {
      id: 3,
      tutor: 'Hey Study',
      subject: 'Quantum Mechanics',
      location: 'UMak HPSB Library',
      dateTime: 'September 25, 2025 | 8:00 am',
      status: 'UPCOMING',
    },
  ];

  const pastClasses = [
    {
      id: 4,
      tutor: 'Maria Santos',
      subject: 'Calculus',
      location: 'Online Modality',
      dateTime: 'September 20, 2025 | 10:00 am',
      status: 'COMPLETED',
    },
  ];

  const displayedClasses = activeTab === 'upcoming' ? upcomingClasses : pastClasses;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, Jayson!</Text>
            <Text style={styles.subGreeting}>Ready to learn?</Text>
          </View>
          <View style={styles.headerIcons}>
            <View style={styles.notificationContainer}>
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
              <Ionicons name="notifications" size={32} color="#95CDF2" />
            </View>
            <View style={styles.profilePicture}>
              <Ionicons name="person-circle" size={48} color="#2B74B4" />
            </View>
          </View>
        </View>

        <View style={styles.bookCard}>
          <Text style={styles.bookCardTitle}>Unlock your full potential!</Text>
          <Text style={styles.bookCardSubtitle}>Book a tutor today!</Text>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.classesHeader}>
          <Text style={styles.classesTitle}>Classes</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.activeTab]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {displayedClasses.map((classItem) => (
          <View key={classItem.id} style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.tutorName}>{classItem.tutor}</Text>
              <Text style={styles.subject}>{classItem.subject}</Text>
              <Text style={styles.location}>{classItem.location}</Text>
              <Text style={styles.dateTime}>{classItem.dateTime}</Text>
              <Text style={[
                styles.status,
                classItem.status === 'ON GOING' && styles.statusOnGoing,
                classItem.status === 'UPCOMING' && styles.statusUpcoming,
                classItem.status === 'COMPLETED' && styles.statusCompleted,
              ]}>
                Status: {classItem.status}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.matchCard}>
        <Text style={styles.matchTitle}>We found a match!</Text>
        <Text style={styles.matchSubtitle}>Discrete Structure 2 - September 30, 2025</Text>
      </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  greeting: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
  },
  subGreeting: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#95CDF2',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  profilePicture: {
    width: 48,
    height: 48,
  },
  bookCard: {
    backgroundColor: '#2B74B4',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
    height: 135,
  },
  bookCardTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  bookCardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  bookButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    width: 127,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  bookButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#2B74B4',
  },
  classesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  classesTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 35,
    width: 167,
    alignItems: 'center',
    borderColor: '#2B74B4',
    borderWidth: 1,
  },
  tab: {
    height: 35,
    paddingVertical: 6,
    paddingHorizontal: 16.5,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2B74B4',
  },
  tabText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#2B74B4',
  },
  activeTabText: {
    color: '#fff',
  },
  classCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    height: 115,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  tutorName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 2,
  },
  subject: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  location: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  dateTime: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
  },
  status: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
  },
  statusOnGoing: {
    color: '#FCC419',
  },
  statusUpcoming: {
    color: '#FCC419',
  },
  statusCompleted: {
    color: '#0FE40F',
  },
  viewButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    height: 40.26,
    width: 116,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  viewButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  matchCard: {
    backgroundColor: '#2B74B4',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 15,
    height: 80,
  },
  matchTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#fff',
  },
  bottomSpacing: {
    height: 160,
  },
});