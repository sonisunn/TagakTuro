import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";

const AnimatedView = Animated.createAnimatedComponent(View);
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import TutorBottomNav from "../components/TutorBottomNav";
import { BlurView } from "expo-blur";
import { getAllBookings, updateBookingStatus } from "../src/api/booking";
import * as SplashScreen from "expo-splash-screen";
import { isPast } from "date-fns";

import {
    useFonts,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  } from "@expo-google-fonts/poppins";

interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  subject: string;
  location: string;
  date: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "DECLINED" | "CANCELLED";
}

export default function TagakTuroHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userName, setUserName] = useState("");
  const [displayUserName, setDisplayUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState<Booking[]>([]);
  const [pastClasses, setPastClasses] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalHeight = Dimensions.get("window").height * 0.5;

  const fetchBookings = async (tutorId: string, tutorName: string) => {
    if (!tutorId || !tutorName) return;
    try {
      const response = await getAllBookings();
      const allBookings = response.data;

      const filteredBookings = allBookings.filter(
        (booking: Booking) => booking.tutorId === tutorId && booking.tutorName === tutorName
      );

      const upcoming: Booking[] = [];
      const past: Booking[] = [];
      const pending: Booking[] = [];

      filteredBookings.forEach((booking: Booking) => {
        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
        if (booking.status === "PENDING") {
          pending.push(booking);
        } else if (isPast(bookingDateTime)) {
            past.push(booking);
        } else {
            upcoming.push(booking);
        }
      });

      setUpcomingClasses(upcoming);
      setPastClasses(past);
      setPendingBookings(pending);
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
        setUserName(fullName); // Use full name for filtering
        setDisplayUserName(firstName); // Use first name for display
        setUserId(userData.id); // Assuming userData contains the tutor's ID
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBookings(userId, userName);
    }
  }, [userId, userName]);

  if (!fontsLoaded) {
    return null;
  }

  const displayedClasses =
    activeTab === "upcoming"
      ? upcomingClasses
      : activeTab === "past"
      ? pastClasses
      : pendingBookings;

  const openStudentModal = (booking: Booking) => {
    setSelectedBooking(booking);
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
      setSelectedBooking(null);
    });
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "CONFIRMED"); // Change status to CONFIRMED
      closeStudentModal();
      if (userId) {
        fetchBookings(userId, userName); // Re-fetch bookings to update the lists
      }
    } catch (error) {
      console.error("Failed to accept booking:", error);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "DECLINED");
      closeStudentModal();
      if (userId) {
        fetchBookings(userId, userName); // Re-fetch bookings to update the lists
      }
    } catch (error) {
      console.error("Failed to decline booking:", error);
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

                <View style={styles.profilePicture}>
                <Ionicons name="person-circle" size={48} color="#2B74B4" />
                </View>
            </View>
            </View>

            <TouchableOpacity style={styles.bookCard} onPress={() => setActiveTab("pending")}>
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
                    activeTab === "pending" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("pending")}
                >
                <Text
                    style={[
                    styles.tabText,
                    activeTab === "pending" && styles.activeTabText,
                    ]}
                >
                    Pending
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.tab, activeTab === "past" && styles.activeTab]}
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

            {displayedClasses.map((classItem: Booking) => (
            <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                <Text style={styles.tutorName}>{classItem.studentName}</Text>
                <Text style={styles.subject}>{classItem.subject}</Text>
                <Text style={styles.location}>{classItem.location}</Text>
                <Text style={styles.dateTime}>{`${classItem.date} | ${classItem.time}`}</Text>

                {activeTab !== "pending" && (
                    <Text
                    style={[
                        styles.status,
                        classItem.status === "CONFIRMED" && styles.statusConfirmed,
                        classItem.status === "COMPLETED" && styles.statusCompleted,
                        classItem.status === "DECLINED" && styles.statusDeclined,
                        classItem.status === "CANCELLED" && styles.statusCancelled,
                    ]}
                    >
                    Status: {classItem.status === "CONFIRMED" ? "Confirmed" : classItem.status === "CANCELLED" ? "Cancelled" : classItem.status}
                  </Text>
                )}
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => openStudentModal(classItem)}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
            </View>
            ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {showStudents && selectedBooking && (
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
                <View style={styles.studentCard}>
                    <Text style={styles.studentName}>{selectedBooking.studentName}</Text>
                    <Text style={styles.studentSub}>{selectedBooking.subject}</Text>
                    <Text style={styles.studentSub}>{selectedBooking.location}</Text>
                    <Text style={styles.studentSub}>
                    {`${selectedBooking.date} | ${selectedBooking.time}`}
                    </Text>

                    <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptBooking(selectedBooking.id)}>
                        <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineBooking(selectedBooking.id)}>
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    </View>
                </View>

            <View style={{ height: 15 }} />
          </ScrollView>
          </AnimatedView>
        </>
      )}


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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "700",
    color: "#2B74B4",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 25,
    height: 35,
    width: 167,
    alignItems: "center",
    borderColor: "#2B74B4",
    borderWidth: 1,
  },
  tab: {
    height: 35,
    paddingVertical: 6,
    paddingHorizontal: 16.5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#2B74B4",
  },
  tabText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#2B74B4",
  },
  activeTabText: {
    color: "#fff",
  },
  classCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    height: 115,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  classInfo: {
    flex: 1,
  },
  tutorName: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "700",
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
    color: "#2B74B4", // A suitable color for confirmed status
  },
  statusCancelled: {
    color: "#D10000", // Same as declined, or a different shade of red
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "700",
    fontSize: 14,
  },
});
