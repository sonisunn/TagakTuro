import { Stack, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { updateBookingStatus, getPendingBookingsForTutor, getBookingsByTutorName, updateBooking, declineBooking } from "../../src/api/booking.js";
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';
import { useNotifications } from '../../constants/hooks/useNotifications';
const AnimatedView = Animated.createAnimatedComponent(View);

interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  studentUserId?: number;
  subject: string;
  location: string;
  date: string;
  time: string;
  startTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "DECLINED" | "CANCELLED";
  notes?: string;
  durationMinutes?: number;
  rawDate?: string; // Raw date string for modal operations
}

export default function TagakTuroHomepage() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userName, setUserName] = useState("");
  const [displayUserName, setDisplayUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const { unreadCount } = useNotifications(userId ? Number(userId) : null);
  const [upcomingClasses, setUpcomingClasses] = useState<Booking[]>([]);
  const [pastClasses, setPastClasses] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalHeight = Dimensions.get("window").height * 0.5;

  // --- Modal State Management ---
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [modalView, setModalView] = useState<string>('details');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; body: string; closeAll: boolean }>({ visible: false, title: '', body: '', closeAll: false });

  // --- Date/Time Picker State ---
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  // Transform backend booking format to frontend format
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

  const transformBooking = (booking: any): Booking | null => {
    try {
      const dateTimeString = booking.bookingDateTime;
      const bookingDateTime = dateTimeString ? new Date(dateTimeString) : null;

      if (!bookingDateTime || isNaN(bookingDateTime.getTime())) {
        return null;
      }

      const dateStr = bookingDateTime.toISOString().split('T')[0];
      const sessionTimeStr = formatSessionTime(dateTimeString, booking.durationMinutes || 60);

      const startTimeStr = formatStartTime(dateTimeString);

      return {
        id: String(booking.id),
        tutorId: booking.tutorId || '',
        tutorName: booking.tutorName || '',
        studentName: booking.student?.name || 'Unknown Student',
        studentUserId: booking.studentUserId,
        subject: booking.subject || '',
        location: (booking.modality === 'In-Person' && booking.venue) ? booking.venue : booking.modality || '',
        date: dateStr,
        time: sessionTimeStr,
        startTime: startTimeStr,
        status: booking.status || 'PENDING',
        notes: booking.notes || '',
        durationMinutes: booking.durationMinutes || 0,
        rawDate: booking.bookingDateTime, // Store raw date for modal operations
      };
    } catch (error) {
      console.error('Error transforming booking:', error);
      return null;
    }
  };

  const fetchBookings = async (tutorId: string, tutorName: string) => {
    if (!tutorId || !tutorName) return;
    try {
      // Fetch all pending bookings filtered by tutor availability
      const pendingResponse = await getPendingBookingsForTutor(tutorId);
      const allPendingBookings = Array.isArray(pendingResponse) ? pendingResponse : [];

      // Fetch bookings assigned to this tutor (confirmed/accepted bookings)
      const tutorBookingsResponse = await getBookingsByTutorName(tutorName);
      const tutorBookings = Array.isArray(tutorBookingsResponse) ? tutorBookingsResponse : [];

      // Transform bookings
      const transformedPending = allPendingBookings
        .map(transformBooking)
        .filter((b): b is Booking => b !== null);

      const transformedTutor = tutorBookings
        .map(transformBooking)
        .filter((b): b is Booking => b !== null);

      // Separate tutor's bookings by status
      const upcoming: Booking[] = [];
      const completed: Booking[] = [];

      transformedTutor.forEach((booking: Booking) => {
        if (booking.status === "CONFIRMED") {
          upcoming.push(booking);
        } else if (booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "DECLINED") {
          completed.push(booking);
        }
      });

      setPendingBookings(transformedPending);
      setUpcomingClasses(upcoming);
      setPastClasses(completed);


    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    "Poppins-Bold": Poppins_700Bold,
    "Poppins-SemiBold": Poppins_600SemiBold,
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const fullName = userData.name || "User";
        const firstName = fullName.split(' ')[0];
        setUserName(fullName);
        setDisplayUserName(firstName);
        setUserId(userData.id);
        if (userData.profilePictureUrl) {
          setProfileImageUri(userData.profilePictureUrl);
        }
      } else {
        console.log('No user data found in AsyncStorage');
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      let isActive = true;
      let retryCount = 0;
      const maxRetries = 3;

      const loadBookings = async () => {
        if (!isActive) return;
        await fetchBookings(userId, userName);
        retryCount = 0; // Reset retry count on success
      };

      loadBookings();

      // Handle errors with exponential backoff
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
    }
  }, [userId, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userData').then(raw => {
        if (raw) {
          const data = JSON.parse(raw);
          setProfileImageUri(data.profilePictureUrl || null);
        }
      }).catch(() => {});
    }, [])
  );

  if (!fontsLoaded) {
    return null;
  }

  const displayedClasses =
    activeTab === "upcoming"
      ? upcomingClasses
      : pastClasses;


  const showBookingDetailsModal = (booking: Booking) => {
    setSelectedBookingForModal(booking);
    const startDate = booking.rawDate ? new Date(booking.rawDate) : new Date();
    setTempDate(startDate);
    setTempEndDate(new Date(startDate.getTime() + (booking.durationMinutes || 60) * 60000));
    setModalView('details');
    setModalVisible(true);
  };

  const closeBookingDetailsModal = () => {
    setModalVisible(false);
    setSelectedBookingForModal(null);
    setModalView('details');
    setModalLoading(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowEndTimePicker(false);
  };

  const closeStudentModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: modalHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowStudents(false);
    });
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const bookingToAccept = pendingBookings.find(b => b.id === bookingId);
      if (!bookingToAccept) {
        console.error("Booking not found in pending bookings.");
        return;
      }

      const updatedBooking = { ...bookingToAccept, tutorName: userName };
      await updateBooking(bookingId, updatedBooking);
      await updateBookingStatus(bookingId, "CONFIRMED");

      closeStudentModal();
      if (userId && userName) {
        fetchBookings(userId, userName);
      }
      setAlertModal({ visible: true, title: 'Booking Accepted!', body: 'You have successfully accepted this booking.', closeAll: false });
    } catch (error) {
      console.error("Failed to accept booking:", error);
      setAlertModal({ visible: true, title: 'Error', body: 'Failed to accept booking. Please try again.', closeAll: false });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await declineBooking(bookingId);
      closeStudentModal();
      if (userId && userName) {
        await fetchBookings(userId, userName);
      }
    } catch (error) {
      console.error("Failed to decline booking:", error);
      setAlertModal({ visible: true, title: 'Error', body: 'Failed to decline booking. Please try again.', closeAll: false });
    }
  };


  // --- Modal Handlers ---
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

      await updateBooking(selectedBookingForModal!.id, {
        bookingDateTime: isoDateTime,
        durationMinutes: newDuration,
      });

      if (userId && userName) {
        await fetchBookings(userId, userName);
      }

      setModalVisible(false);
      setAlertModal({ visible: true, title: 'Successfully Rescheduled!', body: 'The session has been successfully rescheduled.', closeAll: true });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      setAlertModal({ visible: true, title: 'Error', body: 'Failed to reschedule booking. Please try again.', closeAll: false });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setModalLoading(true);

      await updateBookingStatus(selectedBookingForModal!.id, 'CANCELLED');

      if (userId && userName) {
        fetchBookings(userId, userName);
      }

      setModalVisible(false);
      setAlertModal({ visible: true, title: 'Session Cancelled', body: 'The session has been successfully cancelled.', closeAll: true });
    } catch (error) {
      console.error('Error canceling booking:', error);
      setAlertModal({ visible: true, title: 'Error', body: 'Failed to cancel session. Please try again.', closeAll: false });
    } finally {
      setModalLoading(false);
    }
  };

  // Date Picker Handlers
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS if needed, close on Android
    if (event.type !== 'dismissed') {
      setShowDatePicker(false);
      setTempDate(currentDate);
    }
  };

  const onTimeChange = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || tempDate;
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type !== 'dismissed') {
      setShowTimePicker(false);
      setTempDate(currentTime);
    }
  };

  const onEndTimeChange = (event: any, selected: Date | undefined) => {
    setShowEndTimePicker(false);
    if (event.type !== 'dismissed' && selected) {
      setTempEndDate(selected);
    }
  };

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showStudents}
        pointerEvents={showStudents ? "none" : "auto"}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {displayUserName}!</Text>
            <Text style={styles.subGreeting}>Ready to teach?</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.notificationContainer}
              onPress={() => router.replace("/notification")}
            >
              <Ionicons name="notifications" size={32} color="#95CDF2" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.profilePicture} onPress={() => router.push('/(tutor)/profile')}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <Ionicons name="person-circle" size={48} color="#2B74B4" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.bookCard} onPress={() => {
          if (pendingBookings.length > 0) {
            setShowStudents(true);
            Animated.parallel([
              Animated.spring(slideAnim, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
          } else {
            console.log('No bookings available');
            alert('There are no bookings yet');
          }
        }}>
          <Text style={styles.bookCardTitle}>Student are waiting!</Text>
          <Text style={styles.bookCardSubtitle}>
            Click here to view the list of students you can teach
          </Text>
        </TouchableOpacity>

        <View style={styles.classesHeader}>
          <Text style={styles.classesTitle}>Classes</Text>

          <View style={[styles.tabContainer, { width: screenWidth * 0.46 }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "upcoming" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("upcoming")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "upcoming" && styles.activeTabText,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "past" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("past")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "past" && styles.activeTabText,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* UPDATED CLASS CARD RENDERING */}
        {displayedClasses.map((classItem: Booking) => (
          <View key={classItem.id} style={styles.newClassCard}>
            <View style={styles.newClassContentRow}>
              <View style={styles.newClassInfoCol}>
                <Text style={styles.newStudentName}>{classItem.studentName}</Text>
                <Text style={styles.newClassDetail}>{classItem.subject}</Text>
                <Text style={styles.newClassDetail}>{classItem.location}</Text>
                <Text style={styles.newClassDetail}>{formatBookingDateTime(classItem.rawDate || classItem.date)}</Text>
                <Text style={[styles.newStatusText, { color: classItem.status === 'COMPLETED' ? '#0FE40F' : classItem.status === 'CANCELLED' ? '#FF6B6B' : '#FCC419' }]}>
                  Status: {classItem.status === "CONFIRMED" ? "UPCOMING" : classItem.status}
                </Text>
              </View>
              <View style={styles.newButtonCol}>
                <TouchableOpacity
                  style={styles.newViewButton}
                  onPress={() => {
                    if (classItem.status === 'COMPLETED') {
                      const sessionDate = classItem.rawDate
                        ? new Date(classItem.rawDate).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })
                        : 'N/A';
                      router.push({
                        pathname: '/evaluation',
                        params: {
                          bookingId: classItem.id,
                          evaluationType: 'TUTOR_EVALUATES_STUDENT',
                          evaluatorId: String(userId),
                          evaluateeId: String(classItem.studentUserId),
                          evaluateeName: classItem.studentName,
                          subject: classItem.subject,
                          sessionDate,
                        },
                      });
                    } else {
                      showBookingDetailsModal(classItem);
                    }
                  }}
                >
                  <Text style={styles.newViewButtonText}>{classItem.status === 'COMPLETED' ? 'Evaluate' : 'View'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {showStudents && (
        <>
          <AnimatedView
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
            pointerEvents="none"
          />

          <AnimatedView
            style={[
              styles.studentModal,
              {
                height: modalHeight,
                transform: [{ translateY: slideAnim }],
              },
            ]}
            pointerEvents={showStudents ? "auto" : "none"}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => closeStudentModal()}>
                <Ionicons name="chevron-down" size={36} color="#2B74B4" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {pendingBookings.map((booking, index) => (
                <View key={booking.id} style={styles.studentCard}>
                  <Text style={styles.studentName}>{booking.studentName}</Text>
                  <Text style={styles.studentSub}>{booking.subject}</Text>
                  <Text style={styles.studentSub}>{booking.location}</Text>
                  <Text style={styles.studentSub}>
                    {formatBookingDateTime(booking.rawDate || booking.date)}
                  </Text>

                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptBooking(booking.id)}>
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineBooking(booking.id)}>
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={{ height: 15 }} />
            </ScrollView>
          </AnimatedView>
        </>
      )}

      {/* --- SESSION DETAILS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeBookingDetailsModal}
      >
        <BlurView intensity={10} tint="light" style={styles.absolute}>
          <View style={styles.modalContent}>

            {/* VIEW 1: Session Details */}
            {modalView === 'details' && selectedBookingForModal && (
              <>
                <Text style={styles.modalHeadline}>{selectedBookingForModal.studentName}</Text>
                <Text style={styles.modalCaption}>{selectedBookingForModal.subject}</Text>
                <Text style={styles.modalCaption}>{selectedBookingForModal.location}</Text>
                <Text style={styles.modalCaption}>{formatStartTime(selectedBookingForModal.rawDate || selectedBookingForModal.date)}</Text>
                <Text style={[styles.modalStatus, { fontSize: 12 }]}>Status: <Text style={{ color: selectedBookingForModal.status === 'COMPLETED' ? '#0FE40F' : selectedBookingForModal.status === 'CANCELLED' ? '#FF6B6B' : '#FCC419', fontWeight: '400' }}>{selectedBookingForModal.status === 'CONFIRMED' ? 'UPCOMING' : selectedBookingForModal.status}</Text></Text>

                <View style={styles.modalButtonContainer}>
                  {selectedBookingForModal.status !== 'COMPLETED' && selectedBookingForModal.status !== 'CANCELLED' && selectedBookingForModal.status !== 'DECLINED' && (
                    <>
                      <TouchableOpacity style={styles.modalChatButton} onPress={() => { closeBookingDetailsModal(); router.replace('/tutor-messages'); }}>
                        <Text style={styles.modalBtnTextWhite}>Chat with your Student</Text>
                      </TouchableOpacity>

                      {selectedBookingForModal.location === 'Online' && (
                        <TouchableOpacity
                          style={styles.modalChatButton}
                          onPress={() => {
                            closeBookingDetailsModal();
                            router.push({
                              pathname: '/meeting-lobby',
                              params: {
                                roomId: selectedBookingForModal.id,
                                userId: String(userId),
                                userName: userName,
                                isTutor: 'true',
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

                  {selectedBookingForModal.status === 'COMPLETED' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.modalRescheduleButton, { backgroundColor: '#FCC419', borderColor: '#FCC419', marginTop: 10 }]}
                        onPress={() => {
                          closeBookingDetailsModal();
                          router.replace(`/feedback?userId=${selectedBookingForModal.studentUserId}&name=${selectedBookingForModal.studentName}&bookingId=${selectedBookingForModal.id}`);
                        }}
                      >
                        <Text style={[styles.modalBtnTextWhite, { color: '#2B74B4' }]}>View Profile & Rate</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalChatButton}
                        onPress={() => {
                          closeBookingDetailsModal();
                          router.push({
                            pathname: '/evaluation',
                            params: {
                              bookingId: selectedBookingForModal.id,
                              evaluationType: 'TUTOR_EVALUATES_STUDENT',
                              evaluatorId: String(userId),
                              evaluateeId: String(selectedBookingForModal.studentUserId),
                              evaluateeName: selectedBookingForModal.studentName,
                              subject: selectedBookingForModal.subject,
                            },
                          });
                        }}
                      >
                        <Text style={styles.modalBtnTextWhite}>Evaluate Session</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  <TouchableOpacity style={styles.modalReturnButton} onPress={closeBookingDetailsModal}>
                    <Text style={styles.modalBtnTextBlue}>Return</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* VIEW 2: Reschedule */}
            {modalView === 'reschedule' && selectedBookingForModal && (
              <>
                <Text style={styles.modalSectionTitle}>Current Session</Text>
                <Text style={styles.modalTextSmall}>{selectedBookingForModal.location}</Text>
                <Text style={styles.modalTextSmall}>{formatSessionTime(selectedBookingForModal.rawDate || selectedBookingForModal.date, selectedBookingForModal.durationMinutes)}</Text>

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


          </View>
        </BlurView>
      </Modal>

      {/* --- ALERT MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={alertModal.visible} onRequestClose={() => { setAlertModal({ visible: false, title: '', body: '', closeAll: false }); if (alertModal.closeAll) closeBookingDetailsModal(); }}>
        <BlurView intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => { const shouldClose = alertModal.closeAll; setAlertModal({ visible: false, title: '', body: '', closeAll: false }); if (shouldClose) closeBookingDetailsModal(); }}>
              <Text style={styles.alertButtonText}>Return</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  greeting: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "600",
    color: "#2B74B4",
  },
  subGreeting: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  logoutButton: {
    padding: 4,
  },
  notificationContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#2B74B4",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  badgeText: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  profilePicture: {
    width: 48,
    height: 48,
  },
  bookCard: {
    backgroundColor: "#2B74B4",
    margin: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    borderRadius: 15,
  },
  bookCardTitle: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  bookCardSubtitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#fff",
  },
  classesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  classesTitle: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "600",
    color: "#2B74B4",
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: "#2B74B4",
  },
  tabText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#2B74B4",
  },
  activeTabText: {
    color: "#fff",
  },
  // New Card Styles
  newClassCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
  },
  newClassContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Aligns the View button to the bottom right relative to content
  },
  newClassInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  newStudentName: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "600",
    color: "#2B74B4",
    marginBottom: 4,
  },
  newClassDetail: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
    marginBottom: 1,
  },
  newStatusText: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  newButtonCol: {
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  newViewButton: {
    backgroundColor: "#2B74B4",
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: 'max-content',
    alignItems: "center",
  },
  newViewButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Existing styles kept for compatibility with other parts if needed
  classCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    minHeight: 115,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
  },
  classInfo: {
    flex: 1,
  },
  classHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  classHeaderLeft: {
    flex: 1,
  },
  expandButton: {
    padding: 5,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },
  acceptButton: {
    backgroundColor: "#0FE40F",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 14,
  },
  declineButton: {
    borderWidth: 2,
    borderColor: "#D10000",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  declineButtonText: {
    color: "#D10000",
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 14,
  },
  tutorName: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#2B74B4",
    marginBottom: 2,
  },
  subject: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
  },
  location: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
  },
  dateTime: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
  },
  status: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
  },
  statusOnGoing: {
    color: "#FCC419",
  },
  statusUpcoming: {
    color: "#FCC419",
  },
  statusCompleted: {
    color: "#0FE40F",
  },
  statusDeclined: {
    color: "#D10000",
  },
  statusConfirmed: {
    color: "#2B74B4",
  },
  statusCancelled: {
    color: "#D10000",
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
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  bottomSpacing: {
    height: 15,
  },

  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
  },

  studentModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    zIndex: 999,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
    padding: 18,
    marginBottom: 15,
  },
  studentName: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#2B74B4",
  },
  studentSub: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#95CDF2",
    marginTop: 2,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  acceptBtn: {
    backgroundColor: "#0FE40F",
    width: "45%",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 14,
  },
  declineBtn: {
    borderWidth: 2,
    borderColor: "#D10000",
    width: "45%",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  declineText: {
    color: "#D10000",
    fontFamily: "Poppins",
    fontWeight: "600",
    fontSize: 14,
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
