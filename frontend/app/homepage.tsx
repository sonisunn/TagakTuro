import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { getBookingsByStudentId } from '../src/api/booking';

export default function TagakTuroHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userName, setUserName] = useState('');
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchBooking, setMatchBooking] = useState(null);
  const previousBookingsRef = useRef([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const fullName = userData.name || 'User';
        const firstName = fullName.split(' ')[0]; // Get only the first name
        setUserName(firstName);
      }
    };

    fetchUserData();
  }, []);

  const fetchBookings = async () => {
    try {
      const studentId = await AsyncStorage.getItem('studentId');
      if (studentId) {
        const bookings = await getBookingsByStudentId(studentId);
        const upcoming = [];
        const past = [];

        // Check for newly confirmed bookings using the ref
        const previousBookings = previousBookingsRef.current;
        let newlyConfirmedBooking = null;

        bookings.forEach(booking => {
          // Transform booking data for display
          const bookingItem = {
            id: booking.id,
            tutor: booking.tutorName || 'Unassigned',
            subject: booking.subject || 'N/A',
            location: booking.modality || 'N/A',
            dateTime: formatBookingDateTime(booking.bookingDateTime),
            status: booking.status || 'PENDING',
            rawStatus: booking.status,
          };

          // Check if this booking was previously pending and is now confirmed
          const previousBooking = previousBookings.find(b => b.id === booking.id);
          if (previousBooking && previousBooking.rawStatus === 'PENDING' && booking.status === 'CONFIRMED') {
            newlyConfirmedBooking = bookingItem;
          }

          // Filter by status
          if (booking.status === 'CONFIRMED') {
            upcoming.push(bookingItem);
          } else if (booking.status === 'COMPLETED') {
            past.push(bookingItem);
          }
        });

        // Update the ref with current bookings for next comparison
        previousBookingsRef.current = [...upcoming, ...past];

        setUpcomingClasses(upcoming);
        setPastClasses(past);

        // Show match notification if a booking was newly confirmed
        if (newlyConfirmedBooking && !loading) {
          setMatchBooking(newlyConfirmedBooking);
          setShowMatchNotification(true);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up polling to check for booking updates every 5 seconds
    const interval = setInterval(fetchBookings, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatBookingDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${formattedDate} | ${formattedTime}`;
    } catch (error) {
      return 'Date TBA';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all stored authentication data
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('studentId');
              await AsyncStorage.removeItem('tutorId');

              // Navigate to login page
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Real booking data is now managed by state variables above

  const displayedClasses = activeTab === 'upcoming' ? upcomingClasses : pastClasses;

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your classes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {userName}!</Text>
            <Text style={styles.subGreeting}>Ready to learn?</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.notificationContainer} onPress={() => router.push('/notification')}>
              <Ionicons name="notifications" size={32} color="#95CDF2" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#2B74B4" />
            </TouchableOpacity>

            <View style={styles.profilePicture}>
              <Ionicons name="person-circle" size={48} color="#2B74B4" />
            </View>
          </View>
        </View>

        <View style={styles.bookCard}>
          <Text style={styles.bookCardTitle}>Unlock your full potential!</Text>
          <Text style={styles.bookCardSubtitle}>Book a tutor today!</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/book')}>
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

      <BottomNav />

      {showMatchNotification && matchBooking && (
        <TouchableOpacity
          style={styles.matchCardOverlay}
          onPress={() => setShowMatchNotification(false)}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMatchNotification(false)}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.matchTitle}>We found a match!</Text>
          <Text style={styles.matchSubtitle}>
            {matchBooking.subject} with {matchBooking.tutor} - {matchBooking.dateTime}
          </Text>
          <Text style={styles.matchDetails}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: '#2B74B4',
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
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoutButton: {
    padding: 4,
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
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
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
    fontSize: 15,
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
    width: 175,
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
    fontSize: 15,
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
    fontSize: 17,
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
    fontWeight: '700',
    color: '#fff',
  },
  matchCardOverlay: {
    position: 'absolute',
    bottom: 100, // Position above the bottom nav
    left: 20,
    right: 20,
    backgroundColor: '#2B74B4',
    padding: 15,
    borderRadius: 15,
    height: 100,
    zIndex: 1000, // High z-index to appear above everything
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
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
    marginBottom: 2,
  },
  matchDetails: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#95CDF2',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 160,
  },
});