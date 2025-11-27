import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import TutorBottomNav from '../components/TutorBottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPendingBookings } from '../src/api/booking';

// TypeScript interfaces
interface TimeSlot {
  start: number;
  end: number;
}

interface DaySchedule {
  id: number;
  label: string;
  slots: TimeSlot[];
}

interface PendingBooking {
  id: string;
  subject?: string;
  studentName?: string;
  bookingDateTime: string;
  modality?: string;
  venue?: string;
}

export default function AvailabilityPage() {
  const initialDays = [
    { id: 0, label: 'S', slots: [] },
    { id: 1, label: 'M', slots: [] },
    { id: 2, label: 'T', slots: [] },
    { id: 3, label: 'W', slots: [] },
    { id: 4, label: 'T', slots: [] },
    { id: 5, label: 'F', slots: [] },
    { id: 6, label: 'S', slots: [] },
  ];

  const [schedule, setSchedule] = useState<DaySchedule[]>(initialDays);

  // Load saved availability on component mount
  useEffect(() => {
    const loadSavedAvailability = async () => {
      try {
        const savedAvailability = await AsyncStorage.getItem('tutorAvailability');
        if (savedAvailability) {
          const parsedSchedule = JSON.parse(savedAvailability);
          setSchedule(parsedSchedule);
        }
      } catch (error) {
        console.warn('Error loading saved availability:', error);
      }
    };

    loadSavedAvailability();
  }, []);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<boolean>(false);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Pending bookings modal state
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [filteredBookings, setFilteredBookings] = useState<PendingBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  const addSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    const defaultStart = new Date();
    defaultStart.setHours(9, 0, 0, 0);
    const defaultEnd = new Date();
    defaultEnd.setHours(12, 0, 0, 0);

    // Store just the time in minutes from midnight, not full timestamp
    const startMinutes = 9 * 60; // 9:00 AM = 540 minutes
    const endMinutes = 12 * 60; // 12:00 PM = 720 minutes

    newSchedule[dayIndex].slots.push({
      start: startMinutes,
      end: endMinutes,
    });
    setSchedule(newSchedule);
    setErrorMessage(false);
    setSuccessMessage(false);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
    setSuccessMessage(false);
  };

  const openTimePicker = (dayIndex: number, slotIndex: number, type: 'start' | 'end') => {
    const currentMinutes = schedule[dayIndex].slots[slotIndex][type];
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;

    const tempDateTime = new Date();
    tempDateTime.setHours(hours, minutes, 0, 0);
    setTempDate(tempDateTime);

    setActiveDayIndex(dayIndex);
    setActiveSlotIndex(slotIndex);
    setPickerMode(type);
    setShowModal(true);
  };

  const onTimeChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const saveTimeSelection = () => {
    if (activeDayIndex !== null && activeSlotIndex !== null && pickerMode) {
      const newSchedule = [...schedule];
      // Convert selected time to minutes from midnight
      const minutesFromMidnight = tempDate.getHours() * 60 + tempDate.getMinutes();
      newSchedule[activeDayIndex].slots[activeSlotIndex][pickerMode] = minutesFromMidnight;
      setSchedule(newSchedule);
      setShowModal(false);
    }
  };

  const formatTime = (minutesFromMidnight: number) => {
    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = minutesFromMidnight % 60;
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatBookingTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${formattedDate} at ${formattedTime}`;
    } catch {
      return 'Invalid date';
    }
  };

  const handleSubmit = async () => {
    const hasSlots = schedule.some(day => day.slots.length > 0);

    if (hasSlots) {
        // Save availability schedule to AsyncStorage
        await AsyncStorage.setItem('tutorAvailability', JSON.stringify(schedule));

        // Filter pending bookings based on availability
        await filterPendingBookings();

        setSuccessMessage(true);
        setErrorMessage(false);
    } else {
        setSuccessMessage(false);
        setErrorMessage(true);
    }
  };

  const filterPendingBookings = async () => {
    try {
      setLoadingBookings(true);
      const pendingBookingsResponse = await getPendingBookings();
      const pendingBookings = pendingBookingsResponse || [];


      // Filter bookings that match tutor's availability
      const filtered = pendingBookings.filter((booking: any) => {
        if (!booking.bookingDateTime) return false;

        try {
          const bookingDate = new Date(booking.bookingDateTime);
          const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          // Find availability slots for this day
          const dayAvailability = schedule.find(day => day.id === dayOfWeek);
          if (!dayAvailability || dayAvailability.slots.length === 0) {
            return false; // No availability for this day
          }

          // Check if booking time falls within any available slot
          const bookingTime = bookingDate.getHours() * 60 + bookingDate.getMinutes(); // Convert to minutes

          return dayAvailability.slots.some(slot => {
            // slot.start and slot.end are now stored as minutes from midnight
            const startTime = slot.start;
            const endTime = slot.end;

            // Check if booking time is within the slot
            return bookingTime >= startTime && bookingTime <= endTime;
          });
        } catch (error) {
          return false; // Skip invalid dates
        }
      });

      setFilteredBookings(filtered);

      // Show modal if there are matching bookings
      if (filtered.length > 0) {
        setShowPendingModal(true);
      }

    } catch (error) {
      // Error handled by console suppression in _layout.tsx
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleReset = () => {
      const clearedSchedule = schedule.map(day => ({ ...day, slots: [] }));
      setSchedule(clearedSchedule);
      setSuccessMessage(false);
      setErrorMessage(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Session Availability</Text>
          <Text style={styles.headerSubtitle}>Set your preferred time to tutor</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Weekly hours</Text>

            {schedule.map((day, dayIndex) => (
                <View key={day.id} style={styles.dayRow}>
                    <View style={styles.dayCircle}>
                        <Text style={styles.dayText}>{day.label}</Text>
                    </View>

                    <View style={styles.slotsContainer}>
                        {day.slots.length === 0 ? (
                            <View style={styles.unavailableContainer}>
                                <Text style={styles.unavailableText}>Unavailable</Text>
                                <TouchableOpacity onPress={() => addSlot(dayIndex)}>
                                    <Ionicons name="add-circle-outline" size={28} color="#2B74B4" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                {day.slots.map((slot, slotIndex) => (
                                    <View key={slotIndex} style={styles.timeSlotRow}>
                                        <TouchableOpacity 
                                            style={styles.timeInput}
                                            onPress={() => openTimePicker(dayIndex, slotIndex, 'start')}
                                        >
                                            <Text style={styles.timeText}>{formatTime(slot.start)}</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.dash}>-</Text>

                                        <TouchableOpacity 
                                            style={styles.timeInput}
                                            onPress={() => openTimePicker(dayIndex, slotIndex, 'end')}
                                        >
                                            <Text style={styles.timeText}>{formatTime(slot.end)}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.deleteBtn}
                                            onPress={() => removeSlot(dayIndex, slotIndex)}
                                        >
                                            <Ionicons name="close-circle-outline" size={28} color="#FF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            ))}
        </View>
      </ScrollView>

      <View style={styles.fixedFooter}>
        {errorMessage && (
            <View style={[styles.notificationBox, styles.errorBox]}>
                <Text style={styles.errorText}>
                    This time slot is already booked. Please manage your time before editing availability
                </Text>
            </View>
        )}
        
        {successMessage && (
            <View style={[styles.notificationBox, styles.successBox]}>
                <Text style={styles.successText}>
                    Your availability has been updated successfully
                </Text>
            </View>
        )}

        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <BlurView intensity={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {pickerMode === 'start' ? 'Start' : 'End'} Time
            </Text>

            <DateTimePicker
              value={tempDate}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={onTimeChange}
              textColor="#000"
              style={styles.picker}
            />

            <TouchableOpacity style={styles.closeModalButton} onPress={saveTimeSelection}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* Pending Bookings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPendingModal}
        onRequestClose={() => setShowPendingModal(false)}
      >
        <BlurView intensity={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, styles.pendingModalContent]}>
            <Text style={styles.modalTitle}>Pending Bookings</Text>
            <Text style={styles.pendingSubtitle}>
              Bookings that match your availability:
            </Text>

            <ScrollView style={styles.pendingBookingsList} showsVerticalScrollIndicator={false}>
              {loadingBookings ? (
                <Text style={styles.loadingText}>Loading bookings...</Text>
              ) : filteredBookings.length === 0 ? (
                <Text style={styles.noBookingsText}>No pending bookings match your availability.</Text>
              ) : (
                filteredBookings.map((booking: PendingBooking, index: number) => (
                  <View key={booking.id || index} style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <Text style={styles.bookingSubject}>{booking.subject || 'N/A'}</Text>
                      <Text style={styles.bookingStatus}>PENDING</Text>
                    </View>
                    <Text style={styles.bookingStudent}>
                      Student: {booking.studentName || 'Unknown'}
                    </Text>
                    <Text style={styles.bookingTime}>
                      {formatBookingTime(booking.bookingDateTime)}
                    </Text>
                    <Text style={styles.bookingLocation}>
                      {booking.modality === 'In-Person' && booking.venue ? booking.venue : booking.modality || 'N/A'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeModalButton, styles.pendingCloseButton]}
              onPress={() => setShowPendingModal(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: '#2B74B4',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#95CDF2',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 15,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  dayCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#2B74B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 5,
  },
  dayText: {
    color: '#fff',
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
  },
  slotsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
  },
  unavailableText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#2B74B4',
    fontWeight: '600',
    marginRight: 10,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2B74B4',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#2B74B4',
    fontWeight: '600',
  },
  dash: {
    marginHorizontal: 8,
    color: '#2B74B4',
    fontSize: 20,
  },
  deleteBtn: {
    marginLeft: 8,
  },
  fixedFooter: {
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
    paddingTop: 10,
  },
  notificationBox: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  errorBox: {
    borderColor: '#FF4444',
    backgroundColor: '#fff',
  },
  successBox: {
    borderColor: '#2B74B4',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#FF4444',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  successText: {
    color: '#2B74B4',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  resetButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2B74B4',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#2B74B4',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#2B74B4',
  },
  submitButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B74B4',
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: '#2B74B4',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  closeModalButton: {
    marginTop: 10,
    backgroundColor: '#2B74B4',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 15,
  },

  // Pending Bookings Modal Styles
  pendingModalContent: {
    maxHeight: '70%',
    width: '90%',
  },
  pendingSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  pendingBookingsList: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 15,
  },
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noBookingsText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bookingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingSubject: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: '#2B74B4',
  },
  bookingStatus: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bookingStudent: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  bookingTime: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  bookingLocation: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#666',
  },
  pendingCloseButton: {
    marginTop: 0,
  },
});