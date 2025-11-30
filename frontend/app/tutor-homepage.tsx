import { Stack, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
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

const AnimatedView = Animated.createAnimatedComponent(View);
import TutorBottomNav from "../components/TutorBottomNav";
import { updateBookingStatus, getPendingBookings, getBookingsByTutorName, updateBooking } from "../src/api/booking.js";
 
interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
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
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userName, setUserName] = useState("");
  const [displayUserName, setDisplayUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState<Booking[]>([]);
  const [pastClasses, setPastClasses] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalHeight = Dimensions.get("window").height * 0.5;

  // --- Modal State Management ---
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [modalView, setModalView] = useState<string>('details'); // 'details', 'reschedule', 'success', 'cancel', 'cancelSuccess'
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // --- Date/Time Picker State ---
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
 
  // Transform backend booking format to frontend format
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

  const transformBooking = (booking: any): Booking | null => {
    try {
      // Force UTC interpretation for consistent date parsing
      const dateTimeString = booking.bookingDateTime;
      const utcDateTimeString = dateTimeString.includes('Z') ? dateTimeString : dateTimeString + 'Z';
      const bookingDateTime = utcDateTimeString
        ? new Date(utcDateTimeString)
        : null;

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
      return null;
    }
  };
 
  const filterBookingsByAvailability = (bookings: any[], availability: any[]) => {
    console.log('🔍 Filtering function called with:', { bookingsCount: bookings.length, availability });

    // Check if any day has availability slots set
    const hasAnyAvailability = availability && availability.some((day: any) =>
      day.slots && day.slots.length > 0
    );

    if (!availability || availability.length === 0 || !hasAnyAvailability) {
      console.log('🔍 No availability set, hiding all pending bookings');
      return []; // If no availability set, show no bookings
    }

    return bookings.filter((booking: any) => {
      // Use rawDate from transformed booking, or bookingDateTime from raw booking
      const dateTimeString = booking.rawDate || booking.bookingDateTime;
      
      if (!dateTimeString) {
        console.log('🔍 Booking missing dateTime:', booking.id);
        return false;
      }

      try {
        // Parse the booking date/time
        const utcDateTimeString = dateTimeString.includes('Z') ? dateTimeString : dateTimeString + 'Z';
        const bookingDate = new Date(utcDateTimeString);
        
        if (isNaN(bookingDate.getTime())) {
          console.log('🔍 Invalid date for booking:', booking.id, dateTimeString);
          return false;
        }

        const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const bookingStartTime = bookingDate.getHours() * 60 + bookingDate.getMinutes();
        
        // Get booking duration (default to 60 minutes if not specified)
        const durationMinutes = booking.durationMinutes || 60;
        const bookingEndTime = bookingStartTime + durationMinutes;

        console.log(`🔍 Checking booking ${booking.id}:`);
        console.log(`   Raw dateTime: ${dateTimeString}`);
        console.log(`   Parsed date: ${bookingDate.toISOString()}`);
        console.log(`   Day of week: ${dayOfWeek} (0=Sun, 1=Mon, etc.)`);
        console.log(`   Booking time range: ${bookingStartTime} to ${bookingEndTime} minutes (${Math.floor(bookingStartTime/60)}:${String(bookingStartTime%60).padStart(2,'0')} - ${Math.floor(bookingEndTime/60)}:${String(bookingEndTime%60).padStart(2,'0')})`);
        console.log(`   Duration: ${durationMinutes} minutes`);

        // Find availability slots for this day
        const dayAvailability = availability.find((day: any) => day.id === dayOfWeek);
        console.log(`🔍 Looking for day ${dayOfWeek} in availability:`, availability.map((d: any) => ({ id: d.id, label: d.label, slotsCount: d.slots?.length || 0 })));

        if (!dayAvailability || !dayAvailability.slots || dayAvailability.slots.length === 0) {
          console.log(`🔍 No availability for day ${dayOfWeek}`);
          return false; // No availability for this day
        }

        // Check if booking time range overlaps with any availability slot
        const matches = dayAvailability.slots.some((slot: any) => {
          const slotStartTime = slot.start;
          const slotEndTime = slot.end;
          
          // Check if booking overlaps with slot
          // Booking overlaps if: booking starts before slot ends AND booking ends after slot starts
          const overlaps = bookingStartTime < slotEndTime && bookingEndTime > slotStartTime;
          
          // Also check if booking is completely within slot (optional, but more strict)
          const withinSlot = bookingStartTime >= slotStartTime && bookingEndTime <= slotEndTime;

          console.log(`🔍 Checking slot ${slotStartTime}-${slotEndTime} (${Math.floor(slotStartTime/60)}:${String(slotStartTime%60).padStart(2,'0')} - ${Math.floor(slotEndTime/60)}:${String(slotEndTime%60).padStart(2,'0')})`);
          console.log(`   Overlaps: ${overlaps}, Within: ${withinSlot}`);
          
          return overlaps;
        });

        console.log(`🔍 Booking ${booking.id} final result: ${matches}`);
        return matches;

      } catch (error) {
        console.log('🔍 Error processing booking:', error, booking);
        return false; // Skip invalid dates
      }
    });
  };

  const fetchBookings = async (tutorId: string, tutorName: string) => {
    if (!tutorId || !tutorName) return;
    try {
      // Fetch all pending bookings (for tutors to see all available bookings)
      const pendingResponse = await getPendingBookings();
      const allPendingBookings = Array.isArray(pendingResponse) ? pendingResponse : [];

      // Fetch bookings assigned to this tutor (confirmed/accepted bookings)
      const tutorBookingsResponse = await getBookingsByTutorName(tutorName);
      const tutorBookings = Array.isArray(tutorBookingsResponse) ? tutorBookingsResponse : [];

      // Load tutor's availability schedule
      const availabilitySchedule = await AsyncStorage.getItem('tutorAvailability');
      const parsedAvailability = availabilitySchedule ? JSON.parse(availabilitySchedule) : [];

      // Debug logging
      console.log('🔍 Tutor availability loaded:', parsedAvailability);
      console.log('🔍 All pending bookings before filtering:', allPendingBookings.length);
      console.log('🔍 Sample booking data:', allPendingBookings.slice(0, 2));

      // Filter pending bookings based on tutor's availability (filter raw bookings first)
      const filteredRawPending = filterBookingsByAvailability(allPendingBookings, parsedAvailability);
      console.log('🔍 Filtered raw pending bookings:', filteredRawPending.length);

      // Transform bookings after filtering
      const transformedPending = filteredRawPending
        .map(transformBooking)
        .filter((b): b is Booking => b !== null);

      const transformedTutor = tutorBookings
        .map(transformBooking)
        .filter((b): b is Booking => b !== null);

      console.log('🔍 Transformed pending bookings:', transformedPending.length);
      console.log('🔍 Sample transformed booking:', transformedPending.slice(0, 2));

      // Separate tutor's bookings by status
      const upcoming: Booking[] = [];
      const completed: Booking[] = [];

      transformedTutor.forEach((booking: Booking) => {
        if (booking.status === "CONFIRMED") {
            upcoming.push(booking);
        } else if (booking.status === "COMPLETED") {
          completed.push(booking);
        }
      });

      setPendingBookings(transformedPending);
      setUpcomingClasses(upcoming);
      setPastClasses(completed);
      } catch (error) {
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
 
  const loadUserData = async () => {
    const userDataString = await AsyncStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const fullName = userData.name || "User";
      const firstName = fullName.split(' ')[0];
      setUserName(fullName); // Use full name for filtering
      setDisplayUserName(firstName); // Use first name for display
      setUserId(userData.id); // Assuming userData contains the tutor's ID
    }

    // Load profile image
    const savedImage = await AsyncStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    } else {
      setProfileImage(null);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload profile data when returning to homepage from profile page
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );
 
  useEffect(() => {
    if (userId) {
      fetchBookings(userId, userName);
      // Set up polling every 5 seconds to see real-time updates from students
      const interval = setInterval(() => {
        fetchBookings(userId, userName);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [userId, userName]); // eslint-disable-line react-hooks/exhaustive-deps
 
  if (!fontsLoaded) {
    return null;
  }
 
  const displayedClasses =
    activeTab === "upcoming"
      ? upcomingClasses
      : pastClasses;
 
 
  const showBookingDetailsModal = (booking: Booking) => {
    setSelectedBookingForModal(booking);
    // Initialize picker with current booking date or now
    setTempDate(booking.rawDate ? new Date(booking.rawDate) : new Date());
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
      // Find the booking from pendingBookings
      const bookingToAccept = pendingBookings.find(b => b.id === bookingId);
      if (!bookingToAccept) {
        return;
      }
 
      // First update the booking status to CONFIRMED
      await updateBookingStatus(bookingId, "CONFIRMED");
 
      // Then update the booking with tutor name assignment
      const updatedBooking = { ...bookingToAccept, status: "CONFIRMED", tutorName: userName };
      await updateBooking(bookingId, updatedBooking);
 
      closeStudentModal();
      if (userId && userName) {
        fetchBookings(userId, userName); // Re-fetch bookings to update the lists
      }
      Alert.alert('Success', 'Booking accepted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept booking. Please try again.');
    }
  };
 
  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "CANCELLED");
      closeStudentModal();
      if (userId && userName) {
        fetchBookings(userId, userName); // Re-fetch bookings to update the lists
      }
    } catch (error) {
    }
  };
 

  // --- Modal Handlers ---
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
      await updateBooking(selectedBookingForModal!.id, {
        bookingDateTime: isoDateTime
      });

      // Refresh bookings to show updated data
      if (userId && userName) {
        fetchBookings(userId, userName);
      }

      setModalView('success');
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule booking. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setModalLoading(true);

      // Call API to cancel booking
      await updateBookingStatus(selectedBookingForModal!.id, 'CANCELLED');

      // Refresh bookings to show updated data
      if (userId && userName) {
        fetchBookings(userId, userName);
      }

      setModalView('cancelSuccess');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
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
                onPress={() => router.push("/notification")}
                >
                <Ionicons name="notifications" size={32} color="#95CDF2" />
                <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>2</Text>
                </View>
                </TouchableOpacity>
 
                <TouchableOpacity
                  style={styles.profilePicture}
                  onPress={() => router.push('/profile')}
                >
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
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
                alert('There are no bookings yet');
              }
            }}>
            <Text style={styles.bookCardTitle}>Students are waiting!</Text>
            <Text style={styles.bookCardSubtitle}>
                Click here to view the list of students you can teach
            </Text>
            </TouchableOpacity>
 
            <View style={styles.classesHeader}>
            <Text style={styles.classesTitle}>Classes</Text>
 
            <View style={styles.tabContainer}>
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
                      <Text style={styles.newStatusText}>
                        Status: {classItem.status === "CONFIRMED" ? "UPCOMING" : classItem.status} 
                      </Text>
                    </View>
                    <View style={styles.newButtonCol}>
                      <TouchableOpacity
                        style={styles.newViewButton}
                        onPress={() => {
                            showBookingDetailsModal(classItem);
                        }}
                      >
                        <Text style={styles.newViewButtonText}>View</Text>
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
                <Text style={[styles.modalStatus, { fontSize: 12 }]}>Status: <Text style={{color: '#95CDF2', fontWeight: '400'}}>{selectedBookingForModal.status}</Text></Text>
 
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity style={styles.modalChatButton}>
                        <Text style={styles.modalBtnTextWhite}>Chat with your Student</Text>
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
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Text style={styles.successTitle}>Successfully Rescheduled!</Text>
                <Text style={styles.successCaption}>Click Return to go back to the homepage</Text>

                <TouchableOpacity style={[styles.modalReturnButton, { width: '100%', marginTop: 20 }]} onPress={closeBookingDetailsModal}>
                  <Text style={styles.modalBtnTextBlue}>Return</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* VIEW 4: Cancel Confirmation */}
            {modalView === 'cancel' && (
              <View style={{alignItems: 'center'}}>
                <Text style={[styles.cancelHeadline, {marginBottom: 20, textAlign: 'center'}]}>
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
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Text style={styles.successTitle}>Session Cancelled</Text>
                <Text style={styles.successCaption}>Click Return to go back to the homepage</Text>

                <TouchableOpacity style={[styles.modalReturnButton, { width: '100%', marginTop: 20 }]} onPress={closeBookingDetailsModal}>
                  <Text style={styles.modalBtnTextBlue}>Return</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </BlurView>
      </Modal>
 
      <TutorBottomNav />
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
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    color: "#FCC419", // Yellow/Gold
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
    width: 100,
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