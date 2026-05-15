import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getBookingsByStudentId, updateBooking, updateBookingStatus } from '../../src/api/booking';
import { checkEvaluated } from '../../src/api/evaluation';
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';
import { useNotifications } from '../../constants/hooks/useNotifications';

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
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [userName, setUserName] = useState<string>('');
  const [upcomingClasses, setUpcomingClasses] = useState<ClassItem[]>([]);
  const [pastClasses, setPastClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const { unreadCount } = useNotifications(currentUserId);
  const [showMatchNotification, setShowMatchNotification] = useState<boolean>(false);
  const [matchBooking, setMatchBooking] = useState<ClassItem | null>(null);
  const [showRescheduleNotification, setShowRescheduleNotification] = useState<boolean>(false);
  const [rescheduledBooking, setRescheduledBooking] = useState<ClassItem | null>(null);
  const previousBookingsRef = useRef<ClassItem[]>([]);

  // --- Modal State Management ---
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [modalView, setModalView] = useState<string>('details');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; body: string; closeAll: boolean }>({ visible: false, title: '', body: '', closeAll: false });
  const [evaluatedBookingIds, setEvaluatedBookingIds] = useState<Set<string>>(new Set());
  const [cancelReason, setCancelReason] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('evaluatedBookings').then(raw => {
        if (raw) {
          const ids: number[] = JSON.parse(raw);
          setEvaluatedBookingIds(new Set(ids.map(String)));
        }
      }).catch(() => {});
      AsyncStorage.getItem('userData').then(raw => {
        if (raw) {
          const data = JSON.parse(raw);
          setProfileImageUri(data.profilePictureUrl || null);
        }
      }).catch(() => {});
    }, [])
  );

  // --- Date/Time Picker State ---
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const fullName = userData.name || 'User';
        const firstName = fullName.split(' ')[0];
        setUserName(firstName);
        setCurrentUserId(userData.id);
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

        // Hydrate the "evaluated" set from the server for every completed
        // booking so the Evaluate button reflects authoritative state across
        // devices, not just whatever this device cached in AsyncStorage.
        if (past.length > 0) {
          const results = await Promise.allSettled(
            past.map(b => checkEvaluated(b.id, 'STUDENT_EVALUATES_TUTOR'))
          );
          setEvaluatedBookingIds(prev => {
            const next = new Set(prev);
            results.forEach((r, i) => {
              if (r.status === 'fulfilled' && r.value) next.add(past[i].id);
            });
            return next;
          });
        }

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
    } catch {
      return 'Date TBA';
    }
  };

  const formatSessionTime = (dateTimeString: string, durationMinutes: number = 60) => {
    try {
      const startDate = new Date(dateTimeString);
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
      const startDate = new Date(dateTimeString);
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
    const startDate = classItem.rawDate ? new Date(classItem.rawDate) : new Date();
    setTempDate(startDate);
    setTempEndDate(new Date(startDate.getTime() + (classItem.duration || 60) * 60000));
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
    setShowEndTimePicker(false);
  };

  const handleRescheduleSubmit = async () => {
    try {
      setModalLoading(true);

      const newDateTime = tempDate;

      if (newDateTime <= new Date()) {
        setAlertModal({ visible: true, title: 'Invalid Date', body: 'Please select a date and time in the future.', closeAll: false });
        return;
      }

      const startMins = newDateTime.getHours() * 60 + newDateTime.getMinutes();
      const endMins = tempEndDate.getHours() * 60 + tempEndDate.getMinutes();
      const newDuration = endMins - startMins;

      if (newDuration <= 0) {
        setAlertModal({ visible: true, title: 'Invalid Time', body: 'End time must be after start time.', closeAll: false });
        return;
      }
      if (startMins < 8 * 60) {
        setAlertModal({ visible: true, title: 'Invalid Time', body: 'Sessions must start at or after 8:00 AM.', closeAll: false });
        return;
      }
      if (endMins > 17 * 60) {
        setAlertModal({ visible: true, title: 'Invalid Time', body: 'Sessions must end by 5:00 PM.', closeAll: false });
        return;
      }
      if (newDuration > 180) {
        setAlertModal({ visible: true, title: 'Invalid Duration', body: 'Sessions cannot exceed 3 hours.', closeAll: false });
        return;
      }

      const pad = (n: number) => n < 10 ? '0' + n : String(n);
      const isoDateTime = newDateTime.getFullYear() + '-' +
        pad(newDateTime.getMonth() + 1) + '-' +
        pad(newDateTime.getDate()) + 'T' +
        pad(newDateTime.getHours()) + ':' +
        pad(newDateTime.getMinutes()) + ':00';

      await updateBooking(selectedClass!.id, {
        bookingDateTime: isoDateTime,
        durationMinutes: newDuration,
      });

      await fetchBookings();
      setModalVisible(false);
      setAlertModal({ visible: true, title: 'Successfully Rescheduled!', body: 'Your session has been successfully rescheduled.', closeAll: true });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      Alert.alert('Error', 'Failed to reschedule booking. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      setAlertModal({ visible: true, title: 'Reason required', body: 'Please share a quick reason for cancelling so we can let the other side know.', closeAll: false });
      return;
    }
    try {
      setModalLoading(true);

      await updateBookingStatus(selectedClass!.id, 'CANCELLED', cancelReason);

      await fetchBookings();
      setModalVisible(false);
      setCancelReason('');
      setAlertModal({ visible: true, title: 'Session Cancelled', body: 'Your session has been successfully cancelled.', closeAll: true });
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

  const onEndTimeChange = (event: DateTimePickerEvent, selected: Date | undefined) => {
    setShowEndTimePicker(false);
    if (event.type !== 'dismissed' && selected) {
      setTempEndDate(selected);
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

            <TouchableOpacity style={styles.profilePicture} onPress={() => router.push('/profile')}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <Ionicons name="person-circle" size={48} color="#2B74B4" />
              )}
            </TouchableOpacity>
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
          <View style={[styles.tabContainer, { width: screenWidth * 0.54 }]}>
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
                classItem.status === 'CANCELLED' && { color: '#FF6B6B' },
              ]}>
                Status: {classItem.status === "CONFIRMED" ? "UPCOMING" : classItem.status}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.viewButton,
                classItem.status === 'COMPLETED' && evaluatedBookingIds.has(classItem.id) && styles.viewButtonEvaluated,
              ]}
              onPress={() => {
                if (classItem.status === 'COMPLETED' && !evaluatedBookingIds.has(classItem.id)) {
                  const sessionDate = classItem.rawDate
                    ? new Date(classItem.rawDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : 'N/A';
                  router.push({
                    pathname: '/evaluation',
                    params: {
                      bookingId: classItem.id,
                      evaluationType: 'STUDENT_EVALUATES_TUTOR',
                      evaluatorId: String(currentUserId),
                      evaluateeId: String(classItem.tutorUserId),
                      evaluateeName: classItem.tutor,
                      subject: classItem.subject,
                      sessionDate,
                    },
                  });
                } else {
                  handleViewPress(classItem);
                }
              }}
              disabled={classItem.status === 'COMPLETED' && evaluatedBookingIds.has(classItem.id)}
            >
              <Text style={styles.viewButtonText}>
                {classItem.status === 'COMPLETED'
                  ? evaluatedBookingIds.has(classItem.id) ? 'Evaluated' : 'Evaluate'
                  : 'View'}
              </Text>
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
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={10} tint="light" style={styles.absolute}>
          <View style={styles.modalContent}>

            {/* VIEW 1: Session Details */}
            {modalView === 'details' && selectedClass && (
              <>
                <Text style={styles.modalHeadline}>{selectedClass.tutor}</Text>
                <Text style={styles.modalCaption}>{selectedClass.subject}</Text>
                <Text style={styles.modalCaption}>{selectedClass.location}</Text>
                <Text style={styles.modalCaption}>{formatStartTime(selectedClass.rawDate)}</Text>
                <Text style={[styles.modalStatus, { fontSize: 12 }]}>Status: <Text style={{ color: selectedClass.status === 'COMPLETED' ? '#0FE40F' : selectedClass.status === 'CANCELLED' ? '#FF6B6B' : '#FCC419', fontWeight: '400' }}>{selectedClass.status === 'CONFIRMED' ? 'UPCOMING' : selectedClass.status}</Text></Text>

                <View style={styles.modalButtonContainer}>
                  {selectedClass.status !== 'COMPLETED' && selectedClass.status !== 'CANCELLED' && selectedClass.status !== 'DECLINED' && (
                    <>
                      <TouchableOpacity style={styles.modalChatButton} onPress={() => { handleCloseModal(); router.replace('/messages'); }}>
                        <Text style={styles.modalBtnTextWhite}>Chat with your Tutor</Text>
                      </TouchableOpacity>

                      {selectedClass.location === 'Online' && (
                        <TouchableOpacity
                          style={styles.modalChatButton}
                          onPress={() => {
                            handleCloseModal();
                            router.push({
                              pathname: '/meeting-lobby',
                              params: {
                                roomId: selectedClass.id,
                                userId: String(currentUserId),
                                userName: userName,
                                isTutor: 'false',
                              },
                            });
                          }}
                        >
                          <Text style={styles.modalBtnTextWhite}>Join the meeting link</Text>
                        </TouchableOpacity>
                      )}

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
                    <>
                      <TouchableOpacity
                        style={[styles.modalRescheduleButton, { backgroundColor: '#FCC419', borderColor: '#FCC419', marginTop: 10 }]}
                        onPress={() => {
                          handleCloseModal();
                          router.replace(`/tutor-feedback?userId=${selectedClass.tutorUserId}&name=${selectedClass.tutor}&bookingId=${selectedClass.id}`);
                        }}
                      >
                        <Text style={[styles.modalBtnTextWhite, { color: '#2B74B4' }]}>View Profile & Rate</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalChatButton,
                          evaluatedBookingIds.has(selectedClass.id) && { backgroundColor: '#A8C4E0' },
                        ]}
                        disabled={evaluatedBookingIds.has(selectedClass.id)}
                        onPress={() => {
                          handleCloseModal();
                          const sessionDate = selectedClass.rawDate
                            ? new Date(selectedClass.rawDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'N/A';
                          router.push({
                            pathname: '/evaluation',
                            params: {
                              bookingId: selectedClass.id,
                              evaluationType: 'STUDENT_EVALUATES_TUTOR',
                              evaluatorId: String(currentUserId),
                              evaluateeId: String(selectedClass.tutorUserId),
                              evaluateeName: selectedClass.tutor,
                              subject: selectedClass.subject,
                              sessionDate,
                            },
                          });
                        }}
                      >
                        <Text style={styles.modalBtnTextWhite}>
                          {evaluatedBookingIds.has(selectedClass.id) ? 'Already Evaluated' : 'Evaluate Session'}
                        </Text>
                      </TouchableOpacity>
                    </>
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

                <Text style={[styles.modalSectionTitle, { marginTop: 15 }]}>Start Time</Text>

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

                <Text style={[styles.modalSectionTitle, { marginTop: 15 }]}>End Time</Text>

                <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.pickerTrigger}>
                  <Text style={styles.pickerText}>
                    {tempEndDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </TouchableOpacity>

                {showEndTimePicker && (
                  <DateTimePicker
                    value={tempEndDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndTimeChange}
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

            {/* VIEW 4: Cancel Confirmation */}
            {modalView === 'cancel' && (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <Text style={[styles.cancelHeadline, { marginBottom: 12, textAlign: 'center' }]}>
                  Are you sure you want to cancel?
                </Text>
                <Text style={[styles.modalLabel, { alignSelf: 'flex-start', marginBottom: 6 }]}>
                  Reason for cancelling
                </Text>
                <TextInput
                  style={styles.cancelReasonInput}
                  placeholder="e.g. Conflicting schedule, feeling unwell, etc."
                  placeholderTextColor="#9bbbe0"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, (modalLoading || !cancelReason.trim()) && styles.disabledButton]}
                    onPress={handleCancelConfirm}
                    disabled={modalLoading || !cancelReason.trim()}
                  >
                    <Text style={styles.modalBtnTextWhite}>
                      {modalLoading ? 'Cancelling...' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalReturnButton, modalLoading && styles.disabledButton]}
                    onPress={() => { setModalView('details'); setCancelReason(''); }}
                    disabled={modalLoading}
                  >
                    <Text style={styles.modalBtnTextBlue}>Return</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}


          </View>
        </BlurView>
      </Modal>

      {/* --- ALERT MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={alertModal.visible} onRequestClose={() => { setAlertModal({ visible: false, title: '', body: '', closeAll: false }); if (alertModal.closeAll) handleCloseModal(); }}>
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => { const shouldClose = alertModal.closeAll; setAlertModal({ visible: false, title: '', body: '', closeAll: false }); if (shouldClose) handleCloseModal(); }}>
              <Text style={styles.alertButtonText}>Return</Text>
            </TouchableOpacity>
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
    borderRadius: 24,
    overflow: 'hidden',
  },
  bookCard: {
    backgroundColor: '#2B74B4',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 15,
  },
  bookCardTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
    marginBottom: -4,
    lineHeight: 22,
  },
  bookCardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    lineHeight: 30,
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
    alignItems: 'center',
    borderColor: '#2B74B4',
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    height: 35,
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    marginBottom: 12,
    minHeight: 130,
    paddingVertical: 18,
    paddingHorizontal: 20,
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
  statusCancelled: {
    color: '#FF0000',
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
  viewButtonEvaluated: {
    backgroundColor: '#A8C4E0',
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
  modalLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#2B74B4',
  },
  cancelReasonInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: '#2B74B4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#2B74B4',
    backgroundColor: '#fff',
    marginBottom: 8,
    textAlignVertical: 'top',
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

  // Alert Modal
  alertCard: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#2B74B4',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertBody: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#95CDF2',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: '#2B74B4',
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
