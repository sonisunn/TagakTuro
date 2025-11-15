import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import TutorBottomNav from "../components/TutorBottomNav";
import { Animated, Dimensions } from "react-native";
import { BlurView } from "expo-blur";

export default function TagakTuroHomepage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userName, setUserName] = useState("");
  const [showStudents, setShowStudents] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserName(userData.name || "User");
      }
    };

    fetchUserData();
  }, []);

  const upcomingClasses = [
    {
      id: 1,
      tutor: "Juan Dela Cruz",
      subject: "Quantum Mechanics",
      location: "Online Modality",
      dateTime: "September 25, 2025 | 8:00 am",
      status: "ON GOING",
    },
    {
      id: 2,
      tutor: "Jose Rizal",
      subject: "Thermodynamics",
      location: "UMak HPSB Library",
      dateTime: "September 19, 2025 | 3:30 pm",
      status: "UPCOMING",
    },
    {
      id: 3,
      tutor: "Hev Study",
      subject: "Quantum Mechanics",
      location: "UMak HPSB Library",
      dateTime: "September 25, 2025 | 8:00 am",
      status: "UPCOMING",
    },
  ];

  const pastClasses = [
    {
      id: 4,
      tutor: "Maria Santos",
      subject: "Calculus",
      location: "Online Modality",
      dateTime: "September 20, 2025 | 10:00 am",
      status: "COMPLETED",
    },
  ];

  const displayedClasses =
    activeTab === "upcoming" ? upcomingClasses : pastClasses;

  const screenHeight = Dimensions.get("screen").height;
  const modalHeight = screenHeight * 0.8;
  const slideAnim = useRef(new Animated.Value(modalHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openStudentModal = () => {
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
    ]).start(() => setShowStudents(false));
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
                <Text style={styles.greeting}>Hi, {userName}!</Text>
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

            <View style={styles.bookCard}>
            <Text style={styles.bookCardTitle}>Students are waiting!</Text>
            <Text style={styles.bookCardSubtitle}>
                Click here to view the list of students you can teach
            </Text>
            </View>

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

            {displayedClasses.map((classItem) => (
            <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                <Text style={styles.tutorName}>{classItem.tutor}</Text>
                <Text style={styles.subject}>{classItem.subject}</Text>
                <Text style={styles.location}>{classItem.location}</Text>
                <Text style={styles.dateTime}>{classItem.dateTime}</Text>

                <Text
                    style={[
                    styles.status,
                    classItem.status === "ON GOING" && styles.statusOnGoing,
                    classItem.status === "UPCOMING" && styles.statusUpcoming,
                    classItem.status === "COMPLETED" && styles.statusCompleted,
                    ]}
                >
                    Status: {classItem.status}
                </Text>
                </View>

                <TouchableOpacity
                style={styles.viewButton}
                onPress={openStudentModal}
                >
                <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
            </View>
            ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {showStudents && (
        <>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: backdropOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
          </Animated.View>

          <Animated.View
            style={[
              styles.studentModal,
              {
                height: modalHeight,
                transform: [{ translateY: slideAnim }],
              },
            ]}
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
                {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.studentCard}>
                    <Text style={styles.studentName}>Juan Dela Cruz</Text>
                    <Text style={styles.studentSub}>Quantum Mechanics</Text>
                    <Text style={styles.studentSub}>Online Modality</Text>
                    <Text style={styles.studentSub}>
                    September 25, 2025 | 8:00 am
                    </Text>

                    <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.acceptBtn}>
                        <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.declineBtn}>
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                ))}

            <View style={{ height: 15 }} />
          </ScrollView>
          </Animated.View>
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
