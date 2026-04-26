import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getBookingsByStudentId, updateBooking, updateBookingStatus } from '../../src/api/booking';
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';

// TypeScript interfaces
interface ClassItem {
  id: string;
  tutor: string;
  tutorUserId?: number;
  subject: string;
  location: string;
  dateTime: string;
  rawDate: string;
  status: string;
  rawStatus: string;
  duration?: number; // Duration in minutes
}

interface DateTimePickerEvent {
  type: string;
  nativeEvent?: any;
}

export default function TagakTuroHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [userName, setUserName] = useState<string>('');
  const [upcomingClasses, setUpcomingClasses] = useState<ClassItem[]>([]);
  const [pastClasses, setPastClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showMatchNotification, setShowMatchNotification] = useState<boolean>(false);
  const [matchBooking, setMatchBooking] = useState<ClassItem | null>(null);
  const [showRescheduleNotification, setShowRescheduleNotification] = useState<boolean>(false);
  const [rescheduledBooking, setRescheduledBooking] = useState<ClassItem | null>(null);
  const previousBookingsRef = useRef<ClassItem[]>([]);

  // --- Modal State Management ---
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [modalView, setModalView] = useState<string>('details'); // 'details', 'reschedule', 'success', 'cancel', 'cancelSuccess'
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // --- Date/Time Picker State ---
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const fullName = userData.name || 'User';
        const firstName = fullName.split(' ')[0];
        setUserName(firstName);
      }
    };
    fetchUserData();
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const studentId = await AsyncStorage.getItem('studentId');
      if (studentId) {
        const bookings = await getBookingsByStudentId(studentId);
        if (!bookings || !Array.isArray(bookings)) {
          setLoading(false);
          return;
        }

        const upcoming: ClassItem[] = [];
        const past: ClassItem[] = [];

        const previousBookings = previousBookingsRef.current;
        let newlyConfirmedBooking: ClassItem | null = null;
        let newlyRescheduledBooking: ClassItem | null = null;

        bookings.forEach((booking: any) => {
          const bookingItem = {
            id: String(booking.id),
            tutor: booking.tutorName || 'Unassigned',
            tutorUserId: booking.tutorUserId,
            subject: booking.subject || 'N/A',
            location: (booking.modality === 'In-Person' && booking.venue) ? booking.venue : booking.modality || 'N/A',
            dateTime: formatBookingDateTime(booking.bookingDateTime),
            rawDate: booking.bookingDateTime,
            status: booking.status || 'PENDING',
            rawStatus: booking.status,
            duration: booking.durationMinutes || 60, // Default to 60 minutes if not specified
          };

          const previousBooking = previousBookings.find(b => b.id === booking.id);
          if (previousBooking && previousBooking.rawStatus === 'PENDING' && booking.status === 'CONFIRMED') {
            newlyConfirmedBooking = bookingItem;
          }
          // Check for rescheduled bookings (same status but different date/time)
          else if (previousBooking && previousBooking.rawDate !== booking.bookingDateTime) {
            newlyRescheduledBooking = bookingItem;
          }

          if (booking.status === 'CONFIRMED') {
            upcoming.push(bookingItem);
          } else if (booking.status === 'COMPLETED') {
            past.push(bookingItem);
          }
        });

        previousBookingsRef.current = [...upcoming, ...past];
        setUpcomingClasses(upcoming);
        setPastClasses(past);

        // Only show notifications on first load
        if (newlyConfirmedBooking !== null && loading) {
          setMatchBooking(newlyConfirmedBooking);
          setShowMatchNotification(true);
        }

        if (newlyRescheduledBooking && loading) {
          setRescheduledBooking(newlyRescheduledBooking);
          setShowRescheduleNotification(true);
        }
      }

      // Also fetch unread notifications count
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        try {
          const res = await axios.get(`${API_BASE_URL}/api/notifications?userId=${user.id}`);
          const unread = res.data.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        } catch (e) {
          console.warn("Failed to fetch notification count", e);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    let retryCount = 0;
    const maxRetries = 3;

    const loadBookings = async () => {
      if (!isActive) return;
      await fetchBookings();
      retryCount = 0; // Reset retry count on success
    };

    loadBookings();

    // Retry on failure with exponential backoff
    const handleError = async () => {
      if (retryCount < maxRetries && isActive) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        setTimeout(loadBookings, delay);
      }
    };

    // Lighter polling: only every 30 seconds instead of 5
    const interval = setInterval(() => {
      if (isActive) loadBookings().catch(handleError);
    }, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [fetchBookings]);

  const formatBookingDateTime = (dateTimeString: string) => {
    try {
      // Force UTC interpretation since backend sends LocalDateTime as ISO string
      const utcDateTimeString = dateTimeString.includes('Z') ? dateTimeString : dateTimeString + 'Z';
      const date = new Date(utcDateTimeString);
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
    } catch {
      return 'Date TBA';
    }
  };

  const formatSessionTime = (dateTimeString: string, durationMinutes: number = 60) => {
    try {
      // Force UTC interpretation since backend sends LocalDateTime as ISO string
      const utcDateTimeString = dateTimeString.includes('Z') ? dateTimeString : dateTimeString + 'Z';
      const startDate = new Date(utcDateTimeString);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return `${startTime} - ${endTime}`;
    } catch {
      return 'Time TBA';
    }
  };

  const formatStartTime = (dateTimeString: string) => {
    try {
      // Force UTC interpretation since backend sends LocalDateTime as ISO string
      const utcDateTimeString = dateTimeString.includes('Z') ? dateTimeString : dateTimeString + 'Z';
      const startDate = new Date(utcDateTimeString);
      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return startTime;
    } catch {
      return 'Time TBA';
    }
  };

  // --- Modal Handlers ---
  const handleViewPress = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    // Initialize picker with current class date or now
    setTempDate(classItem.rawDate ? new Date(classItem.rawDate) : new Date());
    setModalView('details');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedClass(null);
    setModalView('details');
    setModalLoading(false);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleRescheduleSubmit = async () => {
    try {
      setModalLoading(true);

      // Combine selected date and time into a single Date object
      let newDateTime;

      if (selectedDate && selectedTime) {
        // Both date and time selected
        newDateTime = new Date(selectedDate);
        newDateTime.setHours(selectedTime.getHours());
        newDateTime.setMinutes(selectedTime.getMinutes());
        newDateTime.setSeconds(0);
        newDateTime.setMilliseconds(0);
      } else if (selectedDate) {
        // Only date selected, use the time from tempDate
        newDateTime = new Date(selectedDate);
        newDateTime.setHours(tempDate.getHours());
        newDateTime.setMinutes(tempDate.getMinutes());
        newDateTime.setSeconds(0);
        newDateTime.setMilliseconds(0);
      } else if (selectedTime) {
        // Only time selected, use the date from tempDate
        newDateTime = new Date(tempDate);
        newDateTime.setHours(selectedTime.getHours());
        newDateTime.setMinutes(selectedTime.getMinutes());
        newDateTime.setSeconds(0);
        newDateTime.setMilliseconds(0);
      } else {
        // No new date/time selected, use tempDate as-is
        newDateTime = tempDate;
      }

      // Validate that the new date/time is in the future
      if (newDateTime <= new Date()) {
        Alert.alert('Error', 'Please select a date and time in the future.');
        return;
      }

      // Convert to ISO string for API
      const isoDateTime = newDateTime.toISOString();

      // Call API to update booking
      await updateBooking(selectedClass!.id, {
        bookingDateTime: isoDateTime
      });

      // Refresh bookings to show updated data
      await fetchBookings();

      setModalView('success');
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      Alert.alert('Error', 'Failed to reschedule booking. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setModalLoading(true);

      // Call API to cancel booking
      await updateBookingStatus(selectedClass!.id, 'CANCELLED');

      // Refresh bookings to show updated data
      await fetchBookings();

      setModalView('cancelSuccess');
    } catch (error) {
      console.error('Error canceling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  // Date Picker Handlers
  const onDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS if needed, close on Android
    if (event.type !== 'dismissed') {
      setShowDatePicker(false);
      setTempDate(currentDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || tempDate;
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type !== 'dismissed') {
      setShowTimePicker(false);
      setTempDate(currentTime);
    }
  };

  // ----------------------

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('studentId');
              await AsyncStorage.removeItem('tutorId');
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
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {userName}!</Text>
            <Text style={styles.subGreeting}>Ready to learn?</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.notificationContainer} onPress={() => router.replace('/notification')}>
              <Ionicons name="notifications" size={32} color="#95CDF2" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#2B74B4" />
            </TouchableOpacity>

            <View style={styles.profilePicture}>
              <Ionicons name="person-circle" size={48} color="#2B74B4" />
            </View>
          </View>
        </View>

        {/* Promo Card */}
        <View style={styles.bookCard}>
          <Text style={styles.bookCardTitle}>Unlock your full potential!</Text>
          <Text style={styles.bookCardSubtitle}>Book a tutor today!</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => router.replace('/book')}>
            <Text style={styles.bookButtonText}>Book now</Text>
          </TouchableOpacity>
        </View>

        {/* Classes List */}
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

        {displayedClasses.map((classItem: ClassItem) => (
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
                classItem.status === 'CONFIRMED' && styles.statusUpcoming,
                classItem.status === 'COMPLETED' && styles.statusCompleted,
              ]}>
                Status: {classItem.status === "CONFIRMED" ? "UPCOMING" : classItem.status}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={() => handleViewPress(classItem)}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* --- SESSION DETAILS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <BlurView intensity={10} tint="light" style={styles.absolute}>
          <View style={styles.modalContent}>

            {/* VIEW 1: Session Details */}
            {modalView === 'details' && selectedClass && (
              <>
                <Text style={styles.modalHeadline}>{selectedClass.tutor}</Text>
                <Text style={styles.modalCaption}>{selectedClass.subject}</Text>
                <Text style={styles.modalCaption}>{selectedClass.location}</Text>
                <Text style={styles.modalCaption}>{formatStartTime(selectedClass.rawDate)}</Text>
                <Text style={[styles.modalStatus, { fontSize: 12 }]}>Status: <Text style={{ color: '#95CDF2', fontWeight: '400' }}>{selectedClass.status}</Text></Text>

                <View style={styles.modalButtonContainer}>
                  {selectedClass.status !== 'COMPLETED' && selectedClass.status !== 'CANCELLED' && selectedClass.status !== 'DECLINED' && (
                    <>
                      <TouchableOpacity style={styles.modalChatButton}>
                        <Text style={styles.modalBtnTextWhite}>Chat with your Tutor</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalRescheduleButton}
                        onPress={() => setModalView('reschedule')}
                      >
                        <Text style={styles.modalBtnTextWhite}>Reschedule</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setModalView('cancel')}
                      >
                        <Text style={styles.modalBtnTextWhite}>Cancel Session</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedClass.status === 'COMPLETED' ? (
                    <TouchableOpacity
                      style={[styles.modalRescheduleButton, { backgroundColor: '#FCC419', borderColor: '#FCC419', marginTop: 10 }]}
                      onPress={() => {
                        handleCloseModal();
                        router.replace(`/tutor-feedback?userId=${selectedClass.tutorUserId}&name=${selectedClass.tutor}&bookingId=${selectedClass.id}`);
                      }}
                    >
                      <Text style={[styles.modalBtnTextWhite, { color: '#2B74B4' }]}>View Profile & Rate</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={styles.modalReturnButton} onPress={handleCloseModal}>
                    <Text style={styles.modalBtnTextBlue}>Return</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* VIEW 2: Reschedule */}
            {modalView === 'reschedule' && selectedClass && (
              <>
                <Text style={styles.modalSectionTitle}>Current Session</Text>
                <Text style={styles.modalTextSmall}>{selectedClass.location}</Text>
                <Text style={styles.modalTextSmall}>{formatSessionTime(selectedClass.rawDate, selectedClass.duration)}</Text>

                <Text style={[styles.modalSectionTitle, { marginTop: 15 }]}>Date</Text>

                {/* Custom Date Input Trigger */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerTrigger}>
                  <Text style={styles.pickerText}>
                    {tempDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}

                <Text style={[styles.modalSectionTitle, { marginTop: 15 }]}>Preferred Time</Text>

                {/* Custom Time Input Trigger */}
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerTrigger}>
                  <Text style={styles.pickerText}>
                    {tempDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                  />
                )}

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalSubmitButton, modalLoading && styles.disabledButton]}
                    onPress={handleRescheduleSubmit}
                    disabled={modalLoading}
                  >
                    <Text style={styles.modalBtnTextWhite}>
                      {modalLoading ? 'Rescheduling...' : 'Submit'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalReturnButton, modalLoading && styles.disabledButton]}
                    onPress={() => setModalView('details')}
                    disabled={modalLoading}
                  >
                    <Text style={styles.modalBtnTextBlue}>Return</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* VIEW 3: Reschedule Success */}
            {modalView === 'success' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={styles.successTitle}>Successfully Rescheduled!</Text>
                <Text style={styles.successCaption}>Click Return to go back to the homepage</Text>

                <TouchableOpacity style={[styles.modalReturnButton, { width: '100%', marginTop: 20 }]} onPress={handleCloseModal}>
                  <Text style={styles.modalBtnTextBlue}>Return</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* VIEW 4: Cancel Confirmation */}
            {modalView === 'cancel' && (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.cancelHeadline, { marginBottom: 20, textAlign: 'center' }]}>
                  Are you sure you want to cancel?
                </Text>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, modalLoading && styles.disabledButton]}
                    onPress={handleCancelConfirm}
                    disabled={modalLoading}
                  >
                    <Text style={styles.modalBtnTextWhite}>
                      {modalLoading ? 'Cancelling...' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalReturnButton, modalLoading && styles.disabledButton]}
                    onPress={() => setModalView('details')}
                    disabled={modalLoading}
                  >
                    <Text style={styles.modalBtnTextBlue}>Return</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* VIEW 5: Cancel Success */}
            {modalView === 'cancelSuccess' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={styles.successTitle}>Session Cancelled</Text>
                <Text style={styles.successCaption}>Click Return to go back to the homepage</Text>

                <TouchableOpacity style={[styles.modalReturnButton, { width: '100%', marginTop: 20 }]} onPress={handleCloseModal}>
                  <Text style={styles.modalBtnTextBlue}>Return</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </BlurView>
      </Modal>

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

      {showRescheduleNotification && rescheduledBooking && (
        <TouchableOpacity
          style={styles.rescheduleCardOverlay}
          onPress={() => setShowRescheduleNotification(false)}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowRescheduleNotification(false)}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.rescheduleTitle}>Session Rescheduled!</Text>
          <Text style={styles.rescheduleSubtitle}>
            {rescheduledBooking.subject} with {rescheduledBooking.tutor} - {rescheduledBooking.dateTime}
          </Text>
          <Text style={styles.rescheduleDetails}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Keep existing styles) ...
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#2B74B4',
  },
  subGreeting: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 2,
  },
  bookCardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
  matchCardOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#2B74B4',
    padding: 15,
    borderRadius: 15,
    height: 100,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontWeight: '600',
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
  rescheduleCardOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FCC419', // Yellow color for reschedule
    padding: 15,
    borderRadius: 15,
    height: 100,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rescheduleTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  rescheduleSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
  },
  rescheduleDetails: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#2B74B4',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 160,
  },

  // --- UPDATED STYLES FOR MODAL ---
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed background color to let BlurView handle it
  },
  modalContent: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2B74B4',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // Typography updates
  modalHeadline: {
    fontFamily: 'Poppins',
    fontSize: 17, // Updated
    fontWeight: '600',
    color: '#2B74B4',
  },
  modalCaption: {
    fontFamily: 'Poppins',
    fontSize: 12, // Updated
    color: '#95CDF2',
    marginBottom: 2,
  },
  modalText: {
    fontFamily: 'Poppins',
    fontSize: 12, // Updated
    color: '#95CDF2',
    marginBottom: 2,
  },
  modalStatus: {
    fontFamily: 'Poppins',
    fontSize: 12, // Updated
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
  },
  modalTextSmall: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    marginBottom: 2,
  },
  modalButtonContainer: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  modalChatButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalRescheduleButton: {
    backgroundColor: '#FCC419',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalReturnButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalSubmitButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  // Button text size updated
  modalBtnTextWhite: {
    fontFamily: 'Poppins',
    fontSize: 15, // Updated
    fontWeight: '600',
    color: '#fff',
  },
  modalBtnTextBlue: {
    fontFamily: 'Poppins',
    fontSize: 15, // Updated
    fontWeight: '600',
    color: '#2B74B4',
  },

  // Reschedule Inputs
  pickerTrigger: {
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#2B74B4',
  },

  // Success view
  successTitle: {
    fontFamily: 'Poppins',
    fontSize: 17, // Updated
    fontWeight: '600',
    color: '#2B74B4',
    textAlign: 'center',
  },
  successCaption: {
    fontFamily: 'Poppins',
    fontSize: 12, // Updated
    color: '#95CDF2',
    textAlign: 'center',
  },

  // Cancel view
  cancelHeadline: {
    fontFamily: 'Poppins',
    fontSize: 17, // Updated
    fontWeight: '600',
    color: '#2B74B4',
    textAlign: 'center',
  },
});
