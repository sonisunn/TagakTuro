import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import TutorBottomNav from '../components/TutorBottomNav';

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

  const [schedule, setSchedule] = useState(initialDays);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const addSlot = (dayIndex) => {
    const newSchedule = [...schedule];
    const defaultStart = new Date();
    defaultStart.setHours(9, 0, 0, 0);
    const defaultEnd = new Date();
    defaultEnd.setHours(12, 0, 0, 0);

    newSchedule[dayIndex].slots.push({
      start: defaultStart.getTime(),
      end: defaultEnd.getTime(),
    });
    setSchedule(newSchedule);
    setErrorMessage(false);
    setSuccessMessage(false);
  };

  const removeSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
    setSuccessMessage(false);
  };

  const openTimePicker = (dayIndex, slotIndex, type) => {
    const currentTimestamp = schedule[dayIndex].slots[slotIndex][type];
    setTempDate(new Date(currentTimestamp));
    setActiveDayIndex(dayIndex);
    setActiveSlotIndex(slotIndex);
    setPickerMode(type);
    setShowModal(true);
  };

  const onTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const saveTimeSelection = () => {
    const newSchedule = [...schedule];
    newSchedule[activeDayIndex].slots[activeSlotIndex][pickerMode] = tempDate.getTime();
    setSchedule(newSchedule);
    setShowModal(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const handleSubmit = () => {
    const hasSlots = schedule.some(day => day.slots.length > 0);
    
    if (hasSlots) {
        setSuccessMessage(true);
        setErrorMessage(false);
    } else {
        setSuccessMessage(false);
        setErrorMessage(true);
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
});