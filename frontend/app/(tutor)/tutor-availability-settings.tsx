import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { API_BASE_URL } from '../../src/api/config';

SplashScreen.preventAutoHideAsync();

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AvailabilitySlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export default function TutorAvailabilitySettings() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [tutorId, setTutorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [startTime, setStartTime] = useState<Date>(new Date(0, 0, 0, 9, 0));
  const [endTime, setEndTime] = useState<Date>(new Date(0, 0, 0, 17, 0));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      initializeScreen();
    }
  }, [fontsLoaded]);

  const initializeScreen = async () => {
    try {
      const storedTutorId = await AsyncStorage.getItem('tutorId');
      const tutorUserId = await AsyncStorage.getItem('userId');

      if (storedTutorId) {
        setTutorId(parseInt(storedTutorId));
        fetchAvailabilities(parseInt(storedTutorId));
      } else if (tutorUserId) {
        // Fallback: use userId
        setTutorId(parseInt(tutorUserId));
        fetchAvailabilities(parseInt(tutorUserId));
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      Alert.alert('Error', 'Failed to load availability data');
    } finally {
      setLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  const fetchAvailabilities = async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tutor/availability/${id}`);
      setAvailabilities(response.data.availabilities || []);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      setAvailabilities([]);
    }
  };

  const timeToString = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const validateTimes = (): boolean => {
    const startStr = timeToString(startTime);
    const endStr = timeToString(endTime);
    if (startStr >= endStr) {
      Alert.alert('Invalid Time Range', 'End time must be after start time');
      return false;
    }
    return true;
  };

  const handleAddAvailability = async () => {
    if (!tutorId || !validateTimes()) return;

    try {
      setLoading(true);
      const startTimeStr = timeToString(startTime);
      const endTimeStr = timeToString(endTime);

      const response = await axios.post(`${API_BASE_URL}/api/tutor/availability`, null, {
        params: {
          tutorId,
          dayOfWeek: selectedDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
        },
      });

      if (response.data) {
        Alert.alert('Success', 'Availability added successfully');
        await fetchAvailabilities(tutorId);
        setShowModal(false);
        // Reset form
        setSelectedDay('MONDAY');
        setStartTime(new Date(0, 0, 0, 9, 0));
        setEndTime(new Date(0, 0, 0, 17, 0));
      }
    } catch (error: any) {
      console.error('Error adding availability:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add availability';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvailability = async (slotId: number) => {
    if (!tutorId) return;

    Alert.alert(
      'Delete Availability',
      'Are you sure you want to delete this availability slot?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_BASE_URL}/api/tutor/availability/${slotId}`);
              Alert.alert('Success', 'Availability deleted successfully');
              await fetchAvailabilities(tutorId);
            } catch (error: any) {
              console.error('Error deleting availability:', error);
              Alert.alert('Error', 'Failed to delete availability');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  const renderAvailabilitySlot = ({ item }: { item: AvailabilitySlot }) => {
    const dayLabel = DAY_LABELS[DAYS_OF_WEEK.indexOf(item.dayOfWeek)];
    return (
      <View style={styles.slotCard}>
        <View style={styles.slotInfo}>
          <Text style={styles.dayText}>{dayLabel}</Text>
          <Text style={styles.timeText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteAvailability(item.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && availabilities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Availability Settings',
            headerShown: true,
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Availability Settings',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Availability Slots</Text>
          <Text style={styles.sectionDescription}>
            Set your available days and times. Students will only see you when you're available.
          </Text>
        </View>

        {availabilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No availability slots set yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first availability to start accepting students
            </Text>
          </View>
        ) : (
          <FlatList
            data={availabilities}
            renderItem={renderAvailabilitySlot}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Availability</Text>
      </TouchableOpacity>

      {/* Modal for adding availability */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Availability</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Day Selection */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Day of Week</Text>
              <View style={styles.dayGrid}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDay === day && styles.dayButtonActive,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDay === day && styles.dayButtonTextActive,
                      ]}
                    >
                      {DAY_LABELS[index].substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Start Time */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity
                style={styles.timePicker}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#FF6B35" />
                <Text style={styles.timePickerText}>{timeToString(startTime)}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartTimeChange}
                />
              )}
            </View>

            {/* End Time */}
            <View style={styles.formSection}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity
                style={styles.timePicker}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#FF6B35" />
                <Text style={styles.timePickerText}>{timeToString(endTime)}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndTimeChange}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={handleAddAvailability}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Save Availability</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotInfo: {
    flex: 1,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FF6B35',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: '30%',
    aspectRatio: 1.2,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dayButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  dayButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  timePicker: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  timePickerText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginLeft: 8,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#FF6B35',
  },
  buttonPrimaryText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonSecondary: {
    backgroundColor: '#F0F0F0',
  },
  buttonSecondaryText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
